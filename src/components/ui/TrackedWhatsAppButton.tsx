"use client";

import { ReactNode } from "react";

interface TrackedWhatsAppButtonProps {
  href: string;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
}

export default function TrackedWhatsAppButton({
  href,
  className,
  children,
  target,
  rel,
}: TrackedWhatsAppButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (
      typeof window !== "undefined" &&
      typeof window.trackWhatsAppAndRedirect === "function"
    ) {
      window.trackWhatsAppAndRedirect(href);
    } else {
      window.location.href = href;
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  );
}
