import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

export interface StoredSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string | null;
  createdAt: string;
}

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), '.push_subscriptions.json');

// Ensure VAPID is configured
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BP3z4ZMTsW6xNUBZ9pyQ5Yt9OkdnAiQVE-H6mg5dDM6n4casg3OFBlVgyETuyFuNE5HBqEvjnI-tUvNtHwH9G_Y';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'XAyAr2ubK6MacAsCa-uqlb-kn7Avty9pS3bT-bpK6X8';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'https://xvxkkqdnatnqumnlshlg.supabase.co';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn('[webpush] Failed to initialize VAPID credentials:', err);
}

function loadSubscriptions(): StoredSubscription[] {
  try {
    if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[webpush] Error reading subscriptions file:', err);
    return [];
  }
}

function persistSubscriptions(subs: StoredSubscription[]) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[webpush] Error writing subscriptions file:', err);
  }
}

export function savePushSubscription(sub: any, userId?: string | null): boolean {
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
    return false;
  }

  const subs = loadSubscriptions();
  const existingIdx = subs.findIndex((s) => s.endpoint === sub.endpoint);

  const entry: StoredSubscription = {
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime || null,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    userId: userId || null,
    createdAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    subs[existingIdx] = entry;
  } else {
    subs.push(entry);
  }

  persistSubscriptions(subs);
  return true;
}

export function removePushSubscription(endpoint: string): void {
  const subs = loadSubscriptions();
  const filtered = subs.filter((s) => s.endpoint !== endpoint);
  persistSubscriptions(filtered);
}

export async function broadcastPushNotification(payload: {
  title: string;
  body: string;
  severity?: string;
  url?: string;
  eventId?: string;
  icon?: string;
}): Promise<{ sent: number; failed: number }> {
  const subs = loadSubscriptions();
  if (subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const jsonPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    severity: payload.severity || 'CRITICAL',
    url: payload.url || '/',
    eventId: payload.eventId || `event-${Date.now()}`,
    icon: payload.icon || '/icons/icon-192.png',
  });

  let sent = 0;
  let failed = 0;
  const toDelete: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        jsonPayload,
        {
          TTL: 60 * 60, // 1 hour
          urgency: 'high',
        }
      );
      sent++;
    } catch (err: any) {
      failed++;
      // If subscription has expired or unsubscribed, queue for deletion
      if (err.statusCode === 404 || err.statusCode === 410) {
        toDelete.push(sub.endpoint);
      } else {
        console.warn(`[webpush] Failed to deliver push to ${sub.endpoint.slice(0, 40)}...`, err.message);
      }
    }
  }

  if (toDelete.length > 0) {
    const updated = subs.filter((s) => !toDelete.includes(s.endpoint));
    persistSubscriptions(updated);
  }

  return { sent, failed };
}
