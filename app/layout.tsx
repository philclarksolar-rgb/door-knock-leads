import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QUICK Door Leads",
  description: "Door knocking lead tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
