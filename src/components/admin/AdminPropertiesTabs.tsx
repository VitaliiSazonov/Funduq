"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending_review", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
] as const;

interface AdminPropertiesTabsProps {
  activeTab: string;
}

export default function AdminPropertiesTabs({
  activeTab,
}: AdminPropertiesTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 20,
        background: "#161616",
        padding: 4,
        borderRadius: 10,
        border: "1px solid rgba(197, 160, 89, 0.08)",
        width: "fit-content",
      }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Link
            key={tab.key}
            href={`/admin/properties?status=${tab.key}`}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.15s",
              color: active ? "#C5A059" : "#8A8A8A",
              background: active ? "rgba(197, 160, 89, 0.1)" : "transparent",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
