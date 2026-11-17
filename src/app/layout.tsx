import type { Metadata } from "next";
import { AppNavigationShell } from "@/components/navigation/AppNavigationShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barter MVP",
  description: "Local-first and digital barter without money.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppNavigationShell />
        {children}
      </body>
    </html>
  );
}
