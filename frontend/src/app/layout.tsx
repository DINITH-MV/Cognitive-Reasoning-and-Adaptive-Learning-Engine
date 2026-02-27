import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRACLE - Cognitive Reasoning and Adaptive Learning Engine",
  description:
    "AI-powered Learning Management System with multi-agent cognitive reasoning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
