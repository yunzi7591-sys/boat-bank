import Link from "next/link";
import type { Metadata } from "next";
import styles from "./lp.module.css";
import { FeatureCard } from "./FeatureCard";
import { IntroAnimation } from "./IntroAnimation";

export const metadata: Metadata = {
    title: "BOAT BANK — 競艇を、データで。",
    description: "ガチ予想のマーケットプレイス。本気の予想屋とつながり、限定イベントで腕を磨き、収支を見える化。",
    openGraph: {
        title: "BOAT BANK — 競艇を、データで。",
        description: "ガチ予想のマーケットプレイス。",
        url: "https://boatbank.jp/lp",
        siteName: "BOAT BANK",
        type: "website",
        images: [{ url: "/guide/home.png", width: 1200, height: 630, alt: "BOAT BANK" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "BOAT BANK — 競艇を、データで。",
        description: "ガチ予想のマーケットプレイス。",
        images: ["/guide/home.png"],
    },
    alternates: { canonical: "/lp" },
};

export default function LPPage() {
    return (
        <div className={styles.root}>
            <IntroAnimation />
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

                <div className={styles.manifesto}>
                    <p className={styles.manifestoText}>
                        <span className={styles.manifestoLine}>自身の収支分析＆</span>
                        <span className={styles.manifestoLine}>回収率・的中率・販売数まで公開された予想屋から、</span>
                        <em className={styles.manifestoLine}>買い目を購入できるサービスです。</em>
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
                        description="回収率・的中率・販売数まで全公開。本物の予想屋だけを、数字で選べる。"
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
                </div>
            </section>

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
