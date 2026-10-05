import { NextResponse } from 'next/server';

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BP3z4ZMTsW6xNUBZ9pyQ5Yt9OkdnAiQVE-H6mg5dDM6n4casg3OFBlVgyETuyFuNE5HBqEvjnI-tUvNtHwH9G_Y';

  return NextResponse.json({ publicKey });
}
