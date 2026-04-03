"use client";

import { useEffect, useRef } from "react";
import { trackPropertyView } from "@/app/actions/popularity";

interface ViewTrackerProps {
  propertyId: string;
}

/**
 * Invisible client component that fires a view-tracking call once
 * when a property detail page mounts. Uses a session-based hash
 * for deduplication of anonymous visitors.
 */
export default function ViewTracker({ propertyId }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Generate a simple session hash from timestamp + random for anonymous dedup
    let sessionHash = sessionStorage.getItem("funduq_session");
    if (!sessionHash) {
      sessionHash = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("funduq_session", sessionHash);
    }

    trackPropertyView(propertyId, sessionHash).catch(() => {
      // Silently fail — view tracking should never block the user
    });
  }, [propertyId]);

  return null; // Renders nothing
}
