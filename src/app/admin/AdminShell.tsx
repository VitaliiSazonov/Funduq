"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
] as const;

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="admin-root">
      {/* ── Mobile Top Bar ── */}
      <header className="admin-mobile-header">
        <button
          onClick={() => setSidebarOpen(true)}
          className="admin-mobile-menu-btn"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>
        <div className="admin-mobile-brand">
          <Shield size={18} className="admin-gold" />
          <span>Funduq Admin</span>
        </div>
        <div style={{ width: 40 }} />
      </header>

      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="admin-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? "admin-sidebar--open" : ""}`}
      >
        {/* Brand */}
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-inner">
            <Shield size={22} className="admin-gold" />
            <span className="admin-brand-text">Funduq Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="admin-sidebar-close"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`admin-nav-link ${active ? "admin-nav-link--active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="admin-nav-indicator"
                    className="admin-nav-indicator"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="admin-main">
        {children}
      </main>

      <style>{`
        /* ── Admin Dark Theme — fully isolated ── */
        .admin-root {
          display: flex;
          min-height: 100vh;
          background: #0F0F0F;
          color: #E5E5E5;
          font-family: Inter, system-ui, -apple-system, sans-serif;
        }

        /* ── Mobile Header ── */
        .admin-mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: rgba(15, 15, 15, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(197, 160, 89, 0.12);
          z-index: 50;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        .admin-mobile-menu-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(197, 160, 89, 0.08);
          border: 1px solid rgba(197, 160, 89, 0.15);
          border-radius: 8px;
          color: #C5A059;
          cursor: pointer;
          transition: background 0.2s;
        }
        .admin-mobile-menu-btn:hover {
          background: rgba(197, 160, 89, 0.15);
        }

        .admin-mobile-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 15px;
          color: #C5A059;
          letter-spacing: 1px;
        }

        /* ── Overlay ── */
        .admin-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 99;
        }

        /* ── Sidebar ── */
        .admin-sidebar {
          width: 260px;
          min-height: 100vh;
          background: #0A0A0A;
          border-right: 1px solid rgba(197, 160, 89, 0.1);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          z-index: 100;
        }

        .admin-sidebar-brand {
          padding: 24px 20px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(197, 160, 89, 0.08);
        }

        .admin-sidebar-brand-inner {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-brand-text {
          font-weight: 700;
          font-size: 16px;
          color: #C5A059;
          letter-spacing: 1px;
        }

        .admin-sidebar-close {
          display: none;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          background: rgba(197, 160, 89, 0.08);
          border: none;
          border-radius: 6px;
          color: #C5A059;
          cursor: pointer;
        }

        /* ── Nav ── */
        .admin-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .admin-nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          color: #8A8A8A;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .admin-nav-link:hover {
          color: #C5A059;
          background: rgba(197, 160, 89, 0.06);
        }
        .admin-nav-link--active {
          color: #C5A059;
          background: rgba(197, 160, 89, 0.1);
        }

        .admin-nav-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: #C5A059;
          border-radius: 0 3px 3px 0;
        }

        /* ── Footer ── */
        .admin-sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid rgba(197, 160, 89, 0.08);
        }

        .admin-logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          background: none;
          border: 1px solid rgba(197, 160, 89, 0.12);
          border-radius: 8px;
          color: #8A8A8A;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-logout-btn:hover {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.25);
          background: rgba(239, 68, 68, 0.06);
        }

        /* ── Main Content ── */
        .admin-main {
          flex: 1;
          min-width: 0;
          padding: 32px;
          overflow-x: hidden;
        }

        /* ── Gold Accent ── */
        .admin-gold {
          color: #C5A059;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .admin-mobile-header {
            display: flex;
          }

          .admin-main {
            padding: 72px 16px 24px;
          }

          .admin-sidebar {
            position: fixed;
            left: -280px;
            top: 0;
            bottom: 0;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .admin-sidebar--open {
            left: 0;
          }

          .admin-sidebar-close {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}
