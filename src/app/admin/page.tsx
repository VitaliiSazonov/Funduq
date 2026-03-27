import { getAdminStats } from "@/app/actions/admin";
import {
  Building2,
  Clock,
  CalendarCheck,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    {
      label: "Active Listings",
      value: stats.activeListings,
      icon: Building2,
      color: "#22c55e",
      bg: "rgba(34, 197, 94, 0.08)",
    },
    {
      label: "Pending Review",
      value: stats.pendingReview,
      icon: Clock,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.08)",
      badge: stats.pendingReview > 0,
    },
    {
      label: "Bookings This Month",
      value: stats.bookingsThisMonth,
      icon: CalendarCheck,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.08)",
    },
    {
      label: "Registered Users",
      value: stats.totalUsers,
      icon: Users,
      color: "#a855f7",
      bg: "rgba(168, 85, 247, 0.08)",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#E5E5E5",
          margin: "0 0 6px",
        }}>
          Dashboard
        </h1>
        <p style={{
          fontSize: 14,
          color: "#8A8A8A",
          margin: 0,
        }}>
          Overview of your Funduq marketplace
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 20,
      }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{
                background: "#161616",
                border: "1px solid rgba(197, 160, 89, 0.1)",
                borderRadius: 12,
                padding: 24,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle glow */}
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: card.bg,
                  filter: "blur(24px)",
                }}
              />

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                position: "relative",
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon size={20} color={card.color} />
                </div>

                {card.badge && (
                  <span style={{
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 20,
                    letterSpacing: 0.5,
                  }}>
                    NEEDS ATTENTION
                  </span>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <p style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#E5E5E5",
                  margin: "0 0 4px",
                  letterSpacing: "-0.02em",
                }}>
                  {card.value.toLocaleString()}
                </p>
                <p style={{
                  fontSize: 13,
                  color: "#8A8A8A",
                  margin: 0,
                  fontWeight: 500,
                }}>
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
