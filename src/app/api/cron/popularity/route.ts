import { NextResponse } from 'next/server';
import { recalculatePopularityScores } from '@/app/actions/popularity';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await recalculatePopularityScores();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Popularity cron failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
