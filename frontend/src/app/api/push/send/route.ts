import { NextRequest, NextResponse } from 'next/server';
import { broadcastPushNotification } from '../../../../lib/webpush';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, body: alertBody, severity, url, eventId, delaySeconds } = body;

    if (delaySeconds && typeof delaySeconds === 'number' && delaySeconds > 0) {
      const waitMs = Math.min(delaySeconds * 1000, 30000);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    const result = await broadcastPushNotification({
      title: title || '🚨 AegisWatch Crisis Alert',
      body: alertBody || 'Critical disaster activity detected by global sensor net.',
      severity: severity || 'CRITICAL',
      url: url || '/',
      eventId: eventId || `alert-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (err: any) {
    console.error('Error in /api/push/send:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
