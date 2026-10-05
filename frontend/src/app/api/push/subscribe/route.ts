import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '../../../../lib/webpush';

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
    return NextResponse.json({ success: saved });
  } catch (err: any) {
    console.error('Error in /api/push/subscribe:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
