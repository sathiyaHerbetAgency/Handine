import { TempoInit } from "@/components/tempo-init";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Thehandine: Contactless Digital Menus for Restaurants",
  description: "Thehandine empowers restaurants with contactless, customizable digital menus. Generate QR code menus in seconds, update items in real time, and delight guests on any device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" /> */}
      <body className={inter.className}>
        {children}
        {/* <TempoInit /> */}
      </body>
    </html>
  );
}
