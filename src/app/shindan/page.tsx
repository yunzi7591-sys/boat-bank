import Link from "next/link";
import Image from "next/image";
import { TYPES } from "@/lib/shindan";
import { ShindanClient } from "./ShindanClient";

export const metadata = {
    title: "ギャンブラー診断｜30問でわかるあなたの舟券スタイル | BOAT BANK",
    description:
        "あなたはデータ職人型？それとも万舟ドリーマー型？30の質問でギャンブラータイプを8タイプに診断。無料・登録不要・約2分。競艇ファンのための性格診断です。",
    alternates: { canonical: "https://boatbank.jp/shindan" },
    openGraph: {
        title: "ギャンブラー診断｜あなたの舟券スタイルを丸裸に",
        description: "30の質問でギャンブラータイプを8タイプに診断。無料・約2分。",
        url: "https://boatbank.jp/shindan",
        images: [{ url: "https://boatbank.jp/shindan/og-top.png", width: 1200, height: 630 }],
        type: "website",
        siteName: "BOAT BANK",
    },
    twitter: {
        card: "summary_large_image",
        title: "ギャンブラー診断｜あなたの舟券スタイルを丸裸に",
        description: "30の質問でギャンブラータイプを8タイプに診断。無料・約2分。",
        images: ["https://boatbank.jp/shindan/og-top.png"],
    },
};

export default function ShindanPage() {
    return (
        <div className="min-h-full bg-[#f8fafc] pb-24">
            <div className="max-w-md mx-auto px-4 pt-4">
                <Link href="/" className="inline-flex items-center gap-1 text-xs font-black text-[#061b31] mb-3">
                    <span className="bg-[#533afd] text-white px-1.5 py-0.5 rounded text-[10px]">BOAT</span>BANK
                </Link>
                <ShindanClient />

                {/* 8タイプ一覧 */}
                <section className="mt-10">
                    <h2 className="text-sm font-black text-[#061b31] mb-1">全8タイプ</h2>
                    <p className="text-xs text-[#64748d] mb-4">あなたはどれに当てはまる？</p>
                    <div className="grid grid-cols-2 gap-3">
                        {TYPES.map(t => (
                            <Link key={t.slug} href={`/shindan/${t.slug}`} className="group">
                                <div className="bg-white border border-[#e5edf5] group-hover:border-[#533afd]/40 rounded-xl p-3 transition-colors">
                                    <div className="w-full aspect-square rounded-lg overflow-hidden mb-2" style={{ backgroundColor: `${t.color}14` }}>
                                        <Image src={`/shindan/char-${t.slug}.png`} alt={t.name} width={200} height={200} className="w-full h-auto" />
                                    </div>
                                    <p className="text-xs font-black text-[#061b31]">{t.name}</p>
                                    <p className="text-[10px] text-[#64748d] leading-snug mt-0.5 line-clamp-2">{t.catch}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* 診断について（SEO向け説明） */}
                <section className="mt-10 bg-white border border-[#e5edf5] rounded-2xl p-5">
                    <h2 className="text-sm font-black text-[#061b31] mb-3">この診断について</h2>
                    <p className="text-xs text-[#64748d] leading-relaxed">
                        ギャンブラー診断は、競艇（ボートレース）ファンのための無料タイプ診断です。
                        「データ派か直感派か」「本命党か穴党か」「堅実か一発勝負か」の3つの軸・30の質問から、
                        あなたの舟券スタイルを8タイプに分類します。
                        診断結果ページでは、タイプ別の強み・弱点と、相性のいい舟券戦略も紹介しています。
                    </p>
                    <p className="text-[10px] text-[#94a3b8] leading-relaxed mt-3">
                        ※ 本診断はエンターテインメントです。舟券の購入は20歳から、無理のない範囲でお楽しみください。
                    </p>
                </section>
            </div>
        </div>
    );
}
