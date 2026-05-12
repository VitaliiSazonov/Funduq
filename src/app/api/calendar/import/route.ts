import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncCalendarFeed } from "@/lib/ical-sync";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { property_id, ical_url, source_name } = body;

        if (!property_id || !ical_url || !source_name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // SSRF prevention basic validation
        if (!ical_url.startsWith('http://') && !ical_url.startsWith('https://')) {
            return NextResponse.json({ error: "Invalid URL scheme" }, { status: 400 });
        }
        if (ical_url.includes('localhost') || ical_url.includes('127.0.0.1')) {
            return NextResponse.json({ error: "Invalid URL destination" }, { status: 400 });
        }

        // Verify ownership
        const { data: property } = await supabase
            .from('properties')
            .select('owner_id')
            .eq('id', property_id)
            .single();

        if (!property || property.owner_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized property access" }, { status: 403 });
        }

        // Find existing feed or create one
        let feedId: string;
        const { data: existingFeed } = await supabase
            .from('calendar_feeds')
            .select('id')
            .eq('property_id', property_id)
            .eq('ical_url', ical_url)
            .single();

        if (existingFeed) {
            feedId = existingFeed.id;
        } else {
            const { data: newFeed, error: createError } = await supabase
                .from('calendar_feeds')
                .insert({
                    property_id,
                    ical_url,
                    source_name
                })
                .select('id')
                .single();
                
            if (createError) throw createError;
            feedId = newFeed.id;
        }

        // Synchronize using the helper
        const result = await syncCalendarFeed(supabase, feedId, property_id, ical_url, source_name);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, imported: result.eventsImported });
    } catch (error) {
        console.error("Calendar import error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
