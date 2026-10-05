import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '../../../../lib/webpush';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid push subscription payload' },
        { status: 400 }
      );
    }

    const saved = savePushSubscription(subscription, userId);

    // Also persist to Supabase push_subscriptions table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey && userId && subscription.keys) {
      try {
        const supabase = createServerClient(supabaseUrl, supabaseKey, {
          cookies: {
            getAll() {
              return req.cookies.getAll();
            },
            setAll() {},
          },
        });
        const { error } = await supabase.from('push_subscriptions').upsert(
          {
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            user_agent: req.headers.get('user-agent') || null,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );
        if (error) {
          console.warn('[api/push/subscribe] Supabase write warning:', error.message);
        }
      } catch (dbErr) {
        console.warn('[api/push/subscribe] Supabase write skipped:', dbErr);
      }
    }

    return NextResponse.json({ success: saved });
  } catch (err: any) {
    console.error('Error in /api/push/subscribe:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
