import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProperty } from "@/app/actions/getProperty";
import CalendarSyncClient from "./CalendarSyncClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CalendarSyncPage({ params }: PageProps) {
  const { id } = await params;

  // Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  // Only the owner can edit
  if (property.owner_id !== user.id) {
    notFound();
  }

  // Fetch existing calendar feeds
  const { data: feeds } = await supabase
    .from('calendar_feeds')
    .select('*')
    .eq('property_id', id)
    .order('created_at', { ascending: false });

  // Fetch existing blocked dates
  const { data: blockedDates } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('property_id', id)
    .order('start_date', { ascending: true });

  return (
    <CalendarSyncClient 
      propertyId={id} 
      propertyTitle={property.title}
      initialFeeds={feeds || []}
      blockedDates={blockedDates || []}
    />
  );
}
