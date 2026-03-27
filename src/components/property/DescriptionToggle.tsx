"use client";

import { useState } from "react";

interface DescriptionToggleProps {
  text: string;
  maxLength?: number;
}

export default function DescriptionToggle({
  text,
  maxLength = 300,
}: DescriptionToggleProps) {
  const [expanded, setExpanded] = useState(false);

  const needsTruncation = text.length > maxLength;
  const displayText =
    expanded || !needsTruncation ? text : text.slice(0, maxLength) + "…";

  return (
    <div>
      <p className="text-charcoal/60 leading-relaxed whitespace-pre-wrap text-[15px]">
        {displayText}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm font-bold text-gold-dark hover:text-gold transition-colors underline underline-offset-4 cursor-pointer"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
