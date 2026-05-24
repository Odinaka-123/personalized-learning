"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  BarChart3,
  BookOpen,
  TrendingUp,
  User,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";

const navItems = [
  { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "My courses", href: "/learn" },
  { icon: TrendingUp, label: "Progress", href: "/progress" },
  { icon: User, label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const { user, clearUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    clearUser();
    router.replace("/login");
  };

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const sidebarContent = (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@300&family=Geist:wght@300;400;500&display=swap');

        .sb-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: 'Geist', sans-serif;
          background: #faf9f7;
        }

        /* Wordmark */
        .sb-wordmark {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 24px 20px 20px;
          border-bottom: 1px solid #e7e5e4;
        }
        .sb-mark {
          width: 24px; height: 24px;
          border: 2px solid #1c1917;
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 500; color: #1c1917;
          flex-shrink: 0;
        }
        .sb-brand {
          font-size: 13px; font-weight: 500;
          color: #1c1917; letter-spacing: 0.03em;
        }

        /* Nav */
        .sb-nav {
          flex: 1;
          padding: 12px 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sb-nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 20px;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #a8a29e;
          transition: color 0.15s, background 0.15s;
          position: relative;
        }
        .sb-nav-btn:hover { color: #1c1917; background: #f5f4f2; }
        .sb-nav-btn.active {
          color: #1c1917;
          font-weight: 500;
          background: #f0ede8;
        }
        .sb-nav-btn.active::before {
          content: '';
          position: absolute;
          left: 0; top: 6px; bottom: 6px;
          width: 2px;
          background: #1c1917;
          border-radius: 0 2px 2px 0;
        }
        .sb-nav-icon { flex-shrink: 0; }

        /* User footer */
        .sb-footer {
          border-top: 1px solid #e7e5e4;
          padding: 16px 20px;
        }
        .sb-user {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .sb-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 1px solid #e7e5e4;
          background: #f0ede8;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 500; color: #78716c;
          flex-shrink: 0;
        }
        .sb-user-name {
          font-size: 12px; font-weight: 500;
          color: #1c1917;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sb-user-role {
          font-size: 11px; font-weight: 300;
          color: #a8a29e;
          text-transform: capitalize;
        }
        .sb-signout {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 0;
          width: 100%;
          background: none; border: none;
          font-family: 'Geist', sans-serif;
          font-size: 12px; font-weight: 400;
          color: #a8a29e;
          cursor: pointer;
          transition: color 0.15s;
          text-align: left;
        }
        .sb-signout:hover { color: #dc2626; }

        /* Mobile tab trigger */
        .sb-tab {
          position: fixed;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          z-index: 25;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 18px;
          padding: 14px 0;
          background: #fff;
          border: 1px solid #e7e5e4;
          border-left: none;
          border-radius: 0 5px 5px 0;
          cursor: pointer;
          gap: 6px;
          box-shadow: 2px 0 8px rgba(28,25,23,.06);
          transition: width 0.15s, box-shadow 0.15s;
        }
        .sb-tab:hover {
          width: 22px;
          box-shadow: 3px 0 12px rgba(28,25,23,.10);
        }
        .sb-tab-dots {
          display: flex;
          flex-direction: column;
          gap: 3px;
          align-items: center;
        }
        .sb-tab-dot {
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #c4bfba;
          flex-shrink: 0;
        }
        .sb-tab-chevron {
          color: #c4bfba;
          flex-shrink: 0;
        }
      `}</style>

      <div className="sb-root">
        {/* Wordmark */}
        <div className="sb-wordmark">
          <div className="sb-mark">L</div>
          <span className="sb-brand">LearnSpace</span>
        </div>

        {/* Nav items */}
        <nav className="sb-nav">
          {navItems.map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (
              <button
                key={label}
                onClick={() => navigate(href)}
                className={`sb-nav-btn${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={14} className="sb-nav-icon" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sb-user-name">{user?.displayName}</div>
              <div className="sb-user-role">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="sb-signout">
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile tab trigger (replaces hamburger) ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="sb-tab lg:hidden"
          aria-label="Open menu"
        >
          <div className="sb-tab-dots">
            <div className="sb-tab-dot" />
            <div className="sb-tab-dot" />
            <div className="sb-tab-dot" />
          </div>
          <ChevronRight size={10} className="sb-tab-chevron" />
        </button>
      )}

      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="lg:hidden"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,25,23,0.3)",
            zIndex: 20,
          }}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className="lg:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: 240,
          borderRight: "1px solid #e7e5e4",
          zIndex: 30,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}
      >
        <button
          onClick={() => setOpen(false)}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            color: "#a8a29e",
            cursor: "pointer",
          }}
          aria-label="Close menu"
        >
          <X size={15} />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:block"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: 220,
          borderRight: "1px solid #e7e5e4",
          zIndex: 10,
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}