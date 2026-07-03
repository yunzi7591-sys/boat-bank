import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";
import { PushPermissionPrompt } from "@/components/PushPermissionPrompt";
import { AppReviewPrompt } from "@/components/AppReviewPrompt";
import { SubscriptionPromoModal } from "@/components/SubscriptionPromoModal";
import { isSubscriptionActive } from "@/lib/subscription";
import { SharePromoModal } from "@/components/predictions/SharePromoModal";
import { PublishShareModal } from "@/components/predictions/PublishShareModal";
import { GoogleAnalytics } from "@next/third-parties/google";
import { RevenueCatInit } from "@/components/RevenueCatInit";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HideOnLp, MainWrapper } from "@/components/layout/ChromeWrapper";
import { KeyboardScrollFix } from "@/components/KeyboardScrollFix";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://boatbank.jp"),
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
  alternates: {
    canonical: "https://boatbank.jp",
  },
  verification: {
    google: "WZcSVEsSVyYU5GuElmykK_T3Dj2_yL8rXqHGKJKu7kQ",
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  // 登録時に入るメール認証日時を「アカウントの古さ」の代用にする
  // （既存ユーザーは登録が3日以上前 → レビュー促進の即対象になる）
  let accountCreatedAt: string | null = null;
  let showSubscriptionPromo = false;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, role: true, subscription: true },
    });
    accountCreatedAt = u?.emailVerified?.toISOString() ?? null;
    // ADMIN/MONITORは常に閲覧可能なので勧誘しない
    const privileged = u?.role === "ADMIN" || u?.role === "MONITOR";
    showSubscriptionPromo = Boolean(u) && !privileged && !isSubscriptionActive(u?.subscription);
  }
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col bg-white text-[#061b31]`}
        style={{ height: '100dvh', overflow: 'hidden' }}
      >
        <HideOnLp>
          <Header />
        </HideOnLp>
        <ServiceWorkerRegister />
        <RevenueCatInit userId={userId} />
        <KeyboardScrollFix />
        <MainWrapper>{children}</MainWrapper>
        <HideOnLp>
          <BottomNav />
        </HideOnLp>
        <HideOnLp>
          <PushPermissionPrompt isLoggedIn={Boolean(userId)} />
        </HideOnLp>
        <AppReviewPrompt accountCreatedAt={accountCreatedAt} />
        <SubscriptionPromoModal enabled={showSubscriptionPromo} />
        <SharePromoModal />
        <PublishShareModal />
        <Toaster position="top-center" />
        {process.env.NEXT_PUBLIC_GA_ID?.trim() && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID.trim()} />
        )}
      </body>
    </html>
  );
}
