import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TYPES, getTypeBySlug } from "@/lib/shindan";

export function generateStaticParams() {
    return TYPES.map(t => ({ type: t.slug }));
}

export async function generateMetadata(props: { params: Promise<{ type: string }> }) {
    const { type } = await props.params;
    const t = getTypeBySlug(type);
    if (!t) return { title: "ギャンブラー診断 | BOAT BANK" };
    const title = `あなたは「${t.name}」｜ギャンブラー診断 | BOAT BANK`;
    const description = `${t.catch}。30問でわかるギャンブラー診断、あなたの舟券スタイルは全8タイプのどれ？`;
    const ogImage = `https://boatbank.jp/shindan/og-${t.slug}.png`;
    return {
        title,
        description,
        alternates: { canonical: `https://boatbank.jp/shindan/${t.slug}` },
        openGraph: {
            title: `私は「${t.name}」でした`,
            description,
            url: `https://boatbank.jp/shindan/${t.slug}`,
            images: [{ url: ogImage, width: 1200, height: 630 }],
            type: "website",
            siteName: "BOAT BANK",
        },
        twitter: {
            card: "summary_large_image",
            title: `私は「${t.name}」でした｜ギャンブラー診断`,
            description,
            images: [ogImage],
        },
    };
}

export default async function ShindanResultPage(props: { params: Promise<{ type: string }> }) {
    const { type } = await props.params;
    const t = getTypeBySlug(type);
    if (!t) notFound();

    const shareText = `私のギャンブラータイプは「${t.name}」でした！\n${t.catch}\n#ギャンブラー診断 #BOATBANK`;
    const shareUrl = `https://boatbank.jp/shindan/${t.slug}`;
    const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

    return (
        <div className="min-h-full bg-[#f8fafc] pb-24">
            {/* ヘッダー: タイプカラー */}
            <div className="text-white px-4 pb-14" style={{ background: `linear-gradient(160deg, ${t.colorDark}, ${t.color})`, paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}>
                <div className="max-w-md mx-auto">
                    <Link href="/" className="inline-flex items-center gap-1 text-xs font-black text-white mb-5">
                        <span className="bg-white/20 border border-white/30 px-1.5 py-0.5 rounded text-[10px]">BOAT</span>BANK
                    </Link>
                </div>
                <div className="max-w-md mx-auto text-center">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-white/75 mb-1">ギャンブラー診断｜結果</p>
                    <p className="text-sm font-bold text-white/90 mb-1">あなたのタイプは…</p>
                    <h1 className="text-3xl font-black mb-2">{t.name}</h1>
                    <p className="text-sm text-white/90">{t.catch}</p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-10">
                {/* キャラカード */}
                <div className="bg-white rounded-2xl border border-[#e5edf5] shadow-sm p-5 mb-4">
                    <div className="w-56 h-56 mx-auto rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: `${t.color}14` }}>
                        <Image src={`/shindan/char-${t.slug}.png`} alt={t.name} width={448} height={448} className="w-full h-auto" priority />
                    </div>
                    <div className="space-y-2.5">
                        {t.description.map((p, i) => (
                            <p key={i} className="text-sm text-[#273951] leading-relaxed">{p}</p>
                        ))}
                    </div>
                </div>

                {/* シェア */}
                <a
                    href={xIntent}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-[#061b31] hover:bg-[#0f2a47] active:scale-[0.99] transition-all text-white text-center font-black rounded-xl py-4 mb-4"
                >
                    𝕏 で結果をシェアする
                </a>

                {/* 強み・弱み */}
                <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="bg-white rounded-xl border border-[#e5edf5] p-4">
                        <h2 className="text-xs font-black mb-2" style={{ color: t.color }}>💪 あなたの強み</h2>
                        <ul className="space-y-1.5">
                            {t.strengths.map(s => (
                                <li key={s} className="text-sm text-[#273951] flex gap-2"><span style={{ color: t.color }}>●</span>{s}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white rounded-xl border border-[#e5edf5] p-4">
                        <h2 className="text-xs font-black text-[#ea2261] mb-2">⚠️ 気をつけたい弱点</h2>
                        <ul className="space-y-1.5">
                            {t.weaknesses.map(s => (
                                <li key={s} className="text-sm text-[#273951] flex gap-2"><span className="text-[#ea2261]">●</span>{s}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white rounded-xl border border-[#e5edf5] p-4">
                        <h2 className="text-xs font-black text-[#061b31] mb-2">🎯 相性のいい舟券スタイル</h2>
                        <p className="text-sm text-[#273951] leading-relaxed">{t.strategy}</p>
                    </div>
                </div>

                {/* BOATBANK 誘導 */}
                <div className="rounded-2xl p-5 mb-4 text-white" style={{ background: `linear-gradient(160deg, ${t.colorDark}, ${t.color})` }}>
                    <h2 className="text-sm font-black mb-2">🚤 {t.name}のあなたへ</h2>
                    <p className="text-sm text-white/95 leading-relaxed mb-4">{t.boatbank}</p>
                    <div className="flex flex-col gap-2">
                        <Link href="/register" className="block bg-white text-[#061b31] text-center font-black rounded-xl py-3.5 active:scale-[0.99] transition-transform">
                            無料でBOAT BANKをはじめる
                        </Link>
                        <Link href="/market" className="block bg-white/15 border border-white/30 text-white text-center font-bold rounded-xl py-3 active:scale-[0.99] transition-transform">
                            今日の予想マーケットを見る
                        </Link>
                    </div>
                </div>

                {/* 診断へ */}
                <Link href="/shindan" className="block bg-[#533afd] hover:bg-[#4434d4] active:scale-[0.99] transition-all text-white text-center font-black rounded-xl py-4">
                    自分も診断してみる（無料・約2分）
                </Link>
            </div>
        </div>
    );
}
