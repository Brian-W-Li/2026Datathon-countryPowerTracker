import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Country Power Tracker",
  description: "Explore environmental performance, clean energy capacity, and climate policy effectiveness for 180+ countries worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
