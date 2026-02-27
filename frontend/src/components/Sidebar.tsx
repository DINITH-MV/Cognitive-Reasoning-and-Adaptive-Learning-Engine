"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  Route,
  FlaskConical,
  MessageSquare,
  BarChart3,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Learning Path", href: "/learning-path", icon: Route },
  { label: "Simulations", href: "/simulation", icon: FlaskConical },
  { label: "AI Mentor", href: "/mentor", icon: MessageSquare },
  { label: "Monitoring", href: "/monitoring", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 border-r flex flex-col z-50"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Brain className="w-7 h-7 text-indigo-400" />
        <span
          className="text-lg font-bold tracking-tight"
          style={{ color: "var(--color-text)" }}
        >
          CRACLE
        </span>
      </Link>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "text-white" : ""
              }`}
              style={
                isActive
                  ? { background: "var(--color-primary)", color: "white" }
                  : { color: "var(--color-text-muted)" }
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={() => {
            localStorage.removeItem("cracle_token");
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--color-text-muted)" }}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
