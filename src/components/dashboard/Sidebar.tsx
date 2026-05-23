"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  GraduationCap,
  BarChart3,
  BookOpen,
  TrendingUp,
  User,
  LogOut,
  Menu,
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
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
          <GraduationCap size={14} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm tracking-tight">
          PLPAC
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <button
              key={label}
              onClick={() => navigate(href)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                active ?
                  "bg-purple-600/20 text-purple-300 border border-purple-500/20"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="border-t border-white/5 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-bold shrink-0">
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.displayName}
            </p>
            <p className="text-slate-500 text-xs truncate capitalize">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm w-full"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile hamburger button ── */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* ── Mobile overlay backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[#0a0a0f] border-r border-white/5 flex flex-col py-6 px-4 z-30 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>

        {sidebarContent}
      </aside>

      {/* ── Desktop sidebar (always visible) ── */}
      <aside className="hidden lg:flex w-60 border-r border-white/5 flex-col py-6 px-4 fixed h-full bg-[#0a0a0f] z-10">
        {sidebarContent}
      </aside>
    </>
  );
}
