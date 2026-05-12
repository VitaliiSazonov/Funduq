import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncCalendarFeed } from "@/lib/ical-sync";

// Force Node.js runtime for this cron to allow 'node-ical' usage if needed
export const runtime = 'nodejs';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        
        // Simple Bearer token check for Vercel Cron
        // Vercel sends `Bearer ${CRON_SECRET}` if configured
        if (
            process.env.CRON_SECRET && 
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        // Service role to bypass RLS and update all feeds
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: feeds, error } = await supabase
            .from('calendar_feeds')
            .select('*');

        if (error) {
            throw error;
        }

        if (!feeds || feeds.length === 0) {
            return NextResponse.json({ success: true, message: "No feeds to sync" });
        }

        const results = [];

        for (const feed of feeds) {
            // Reusing the sync helper function
            const result = await syncCalendarFeed(
                supabase,
                feed.id,
                feed.property_id,
                feed.ical_url,
                feed.source_name
            );
            
            results.push({
                feed_id: feed.id,
                property_id: feed.property_id,
                ...result
            });
        }

        return NextResponse.json({
            success: true,
            totalFeeds: feeds.length,
            results
        });

    } catch (error) {
        console.error("Cron sync error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
