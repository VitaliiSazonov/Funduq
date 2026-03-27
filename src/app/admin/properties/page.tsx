import { getAllAdminProperties } from "@/app/actions/admin";
import type { PropertyWithHost } from "@/app/actions/admin";
import PropertyModerationRow from "@/components/admin/PropertyModerationRow";
import { Building2 } from "lucide-react";
import AdminPropertiesTabs from "@/components/admin/AdminPropertiesTabs";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminPropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "all";
  const properties = await getAllAdminProperties(statusFilter);

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
          Properties
        </h1>
        <p style={{ fontSize: 14, color: "#8A8A8A", margin: 0 }}>
          Review and moderate property listings
        </p>
      </div>

      {/* Tabs */}
      <AdminPropertiesTabs activeTab={statusFilter} />

      {/* Table */}
      <div
        style={{
          background: "#161616",
          border: "1px solid rgba(197, 160, 89, 0.1)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {properties.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
            }}
          >
            <Building2
              size={40}
              style={{ color: "#3A3A3A", marginBottom: 16 }}
            />
            <p style={{ fontSize: 15, color: "#8A8A8A", margin: 0 }}>
              No properties found for this filter.
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
                  {["", "Property", "Host", "Submitted", "Status", ""].map(
                    (h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "12px 16px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#8A8A8A",
                          textAlign: i === 5 ? "right" : "left",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {properties.map((property: PropertyWithHost) => (
                  <PropertyModerationRow
                    key={property.id}
                    property={property}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
