"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, CalendarCheck, User, LogOut, Shield, Building2 } from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { signOutAction } from "@/app/actions/auth";

interface UserMenuProps {
  email: string;
  fullName?: string | null;
  role?: string | null;
}

export default function UserMenu({ email, fullName, role }: UserMenuProps) {
  const t = useTranslations("userMenu");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Display name: full name or truncated email
  const displayName =
    fullName || email.split("@")[0].slice(0, 14);
  const initial = (fullName?.[0] || email[0] || "U").toUpperCase();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Role label
  const roleLabel =
    role === "admin" ? t("roleAdmin") : role === "host" ? t("roleHost") : t("roleGuest");

  return (
    <div ref={menuRef} className="user-menu-wrapper">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="user-menu-trigger"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="user-menu-avatar">{initial}</span>
        <span className="user-menu-name">{displayName}</span>
        <ChevronDown
          size={14}
          className={`user-menu-chevron ${open ? "user-menu-chevron--open" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="user-menu-dropdown">
          {/* User info */}
          <div className="user-menu-info">
            <span className="user-menu-info-email">{email}</span>
            <span className="user-menu-info-role">{roleLabel}</span>
          </div>

          <div className="user-menu-divider" />

          {/* ── Quick Navigation ── */}
          <div className="user-menu-section-label">{t("quickNav")}</div>

          <NextLink
            href="/guest/bookings"
            className="user-menu-item"
            onClick={() => setOpen(false)}
          >
            <CalendarCheck size={15} />
            <span>{t("myBookings")}</span>
          </NextLink>

          <NextLink
            href="/host/dashboard"
            className="user-menu-item"
            onClick={() => setOpen(false)}
          >
            <Building2 size={15} />
            <span>{t("hostDashboard")}</span>
          </NextLink>

          {role === "admin" && (
            <NextLink
              href="/admin"
              className="user-menu-item user-menu-item--admin"
              onClick={() => setOpen(false)}
            >
              <Shield size={15} />
              <span>{t("adminPanel")}</span>
            </NextLink>
          )}

          <div className="user-menu-divider" />

          <NextLink
            href="/guest/profile"
            className="user-menu-item"
            onClick={() => setOpen(false)}
          >
            <User size={15} />
            <span>{t("myProfile")}</span>
          </NextLink>

          <div className="user-menu-divider" />

          <form action={signOutAction}>
            <button type="submit" className="user-menu-item user-menu-item--danger">
              <LogOut size={15} />
              <span>{t("signOut")}</span>
            </button>
          </form>
        </div>
      )}

      <style>{`
        .user-menu-wrapper {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px 4px 4px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .user-menu-trigger:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(201, 168, 76, 0.3);
        }

        .user-menu-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #C9A84C;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .user-menu-name {
          color: white;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-menu-chevron {
          color: rgba(255, 255, 255, 0.5);
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }
        .user-menu-chevron--open {
          transform: rotate(180deg);
        }

        /* Dropdown */
        .user-menu-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 240px;
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
          z-index: 100;
          animation: userMenuFadeIn 0.15s ease-out;
        }

        @keyframes userMenuFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .user-menu-info {
          padding: 10px 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .user-menu-info-email {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.02em;
        }
        .user-menu-info-role {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #C9A84C;
          margin-top: 2px;
        }

        .user-menu-section-label {
          padding: 8px 12px 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.25);
        }

        .user-menu-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 4px 8px;
        }

        .user-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border: none;
          border-radius: 8px;
          background: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }
        .user-menu-item:hover {
          background: rgba(201, 168, 76, 0.08);
          color: #C9A84C;
        }

        .user-menu-item--admin {
          color: rgba(201, 168, 76, 0.8);
        }
        .user-menu-item--admin:hover {
          background: rgba(201, 168, 76, 0.12);
          color: #C9A84C;
        }

        .user-menu-item--danger:hover {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
        }

        /* Hide on small screens — mobile menu handles it */
        @media (max-width: 767px) {
          .user-menu-wrapper {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
