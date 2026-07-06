import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Trophy, ChevronRight } from "lucide-react";
import { BOAT_COLORS } from "@/lib/bet-logic";
import { VenueGrid } from "@/components/dashboard/VenueGrid";
import { A8Banner } from "@/components/ads/A8Banner";
import { A8_BANNER_BOTTOM, A8_BANNER_MIDDLE } from "@/components/ads/A8BannerConfig";
import { HomeSeoSection } from "@/components/HomeSeoSection";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "BOAT BANK | 競艇予想マーケットプレイス・収支管理アプリ",
    description:
        "BOAT BANK は、競艇（ボートレース）の予想を売買できるマーケットプレイス。回収率・的中率・販売数まで全公開された予想家から買い目を購入でき、自分の舟券収支も24場ごとに自動記録。月別PnLカレンダーで日々の収支を一目で把握できます。",
    keywords: [
        "競艇", "ボートレース", "予想", "舟券", "収支管理", "回収率", "的中率",
        "マーケットプレイス", "PnL", "競艇予想", "ボートレース予想", "予想屋",
        "買い目", "BOAT BANK", "ボートバンク",
    ],
    openGraph: {
        title: "BOAT BANK | 競艇予想マーケットプレイス・収支管理アプリ",
        description:
            "ガチ予想のマーケットプレイス。回収率・的中率まで全公開された予想家から買い目を購入できる。自分の舟券収支も24場ごとに自動記録。",
        url: "https://boatbank.jp",
        siteName: "BOAT BANK",
        type: "website",
        locale: "ja_JP",
    },
    twitter: {
        card: "summary_large_image",
        title: "BOAT BANK | 競艇予想マーケットプレイス",
        description: "回収率公開のガチ予想 × 自動収支管理。",
    },
    alternates: { canonical: "https://boatbank.jp" },
};

export default async function DashboardPage() {
  const session = await auth();

  const userId = session?.user?.id;

  const latestNews = await prisma.news.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  });

  const latestResultsRaw = await prisma.raceResult.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { placeName: true, raceNumber: true, firstPlace: true, secondPlace: true, thirdPlace: true, payouts: true, createdAt: true },
  });

  const latestResults = latestResultsRaw.map(r => {
    const payouts = (r.payouts as any[]) || [];
    const trifecta = payouts.find(p => p.type === '3TR');
    return {
      place: r.placeName,
      race: r.raceNumber,
      p1: r.firstPlace,
      p2: r.secondPlace,
      p3: r.thirdPlace,
      payout: trifecta?.amount || 0,
    };
  });

  const getColorStyle = (n: number) => {
    const colorObj = BOAT_COLORS.find(c => c.no === n);
    if (!colorObj) return "bg-slate-200 text-slate-800";
    return colorObj.colorCls;
  };

  return (
    <div className="min-h-full pb-8">

      {/* Latest News */}
      {latestNews && (
        <div className="px-4 mt-3 mb-2">
          <Link href="/news">
            <div className="bg-white border border-[#e5edf5] rounded-lg p-3 hover:border-[#b9b9f9] transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold bg-[#533afd] text-white px-1.5 py-0.5 rounded">NEWS</span>
                <span className="text-[10px] text-[#64748d]">
                  {new Date(latestNews.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                </span>
              </div>
              <p className="text-sm font-bold text-[#061b31] truncate">{latestNews.title}</p>
            </div>
          </Link>
        </div>
      )}

      {/* 2. 24 Venues Grid */}
      <div className="mt-5 px-4">
        <div className="bg-white rounded-lg p-3 border border-[#e5edf5]">
          <VenueGrid />
        </div>
      </div>

      {/* A8 広告バナー（中間） */}
      <A8Banner {...A8_BANNER_MIDDLE} />

      {/* 4. Latest Results */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-light text-[#061b31] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            最新レース結果
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">LIVE</span>
        </div>
        <div className="bg-white rounded-lg p-3 border border-[#e5edf5]">
        <div className="flex flex-col gap-2.5">
          {latestResults.map((res, i) => (
            <div key={i} className="bg-white border border-[#e5edf5] rounded-lg p-4 flex items-center justify-between hover:border-slate-200 transition-colors">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-0.5">{res.place} {res.race}R</p>
                <p className="font-light text-lg text-[#061b31] tracking-tight tabular-nums">
                  ¥{res.payout.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${getColorStyle(res.p1)}`}>{res.p1}</div>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${getColorStyle(res.p2)}`}>{res.p2}</div>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${getColorStyle(res.p3)}`}>{res.p3}</div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* A8 広告バナー（下部） */}
      <A8Banner {...A8_BANNER_BOTTOM} />

      {/* SEO: 収支管理アプリとしてのサービス説明（Webのみ表示・アプリでは非表示） */}
      <HomeSeoSection />

      {/* 構造化データ: 収支管理アプリとして検索エンジンに認識させる */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebApplication",
                name: "BOAT BANK",
                alternateName: "ボートバンク",
                url: "https://boatbank.jp",
                applicationCategory: "FinanceApplication",
                operatingSystem: "iOS, Android, Web",
                description:
                  "競艇（ボートレース）の舟券の収支を自動で記録・管理できるアプリ。回収率・的中率・累計収支を自動集計し、24場ごとの成績やカレンダー、収益推移グラフで可視化する。",
                inLanguage: "ja",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "JPY",
                  description:
                    "基本無料。スタンダードプラン（月500円・初月無料）で24場ごとの詳細分析が利用可能。",
                },
                featureList: [
                  "舟券の収支を自動記録・管理",
                  "24場ごとの回収率・収支を自動集計",
                  "月別収支カレンダー",
                  "収益推移グラフ",
                  "グレード別・時間帯別・期間別の成績分析",
                  "競艇予想マーケットプレイス",
                ],
              },
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "競艇の収支を自動で管理できますか？",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "はい。買い目と金額を登録すれば、回収率・的中率・累計収支が自動で計算されます。手書きや表計算で集計する必要はありません。",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "無料で使えますか？",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "収支管理の基本機能は無料でお使いいただけます。24場ごとの詳細分析などが使えるスタンダードプラン（月額）は初月無料でお試しいただけます。",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "スマホアプリはありますか？",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "iPhone・Android向けアプリに加え、Webブラウザからもご利用いただけます。",
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      <div className="mt-8 pb-4 px-4 flex items-center justify-center gap-3 text-[10px] text-[#64748d] flex-wrap">
        <Link href="/privacy" className="hover:text-[#533afd]">プライバシーポリシー</Link>
        <span>|</span>
        <Link href="/terms" className="hover:text-[#533afd]">利用規約</Link>
        <span>|</span>
        <Link href="/sct" className="hover:text-[#533afd]">特定商取引法に基づく表記</Link>
        <span>|</span>
        <Link href="/contact" className="hover:text-[#533afd]">お問い合わせ</Link>
      </div>
    </div>
  );
}
