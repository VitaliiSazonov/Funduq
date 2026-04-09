"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Menu, X, Home, Search, CalendarDays, User, LogOut, Plus, LayoutDashboard } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

interface MobileMenuButtonProps {
  /** "host" shows host-specific links, "guest" shows guest-specific links */
  variant: "host" | "guest";
}

export default function MobileMenuButton({ variant }: MobileMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("mobileNav");

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-charcoal/5 transition-colors cursor-pointer"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-charcoal" />
        ) : (
          <Menu className="w-6 h-6 text-charcoal" />
        )}
      </button>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-0 top-16 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xl z-50 animate-slideDown">
          <nav className="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-1">
            {/* Common: Home */}
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-charcoal/70 hover:bg-offwhite hover:text-charcoal transition-colors text-sm font-bold"
            >
              <Home className="w-4.5 h-4.5" />
              {t("home")}
            </Link>

            {/* Common: Explore */}
            <Link
              href="/villas"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-charcoal/70 hover:bg-offwhite hover:text-charcoal transition-colors text-sm font-bold"
            >
              <Search className="w-4.5 h-4.5" />
              {t("explore")}
            </Link>

            <hr className="border-gray-100 my-2" />

            {variant === "host" && (
              <>
                {/* Host Dashboard */}
                <Link
                  href="/host/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-charcoal/70 hover:bg-offwhite hover:text-charcoal transition-colors text-sm font-bold"
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  {t("dashboard")}
                </Link>

                {/* Host Bookings */}
                <Link
                  href="/host/bookings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-charcoal/70 hover:bg-offwhite hover:text-charcoal transition-colors text-sm font-bold"
                >
                  <CalendarDays className="w-4.5 h-4.5" />
                  {t("bookings")}
                </Link>

                {/* Add Property */}
                <Link
                  href="/host/properties/new"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gold hover:bg-gold/5 transition-colors text-sm font-bold"
                >
                  <Plus className="w-4.5 h-4.5" />
                  {t("addProperty")}
                </Link>
              </>
            )}

            {variant === "guest" && (
              <>
                {/* My Bookings */}
                <Link
                  href="/guest/bookings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-charcoal/70 hover:bg-offwhite hover:text-charcoal transition-colors text-sm font-bold"
                >
                  <CalendarDays className="w-4.5 h-4.5" />
                  {t("myBookings")}
                </Link>

                {/* My Profile */}
                <Link
                  href="/guest/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-charcoal/70 hover:bg-offwhite hover:text-charcoal transition-colors text-sm font-bold"
                >
                  <User className="w-4.5 h-4.5" />
                  {t("myProfile")}
                </Link>
              </>
            )}

            <hr className="border-gray-100 my-2" />

            {/* Sign Out */}
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-bold cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
                {t("signOut")}
              </button>
            </form>
          </nav>
        </div>
      )}
    </div>
  );
}
