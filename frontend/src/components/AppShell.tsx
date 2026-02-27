"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Sidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
