import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ property_id: string }> }
) {
    try {
        const { property_id } = await params;
        
        // Use an anonymous/public client or a service role client 
        // to read blocked_dates since it should be public for iCal export
        // Public has SELECT access to blocked_dates due to RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { data: blockedDates, error } = await supabase
            .from('blocked_dates')
            .select('start_date, end_date, external_uid, summary')
            .eq('property_id', property_id);

        if (error) {
            console.error("Error fetching blocked dates:", error);
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }

        // Build iCal string
        let icalContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Funduq//Calendar Sync//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        if (blockedDates) {
            blockedDates.forEach((block) => {
                // Ensure dates are parsed correctly
                const start = parseISO(block.start_date);
                const end = parseISO(block.end_date);
                const uid = block.external_uid || `funduq-${block.start_date}-${block.end_date}`;
                const summary = block.summary || 'Blocked';
                
                // Format DTSTART and DTEND for iCal (YYYYMMDD)
                const startStr = format(start, 'yyyyMMdd');
                const endStr = format(end, 'yyyyMMdd');
                const timestamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

                icalContent.push(
                    'BEGIN:VEVENT',
                    `UID:${uid}`,
                    `DTSTAMP:${timestamp}`,
                    `DTSTART;VALUE=DATE:${startStr}`,
                    `DTEND;VALUE=DATE:${endStr}`,
                    `SUMMARY:${summary}`,
                    'END:VEVENT'
                );
            });
        }

        icalContent.push('END:VCALENDAR');

        return new NextResponse(icalContent.join('\r\n'), {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': `attachment; filename="funduq-${property_id}.ics"`,
                'Cache-Control': 'max-age=3600'
            }
        });
    } catch (error) {
        console.error("Calendar export error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
