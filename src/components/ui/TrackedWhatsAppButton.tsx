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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (window as any).trackWhatsAppAndRedirect === "function"
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).trackWhatsAppAndRedirect(href);
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
