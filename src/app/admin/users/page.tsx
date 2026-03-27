import { createClient } from "@/lib/supabase/server";
import { Users, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  verified: boolean;
  created_at: string;
  email?: string;
}

export default async function AdminUsersPage() {
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

  // Fetch all profiles
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, verified, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin] Failed to fetch users:", error);
  }

  const profiles: UserProfile[] = (users || []).map(
    (u: Record<string, unknown>) => ({
      id: u.id as string,
      full_name: u.full_name as string | null,
      avatar_url: u.avatar_url as string | null,
      role: u.role as string,
      verified: u.verified as boolean,
      created_at: u.created_at as string,
    })
  );

  const roleBadgeConfig: Record<
    string,
    { bg: string; color: string; label: string }
  > = {
    admin: {
      bg: "rgba(197, 160, 89, 0.12)",
      color: "#C5A059",
      label: "Admin",
    },
    host: {
      bg: "rgba(59, 130, 246, 0.12)",
      color: "#3b82f6",
      label: "Host",
    },
    owner: {
      bg: "rgba(59, 130, 246, 0.12)",
      color: "#3b82f6",
      label: "Host",
    },
    guest: {
      bg: "rgba(156, 163, 175, 0.12)",
      color: "#9ca3af",
      label: "Guest",
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
          Users
        </h1>
        <p style={{ fontSize: 14, color: "#8A8A8A", margin: 0 }}>
          All registered users on Funduq · Read-only
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
        {profiles.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Users size={40} style={{ color: "#3A3A3A", marginBottom: 16 }} />
            <p style={{ fontSize: 15, color: "#8A8A8A", margin: 0 }}>
              No users found.
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
                  {["", "Name", "Role", "Verified", "Joined"].map((h, i) => (
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
                {profiles.map((u) => {
                  const badge = roleBadgeConfig[u.role] || roleBadgeConfig.guest;
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: "1px solid rgba(197, 160, 89, 0.06)",
                      }}
                    >
                      {/* Avatar */}
                      <td style={{ padding: "12px 16px", width: 48 }}>
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatar_url}
                            alt={u.full_name || "User"}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid rgba(197, 160, 89, 0.15)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "rgba(197, 160, 89, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#C5A059",
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {(u.full_name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>

                      {/* Name */}
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#E5E5E5",
                            margin: 0,
                          }}
                        >
                          {u.full_name || "—"}
                        </p>
                      </td>

                      {/* Role */}
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
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Verified */}
                      <td style={{ padding: "12px 16px" }}>
                        {u.verified ? (
                          <CheckCircle size={16} color="#22c55e" />
                        ) : (
                          <XCircle size={16} color="#6b6b6b" />
                        )}
                      </td>

                      {/* Joined */}
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#8A8A8A",
                            margin: 0,
                          }}
                        >
                          {new Date(u.created_at).toLocaleDateString("en-GB", {
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
