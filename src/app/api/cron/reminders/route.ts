import { NextResponse } from 'next/server';
import { sendBookingReminders } from '@/app/actions/reminders';

export const dynamic = 'force-dynamic';

/**
 * Endpoint for Vercel Cron to trigger booking reminders.
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  // Verify that the request comes from Vercel Cron
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendBookingReminders();
    return NextResponse.json({ 
      success: true, 
      sent: result.sent,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Booking reminders cron failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
