"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/app/actions/wishlist";

interface WishlistButtonProps {
  propertyId: string;
  initialWishlisted?: boolean;
  /** Size variant: 'sm' for cards, 'lg' for detail pages */
  size?: "sm" | "lg";
  /** Custom class overrides */
  className?: string;
}

export default function WishlistButton({
  propertyId,
  initialWishlisted = false,
  size = "sm",
  className = "",
}: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  const iconSize = size === "lg" ? "w-6 h-6" : "w-5 h-5";

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleWishlist(propertyId);
      if (result.error === "NOT_AUTHENTICATED") {
        // Could redirect to sign-in or show a toast
        return;
      }
      setWishlisted(result.wishlisted);
    });
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault(); // Prevent navigation if inside a Link
        e.stopPropagation();
        handleToggle();
      }}
      disabled={isPending}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`
        cursor-pointer transition-all duration-200
        ${isPending ? "opacity-50 scale-90" : "hover:scale-110 active:scale-95"}
        ${className}
      `}
    >
      <Heart
        className={`
          ${iconSize} drop-shadow-md transition-all duration-300
          ${
            wishlisted
              ? "text-red-500 fill-red-500"
              : "text-white fill-white/20"
          }
        `}
      />
    </button>
  );
}
