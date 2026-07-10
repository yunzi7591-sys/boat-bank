import Link from "next/link";
import type { Metadata } from "next";
import styles from "./lp.module.css";
import { FeatureCard } from "./FeatureCard";
import { StoreBadges } from "./StoreBadges";

export const metadata: Metadata = {
    title: "競艇の収支管理アプリ｜回収率・的中率を自動集計 - BOAT BANK",
    description:
        "BOAT BANK は競艇（ボートレース）の舟券収支を自動で記録・管理できるアプリ。24場ごとの回収率・的中率・累計収支を自動集計し、月別カレンダーや収益推移グラフで見える化。予想マーケットプレイスも搭載。iPhone・Android・Web対応、基本無料。",
    keywords: [
        "競艇 収支管理", "ボートレース 収支管理", "収支管理アプリ", "競艇 収支管理 アプリ",
        "競艇 回収率", "舟券 収支", "回収率 計算", "的中率", "競艇 収支", "PnL",
        "BOAT BANK", "ボートバンク",
    ],
    openGraph: {
        title: "BOAT BANK — 競艇を、データで。",
        description: "競艇の舟券収支を自動で記録・管理。回収率・的中率まで見える化する収支管理アプリ。",
        url: "https://boatbank.jp/lp",
        siteName: "BOAT BANK",
        type: "website",
        images: [{ url: "/guide/home.png", width: 1200, height: 630, alt: "BOAT BANK" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "BOAT BANK — 競艇を、データで。",
        description: "競艇の舟券収支を自動で記録・管理。回収率・的中率まで見える化する収支管理アプリ。",
        images: ["/guide/home.png"],
    },
    alternates: { canonical: "/lp" },
};

export default function LPPage() {
    return (
        <div className={styles.root}>
            <div className={styles.rootWave} aria-hidden="true" />

            {/* ==================== ALERT RIBBON ==================== */}
            <div className={styles.alertRibbon} role="status" aria-label="最新情報">
                <span className={styles.alertRibbonTag}>LIVE</span>
                <div className={styles.alertRibbonScroll}>
                    <div className={styles.alertRibbonTrack}>
                        <span className={styles.alertRibbonItem}><b>FLASH</b>全24場オッズ連動 稼働中</span>
                        <span className={styles.alertRibbonItem}><b>NEW</b>月間ランキング 開催中</span>
                        <span className={styles.alertRibbonItem}><b>DATA</b>予想屋の詳細分析が読める</span>
                        {/* duplicate for seamless marquee */}
                        <span className={styles.alertRibbonItem}><b>FLASH</b>全24場オッズ連動 稼働中</span>
                        <span className={styles.alertRibbonItem}><b>NEW</b>月間ランキング 開催中</span>
                        <span className={styles.alertRibbonItem}><b>DATA</b>予想屋の詳細分析が読める</span>
                    </div>
                </div>
            </div>

            {/* ==================== HEADER ==================== */}
            <header className={styles.header}>
                <Link href="/lp" className={styles.brand}>
                    <span className={styles.brandMark}>B</span>
                    <span>BOAT BANK</span>
                    <span className={styles.brandSlash}>/ BOAT · DATA</span>
                </Link>
                <Link href="/register" className={styles.navBtn}>はじめる</Link>
            </header>

            {/* ==================== HERO ==================== */}
            <section className={styles.hero}>
                <div className={styles.heroBg} aria-hidden="true" />
                <div className={styles.heroGrid} aria-hidden="true" />

                <h1 className={styles.heroTitle}>
                    <span className={`${styles.heroTitleLine} ${styles.jp}`}>競艇を、</span>
                    <span className={`${styles.heroTitleLine} ${styles.heroTitleRed}`}>データで。</span>
                </h1>

                <div className={styles.ctaGroup}>
                    <Link href="/register" className={styles.ctaPrimary}>
                        はじめる <span aria-hidden="true">→</span>
                    </Link>
                    <Link href="/guide" className={styles.ctaSecondary}>使い方を見る</Link>
                </div>

                <StoreBadges />

                <div className={styles.manifesto}>
                    <p className={styles.manifestoText}>
                        <span className={styles.manifestoLine}>自身の収支分析＆</span>
                        <span className={styles.manifestoLine}>回収率・的中率まで公開された予想屋の、</span>
                        <em className={styles.manifestoLine}>買い目を無料で見られるサービスです。</em>
                    </p>
                </div>
            </section>

            {/* ==================== FEATURES ==================== */}
            <section className={styles.section}>
                <div className={`${styles.sectionHead} ${styles.scrollReveal}`}>
                    <h2 className={styles.sectionTitle}>勝つための、武器。</h2>
                    <p className={styles.sectionLead}>
                        予想・収支管理・コミュニティ。競艇で勝つために必要な機能を、ひとつに。
                    </p>
                </div>

                <div className={styles.features}>
                    <FeatureCard
                        number="01"
                        tag="PROFIT"
                        title="あなたの収支、ぜんぶ見える"
                        description="場別・期間別に、投資額・回収額・回収率を自動記録。24場のうちどこが得意かが、一目で分かる。"
                    />
                    <FeatureCard
                        number="02"
                        tag="INSIGHT"
                        title="予想屋の成績、ぜんぶ公開"
                        description="回収率・的中率まで全公開。本物の予想屋だけを、数字で選べる。"
                    />
                    <FeatureCard
                        number="03"
                        tag="RANKING"
                        title="予想屋ランキング"
                        description="月間ランキングで「今勝っている人」が一目で分かる。回収率順・的中率順で並べ替え可能。"
                    />
                    <FeatureCard
                        number="04"
                        tag="COVERAGE"
                        title="24場 × 全レース"
                        description="全国の競艇場、全レースに対応。オッズ・出走表・結果まで、一画面で完結。"
                    />
                </div>
            </section>

            {/* ==================== FINAL CTA ==================== */}
            <section className={styles.finalCta}>
                <div className={`${styles.finalCtaInner} ${styles.scrollReveal}`}>
                    <h2 className={styles.finalCtaTitle}>
                        <span className={styles.titleLine}>あとは、</span>
                        <span className={`${styles.titleLine} ${styles.heroTitleRed}`}>当てるだけ。</span>
                    </h2>
                    <div className={styles.finalCtaActions}>
                        <Link href="/register" className={styles.ctaPrimary}>
                            はじめる <span aria-hidden="true">→</span>
                        </Link>
                        <Link href="/login" className={styles.ctaSecondary}>ログイン</Link>
                    </div>
                    <StoreBadges />
                </div>
            </section>

            {/* ==================== SEO CONTENT ==================== */}
            <section className={styles.lpSeo}>
                <h2 className={styles.lpSeoTitle}>競艇の収支管理アプリ「BOAT BANK」とは</h2>
                <p className={styles.lpSeoText}>
                    BOAT BANK（ボートバンク）は、競艇（ボートレース）の舟券の収支を自動で記録・管理できるアプリです。買い目と金額を登録するだけで、回収率・的中率・累計収支が自動で計算され、全24場ごとの成績まで一目でわかります。「なんとなく勝っている気がする」を、正確な数字に変える。負けている場所が分かって初めて、勝てる場所で戦えるようになります。基本無料で始められ、iPhone・Android・Webブラウザから使えます。
                </p>

                <h3 className={styles.lpSeoSub}>収支管理でできること</h3>
                <ul className={styles.lpSeoList}>
                    <li>24場ごとの回収率・収支を自動集計。得意な場・苦手な場が数字で分かる</li>
                    <li>月別カレンダーで、日々の収支をプラス・マイナスで色分け表示</li>
                    <li>収益推移グラフで、累計収支が右肩上がりか下がりかを一目で把握</li>
                    <li>グレード別（一般〜SG）・時間帯別（モーニング〜ミッドナイト）・期間別（通算／年／月）に絞り込んで、勝てる条件を分析</li>
                    <li>回収率・的中率まで公開された予想家の買い目を売買できる予想マーケットプレイス</li>
                </ul>

                <h3 className={styles.lpSeoSub}>よくある質問</h3>
                <div className={styles.lpFaq}>
                    <div>
                        <p className={styles.lpFaqQ}>Q. 競艇の収支を自動で管理できますか？</p>
                        <p className={styles.lpFaqA}>A. はい。買い目と金額を登録すれば、回収率・的中率・累計収支が自動で計算されます。手書きや表計算で集計する必要はありません。</p>
                    </div>
                    <div>
                        <p className={styles.lpFaqQ}>Q. 無料で使えますか？</p>
                        <p className={styles.lpFaqA}>A. 収支管理の基本機能は無料でお使いいただけます。24場ごとの詳細分析などが使えるスタンダードプラン（月額）は初月無料でお試しいただけます。</p>
                    </div>
                    <div>
                        <p className={styles.lpFaqQ}>Q. スマホアプリはありますか？</p>
                        <p className={styles.lpFaqA}>A. iPhone・Android向けアプリに加え、Webブラウザからもご利用いただけます。</p>
                    </div>
                </div>
            </section>

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
                                url: "https://boatbank.jp/lp",
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

            {/* ==================== FOOTER ==================== */}
            <footer className={styles.footer}>
                <div className={styles.footerLinks}>
                    <Link href="/guide">使い方</Link>
                    <Link href="/terms">利用規約</Link>
                    <Link href="/privacy">プライバシー</Link>
                    <Link href="/sct">特定商取引法</Link>
                    <Link href="/contact">お問い合わせ</Link>
                </div>
                <div className={styles.footerMeta}>
                    <span>© 2026 BOAT BANK</span>
                    <span>·</span>
                    <span>ALL RIGHTS RESERVED</span>
                </div>
            </footer>
        </div>
    );
}
