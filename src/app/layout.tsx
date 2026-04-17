import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/InstallPrompt";
import { SharePromoModal } from "@/components/predictions/SharePromoModal";

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
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "BOAT BANK",
    description: "ガチ予想のマーケットプレイス＆収支管理アプリ",
    url: "https://boatbank.jp",
    siteName: "BOAT BANK",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BOAT BANK",
    description: "ガチ予想のマーケットプレイス＆収支管理アプリ",
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6719163751249094"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white text-[#061b31] pb-16`}
      >
        <Header />
        <main className="flex-1 w-full relative max-w-md mx-auto bg-white min-h-[100dvh]" style={{boxShadow: 'rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px'}}>
          {children}
        </main>
        <BottomNav />
        <InstallPrompt />
        <SharePromoModal />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
