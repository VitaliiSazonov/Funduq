// Removed top-level import to prevent build evaluation errors
// import ical from 'node-ical';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// Use admin client for cron/background tasks to bypass RLS, or authenticated client
export async function syncCalendarFeed(
    supabase: any,
    feedId: string,
    propertyId: string,
    icalUrl: string,
    sourceName: string
) {
    try {
        // Fetch ical data
        const response = await fetch(icalUrl, {
            headers: {
                'User-Agent': 'Funduq-Calendar-Sync/1.0',
                'Accept': 'text/calendar'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch iCal: ${response.statusText}`);
        }

        const icalData = await response.text();
        const ical = await import('node-ical');
        const events = await ical.async.parseICS(icalData);

        const blockedDatesToInsert: any[] = [];
        const incomingExternalUids: string[] = [];

        for (const k in events) {
            if (events.hasOwnProperty(k)) {
                const ev = events[k];
                if (ev && ev.type === 'VEVENT') {
                    // Extract start and end dates
                    const start = ev.start as Date;
                    const end = ev.end as Date;
                    const uid = ev.uid as string;
                    const summary = ev.summary as string || 'Blocked';

                    if (start && end && uid) {
                        incomingExternalUids.push(uid);
                        blockedDatesToInsert.push({
                            property_id: propertyId,
                            start_date: format(start, 'yyyy-MM-dd'),
                            end_date: format(end, 'yyyy-MM-dd'),
                            source: sourceName.toLowerCase(), // e.g. airbnb, booking
                            external_uid: uid,
                            summary: summary
                        });
                    }
                }
            }
        }

        // ─── Step 1: Prune Deleted/Cancelled Future Blocks ───
        // If a block is removed from the remote iCal feed, we need to clear it from Funduq too.
        // We only delete upcoming events (end_date >= today) to avoid damaging historical data.
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        let pruneQuery = supabase
            .from('blocked_dates')
            .delete()
            .eq('property_id', propertyId)
            .eq('source', sourceName.toLowerCase())
            .gte('end_date', todayStr);
        
        if (incomingExternalUids.length > 0) {
            pruneQuery = pruneQuery.not('external_uid', 'in', `(${incomingExternalUids.map(u => `"${u}"`).join(',')})`);
        }
        
        const { error: pruneError } = await pruneQuery;
        if (pruneError) {
            console.error("Error pruning deleted blocked dates:", pruneError);
        }

        // ─── Step 2: Upsert Current Blocks ───
        if (blockedDatesToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('blocked_dates')
                .upsert(blockedDatesToInsert, {
                    onConflict: 'property_id,external_uid',
                    ignoreDuplicates: false // Update start/end dates if they changed remotely
                });

            if (insertError) {
                console.error("Error inserting blocked dates:", insertError);
                throw insertError;
            }
        }

        // ─── Step 3: Mark Last Sync ───
        await supabase
            .from('calendar_feeds')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', feedId);

        return { success: true, eventsImported: blockedDatesToInsert.length };
    } catch (error) {
        console.error(`Sync failed for feed ${feedId}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
