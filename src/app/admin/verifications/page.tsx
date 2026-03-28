import { getPendingPassports } from "@/app/actions/admin";
import type { UserWithPassport } from "@/app/actions/admin";
import PassportVerificationRow from "@/components/admin/PassportVerificationRow";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const pendingPassports = await getPendingPassports();

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
          Identity Verifications
        </h1>
        <p style={{ fontSize: 14, color: "#8A8A8A", margin: 0 }}>
          Review and verify guest passport submissions
        </p>
      </div>

      {/* Stats Badge */}
      {pendingPassports.length > 0 && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#f59e0b",
              display: "inline-block",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#f59e0b",
            }}
          >
            {pendingPassports.length} pending verification
            {pendingPassports.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "#161616",
          border: "1px solid rgba(197, 160, 89, 0.1)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {pendingPassports.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
            }}
          >
            <ShieldCheck
              size={40}
              style={{ color: "#22c55e", marginBottom: 16 }}
            />
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#E5E5E5",
                margin: "0 0 6px",
              }}
            >
              All clear
            </p>
            <p style={{ fontSize: 14, color: "#8A8A8A", margin: 0 }}>
              No pending passport verifications at this time.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(197, 160, 89, 0.1)",
                  }}
                >
                  {["Guest", "Submitted", "Status", ""].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "12px 16px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#8A8A8A",
                        textAlign: i === 3 ? "right" : "left",
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
                {pendingPassports.map((user: UserWithPassport) => (
                  <PassportVerificationRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Important privacy note */}
      <div
        style={{
          marginTop: 20,
          padding: "14px 18px",
          background: "rgba(197, 160, 89, 0.04)",
          border: "1px solid rgba(197, 160, 89, 0.08)",
          borderRadius: 8,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🔒</span>
        <p
          style={{
            fontSize: 12,
            color: "#8A8A8A",
            margin: 0,
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: "#C5A059" }}>Privacy Notice:</strong> Passport
          images are not displayed here. Use &quot;View&quot; to generate a
          time-limited signed URL (60s) that opens in a new tab. All access is
          logged.
        </p>
      </div>

      {/* Keyframe for pulsing dot */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
