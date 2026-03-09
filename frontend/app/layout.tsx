import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARIA — AI Real-time Intelligence Assistant",
  description: "Screen-watching AI assistant for meetings, learning, and interviews",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
