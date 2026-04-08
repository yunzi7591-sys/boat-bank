import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOAT BANK",
  description: "ガチ予想のマーケットプレイス＆収支管理アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BOAT BANK",
  },
  icons: {
    apple: "/icon-192x192.png",
  }
};

export const viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16`}
      >
        <Header />
        <main className="flex-1 w-full relative max-w-md mx-auto bg-white shadow-xl shadow-slate-200/50 min-h-[100dvh]">
          {children}
        </main>
        <BottomNav />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
