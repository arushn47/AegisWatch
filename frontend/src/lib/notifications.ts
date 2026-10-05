import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Client helpers for the `notifications` table.
 *
 * Rows are created server-side by the `fn_notify_disaster_event` trigger, so
 * the client only ever reads, subscribes, and marks rows as read. Every
 * function degrades gracefully when the schema has not been applied yet.
 */

export interface NotificationRow {
  id: string;
  user_id: string;
  disaster_event_id: string | null;
  risk_level: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  channel: string;
  created_at: string;
  read_at: string | null;
}

const TABLE = 'notifications';

export async function fetchNotifications(
  client: SupabaseClient,
  userId: string,
  limit = 30
): Promise<NotificationRow[] | null> {
  try {
    const { data, error } = await client
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[notifications] fetch skipped:', error.message);
      return null; // signals "not available" so the UI can fall back
    }
    return (data ?? []) as NotificationRow[];
  } catch (err) {
    console.warn('[notifications] fetch failed:', err);
    return null;
  }
}

/**
 * Streams new notifications for a user over Supabase Realtime. Returns an
 * unsubscribe function.
 */
export function subscribeToNotifications(
  client: SupabaseClient,
  userId: string,
  onInsert: (row: NotificationRow) => void
): () => void {
  let channel: ReturnType<SupabaseClient['channel']> | null = null;

  try {
    channel = client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLE,
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: unknown }) => {
          onInsert(payload.new as NotificationRow);
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('[notifications] realtime subscribe failed:', err);
  }

  return () => {
    if (channel) {
      try {
        void client.removeChannel(channel);
      } catch {
        /* noop */
      }
    }
  };
}

/**
 * Marks every unread notification for the current user as read.
 *
 * Prefers the `mark_all_notifications_read()` RPC, but falls back to a plain
 * owner-scoped UPDATE (allowed by the "updatable by owner" RLS policy) so the
 * workflow still works on databases where the RPC has not been applied yet.
 */
export async function markAllNotificationsRead(
  client: SupabaseClient,
  userId?: string
): Promise<boolean> {
  try {
    const { error } = await client.rpc('mark_all_notifications_read');
    if (!error) return true;
    console.warn('[notifications] mark-all-read RPC unavailable, using fallback:', error.message);
  } catch (err) {
    console.warn('[notifications] mark-all-read RPC failed, using fallback:', err);
  }

  if (!userId) return false;

  try {
    const { error } = await client
      .from(TABLE)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) {
      console.warn('[notifications] mark-all-read fallback skipped:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[notifications] mark-all-read fallback failed:', err);
    return false;
  }
}

/**
 * Permanently deletes every notification for the current user (owner-scoped
 * DELETE policy). Used by the Notification Centre's "Clear all" action so the
 * badge and the list are emptied for good, not just marked read.
 */
export async function clearAllNotifications(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await client.from(TABLE).delete().eq('user_id', userId);
    if (error) {
      console.warn('[notifications] clear-all skipped:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[notifications] clear-all failed:', err);
    return false;
  }
}

/** Marks a single notification as read. */
export async function markNotificationRead(
  client: SupabaseClient,
  id: string
): Promise<boolean> {
  try {
    const { error } = await client
      .from(TABLE)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}
