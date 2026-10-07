import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Media Buyer — Ads Automation",
  description:
    "Dasbor kontrol iklan Meta: riset, landing page, creative, peluncuran, dan loop harian.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-text">{children}</body>
    </html>
  );
}
