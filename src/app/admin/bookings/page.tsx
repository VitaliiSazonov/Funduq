import { createClient } from "@/lib/supabase/server";
import { CalendarCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface BookingRow {
  id: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  status: string;
  created_at: string;
  property: {
    title: string;
    location_emirate: string;
  } | null;
  guest: {
    full_name: string | null;
  } | null;
}

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;

  // Fetch bookings with relations
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      id, check_in, check_out, total_guests, status, created_at,
      property:properties!bookings_property_id_fkey (
        title, location_emirate
      ),
      guest:profiles!bookings_guest_id_fkey (
        full_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[Admin] Failed to fetch bookings:", error);
  }

  const rows: BookingRow[] = (bookings || []).map(
    (b: Record<string, unknown>) => ({
      id: b.id as string,
      check_in: b.check_in as string,
      check_out: b.check_out as string,
      total_guests: b.total_guests as number,
      status: b.status as string,
      created_at: b.created_at as string,
      property: b.property as BookingRow["property"],
      guest: b.guest as BookingRow["guest"],
    })
  );

  const statusConfig: Record<
    string,
    { bg: string; color: string; label: string }
  > = {
    pending: {
      bg: "rgba(245, 158, 11, 0.12)",
      color: "#f59e0b",
      label: "Pending",
    },
    confirmed: {
      bg: "rgba(34, 197, 94, 0.12)",
      color: "#22c55e",
      label: "Confirmed",
    },
    declined: {
      bg: "rgba(239, 68, 68, 0.12)",
      color: "#ef4444",
      label: "Declined",
    },
    cancelled: {
      bg: "rgba(156, 163, 175, 0.12)",
      color: "#9ca3af",
      label: "Cancelled",
    },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#E5E5E5",
            margin: "0 0 6px",
          }}
        >
          Bookings
        </h1>
        <p style={{ fontSize: 14, color: "#8A8A8A", margin: 0 }}>
          All booking activity across the platform · Read-only
        </p>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#161616",
          border: "1px solid rgba(197, 160, 89, 0.1)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <CalendarCheck
              size={40}
              style={{ color: "#3A3A3A", marginBottom: 16 }}
            />
            <p style={{ fontSize: 15, color: "#8A8A8A", margin: 0 }}>
              No bookings yet.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(197, 160, 89, 0.1)",
                  }}
                >
                  {[
                    "Property",
                    "Guest",
                    "Check-in",
                    "Check-out",
                    "Guests",
                    "Status",
                    "Booked",
                  ].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "12px 16px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#8A8A8A",
                        textAlign: "left",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const s =
                    statusConfig[b.status] || statusConfig.pending;
                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: "1px solid rgba(197, 160, 89, 0.06)",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#E5E5E5",
                            margin: "0 0 2px",
                          }}
                        >
                          {b.property?.title || "—"}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#8A8A8A",
                            margin: 0,
                          }}
                        >
                          {b.property?.location_emirate || ""}
                        </p>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            fontSize: 14,
                            color: "#B5B5B5",
                            margin: 0,
                          }}
                        >
                          {b.guest?.full_name || "—"}
                        </p>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#8A8A8A",
                            margin: 0,
                          }}
                        >
                          {new Date(b.check_in).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#8A8A8A",
                            margin: 0,
                          }}
                        >
                          {new Date(b.check_out).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#8A8A8A",
                            margin: 0,
                          }}
                        >
                          {b.total_guests}
                        </p>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background: s.bg,
                            color: s.color,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: s.color,
                            }}
                          />
                          {s.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#8A8A8A",
                            margin: 0,
                          }}
                        >
                          {new Date(b.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
