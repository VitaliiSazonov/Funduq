"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export default function AdminSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("search") || "");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value === (searchParams.get("search") || "")) return;

      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [value, router, searchParams]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 400,
      }}
    >
      <Search
        size={18}
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#6A6A6A",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        placeholder="Search by ID or property name..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          background: "#161616",
          border: "1px solid rgba(197, 160, 89, 0.1)",
          borderRadius: 8,
          padding: "10px 12px 10px 40px",
          fontSize: 14,
          color: "#E5E5E5",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(197, 160, 89, 0.4)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(197, 160, 89, 0.1)")}
      />
      {isPending && (
        <div
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 10,
            color: "#C5A059",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontWeight: 600,
          }}
        >
          Searching...
        </div>
      )}
    </div>
  );
}
