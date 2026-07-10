import Link from "next/link";
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
        <div className="min-h-full bg-gradient-to-b from-[#061b31] to-[#1c2f6e] pb-16" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <div className="max-w-md mx-auto px-4 pt-4">
                <Link href="/" className="inline-flex items-center gap-1 text-xs font-black text-white mb-3">
                    <span className="bg-white/20 border border-white/30 px-1.5 py-0.5 rounded text-[10px]">BOAT</span>BANK
                </Link>
                <ShindanClient />
                <p className="text-[10px] text-white/50 text-center leading-relaxed mt-4">
                    ※ 本診断はエンターテインメントです。舟券の購入は20歳から、無理のない範囲で。
                </p>
            </div>
        </div>
    );
}
