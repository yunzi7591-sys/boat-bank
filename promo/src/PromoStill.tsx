import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/ZenKakuGothicNew";

const { fontFamily } = loadFont();

const COLORS = {
    bg: "#f6f8fb",
    bgAlt: "#eef1f6",
    ink: "#0a0e14",
    ink2: "#2b3340",
    ink3: "#5a6472",
    line: "rgba(10,14,20,0.10)",
    blue: "#1e5eff",
    blueHot: "#3d7bff",
    red: "#e11d1d",
    green: "#16a34a",
};

const GridBackground = () => {
    return (
        <AbsoluteFill style={{ overflow: "hidden" }}>
            <div
                style={{
                    position: "absolute",
                    top: -200,
                    left: -200,
                    width: 900,
                    height: 900,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(30,94,255,0.22) 0%, rgba(30,94,255,0) 70%)",
                    filter: "blur(40px)",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: -300,
                    right: -300,
                    width: 1000,
                    height: 1000,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(61,123,255,0.18) 0%, rgba(61,123,255,0) 70%)",
                    filter: "blur(50px)",
                }}
            />
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.04, mixBlendMode: "multiply" }}>
                <filter id="grain-still">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
                    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#grain-still)" />
            </svg>
        </AbsoluteFill>
    );
};

const CornerHud: React.FC<{ num: string; total: string }> = ({ num, total }) => {
    return (
        <>
            <div
                style={{
                    position: "absolute",
                    top: 32,
                    left: 40,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    letterSpacing: 2,
                    color: COLORS.ink3,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                }}
            >
                <span style={{ width: 8, height: 8, borderRadius: 8, background: COLORS.blue }} />
                BOAT BANK
            </div>
            <div
                style={{
                    position: "absolute",
                    top: 32,
                    right: 40,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    letterSpacing: 2,
                    color: COLORS.ink3,
                }}
            >
                {num} / {total}
            </div>
            <div
                style={{
                    position: "absolute",
                    bottom: 32,
                    right: 40,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    letterSpacing: 2,
                    color: COLORS.ink3,
                }}
            >
                boatbank.jp
            </div>
        </>
    );
};

// ========== Promo 1: 問題提起 ==========
export const Promo1 = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
            <GridBackground />
            <CornerHud num="01" total="04" />
            {[
                { x: 10, y: 20, size: 70, rot: -8 },
                { x: 85, y: 18, size: 55, rot: 12 },
                { x: 8, y: 72, size: 50, rot: 5 },
                { x: 88, y: 78, size: 65, rot: -14 },
                { x: 50, y: 12, size: 40, rot: 20 },
            ].map((q, i) => (
                <span
                    key={i}
                    style={{
                        position: "absolute",
                        top: `${q.y}%`,
                        left: `${q.x}%`,
                        fontSize: q.size,
                        fontWeight: 900,
                        color: COLORS.ink,
                        opacity: 0.07,
                        transform: `rotate(${q.rot}deg)`,
                    }}
                >
                    ?
                </span>
            ))}

            <AbsoluteFill
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 60px",
                    gap: 40,
                }}
            >
                <div style={{ flex: 1.15 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "rgba(225,29,29,0.12)",
                            color: COLORS.red,
                            fontSize: 16,
                            fontWeight: 800,
                            letterSpacing: 1,
                            marginBottom: 24,
                        }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: 8, background: COLORS.red }} />
                        WARNING
                    </div>
                    <div
                        style={{
                            color: COLORS.ink,
                            fontSize: 64,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                        }}
                    >
                        その予想屋、
                    </div>
                    <div
                        style={{
                            color: COLORS.ink,
                            fontSize: 64,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                        }}
                    >
                        本当に<span style={{ color: COLORS.red }}>勝ってますか？</span>
                    </div>
                    <div
                        style={{
                            marginTop: 24,
                            fontSize: 22,
                            fontWeight: 500,
                            color: COLORS.ink3,
                            lineHeight: 1.5,
                        }}
                    >
                        収支を隠した予想屋が、増えています。
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        background: "#ffffff",
                        borderRadius: 20,
                        border: `1px solid ${COLORS.line}`,
                        padding: 28,
                        boxShadow: "0 30px 80px rgba(10,14,20,0.08)",
                        transform: "rotate(2deg)",
                        position: "relative",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: 26,
                                background: "linear-gradient(135deg, #0a0e14, #2b3340)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: 22,
                                fontWeight: 900,
                            }}
                        >
                            予
                        </div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink }}>匿名予想屋X</div>
                            <div style={{ fontSize: 13, color: COLORS.ink3, fontWeight: 600 }}>@suspicious_tipster</div>
                        </div>
                    </div>

                    <div
                        style={{
                            padding: 16,
                            borderRadius: 12,
                            background: COLORS.bgAlt,
                            fontSize: 17,
                            fontWeight: 700,
                            color: COLORS.ink,
                            marginBottom: 16,
                            lineHeight: 1.5,
                        }}
                    >
                        【今日の自信レース】<br />
                        住之江10R 3連単 買い目DM！<br />
                        <span style={{ color: COLORS.red }}>先着5名様限定🔥</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        {[
                            { label: "回収率", value: "???" },
                            { label: "的中率", value: "???" },
                            { label: "収支", value: "???" },
                        ].map((s) => (
                            <div
                                key={s.label}
                                style={{
                                    padding: "10px 6px",
                                    borderRadius: 10,
                                    border: `1px dashed ${COLORS.red}`,
                                    background: "rgba(225,29,29,0.04)",
                                    textAlign: "center",
                                }}
                            >
                                <div style={{ fontSize: 11, color: COLORS.ink3, fontWeight: 700, marginBottom: 4 }}>
                                    {s.label}
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.red, letterSpacing: 2 }}>
                                    {s.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

// ========== Promo 2: 自分の収支管理 ==========
export const Promo2 = () => {
    const venues: { name: string; rate: string | null }[] = [
        { name: "桐生", rate: "142.3" },
        { name: "戸田", rate: null },
        { name: "江戸川", rate: "98.4" },
        { name: "平和島", rate: null },
        { name: "多摩川", rate: "115.6" },
        { name: "浜名湖", rate: null },
        { name: "蒲郡", rate: "63.3" },
        { name: "常滑", rate: "131.7" },
        { name: "津", rate: null },
        { name: "三国", rate: "87.2" },
        { name: "びわこ", rate: null },
        { name: "住之江", rate: "165.4" },
        { name: "尼崎", rate: null },
        { name: "鳴門", rate: "78.5" },
        { name: "丸亀", rate: "124.9" },
        { name: "児島", rate: null },
        { name: "宮島", rate: "101.2" },
        { name: "徳山", rate: null },
        { name: "下関", rate: "189.6" },
        { name: "若松", rate: null },
        { name: "芦屋", rate: "95.7" },
        { name: "福岡", rate: null },
        { name: "唐津", rate: "108.3" },
        { name: "大村", rate: "143.8" },
    ];

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
            <GridBackground />
            <CornerHud num="02" total="04" />

            <AbsoluteFill
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 60px",
                    gap: 40,
                }}
            >
                <div style={{ flex: 1.15 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "rgba(30,94,255,0.12)",
                            color: COLORS.blue,
                            fontSize: 16,
                            fontWeight: 800,
                            letterSpacing: 1,
                            marginBottom: 24,
                        }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: 8, background: COLORS.blue }} />
                        FEATURE 01
                    </div>
                    <div
                        style={{
                            color: COLORS.ink,
                            fontSize: 64,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                        }}
                    >
                        あなたの収支、
                    </div>
                    <div
                        style={{
                            color: COLORS.ink,
                            fontSize: 64,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                        }}
                    >
                        <span style={{ color: COLORS.blue }}>ぜんぶ見える。</span>
                    </div>
                    <div
                        style={{
                            marginTop: 24,
                            fontSize: 22,
                            fontWeight: 500,
                            color: COLORS.ink3,
                            lineHeight: 1.5,
                        }}
                    >
                        24場ぜんぶの回収率を、<br />ひと目で。
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
                        {["回収率", "的中率", "月別", "場別"].map((t) => (
                            <span
                                key={t}
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: 999,
                                    background: "#ffffff",
                                    border: `1px solid ${COLORS.line}`,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: COLORS.ink2,
                                }}
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        background: "#ffffff",
                        borderRadius: 20,
                        border: `1px solid ${COLORS.line}`,
                        padding: 20,
                        boxShadow: "0 30px 80px rgba(10,14,20,0.08)",
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 4,
                            background: COLORS.bgAlt,
                            borderRadius: 10,
                            padding: 4,
                            marginBottom: 12,
                        }}
                    >
                        {["通算", "2026年", "月別"].map((t, i) => (
                            <div
                                key={t}
                                style={{
                                    textAlign: "center",
                                    padding: "8px 0",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    background: i === 0 ? "#ffffff" : "transparent",
                                    borderRadius: 8,
                                    color: i === 0 ? COLORS.ink : COLORS.ink3,
                                    boxShadow: i === 0 ? "0 1px 3px rgba(10,14,20,0.1)" : "none",
                                }}
                            >
                                {t}
                            </div>
                        ))}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 14px",
                            border: `1px solid ${COLORS.line}`,
                            borderRadius: 10,
                            marginBottom: 12,
                        }}
                    >
                        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                            全場合計{" "}
                            <span style={{ color: COLORS.ink3, fontWeight: 500, fontSize: 12 }}>128R</span>
                        </span>
                        <span style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.blue }}>112.4%</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.blue }}>+324,000円</span>
                        </span>
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 6,
                        }}
                    >
                        {venues.map((v) => {
                            const rateNum = v.rate ? parseFloat(v.rate) : null;
                            const isProfit = rateNum !== null && rateNum >= 100;
                            const isLoss = rateNum !== null && rateNum < 100;
                            const isHero = v.name === "住之江";
                            return (
                                <div
                                    key={v.name}
                                    style={{
                                        border: `${isHero ? 2 : 1}px solid ${isHero ? COLORS.blue : COLORS.line}`,
                                        borderRadius: 8,
                                        padding: "6px 4px",
                                        textAlign: "center",
                                        boxShadow: isHero ? `0 0 16px rgba(30,94,255,0.3)` : "none",
                                    }}
                                >
                                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.ink, marginBottom: 1 }}>
                                        {v.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 800,
                                            color: isProfit ? COLORS.blue : isLoss ? COLORS.ink3 : "#b0b8c4",
                                        }}
                                    >
                                        {v.rate ? `${v.rate}%` : "-%"}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

// ========== Promo 3: 予想屋の収支可視化 ==========
export const Promo3 = () => {
    const tipsters = [
        { rank: 1, name: "舟券マエストロ", handle: "@maestro", roi: 178.4, hit: 42.1, sales: 312, hero: true },
        { rank: 2, name: "波乗りアナリスト", handle: "@naminori", roi: 143.2, hit: 38.9, sales: 189, hero: false },
        { rank: 3, name: "データ番長", handle: "@databancho", roi: 128.7, hit: 35.4, sales: 156, hero: false },
    ];

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
            <GridBackground />
            <CornerHud num="03" total="04" />

            <AbsoluteFill
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 60px",
                    gap: 40,
                }}
            >
                <div style={{ flex: 1.1 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "rgba(30,94,255,0.12)",
                            color: COLORS.blue,
                            fontSize: 16,
                            fontWeight: 800,
                            letterSpacing: 1,
                            marginBottom: 24,
                        }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: 8, background: COLORS.blue }} />
                        FEATURE 02
                    </div>
                    <div
                        style={{
                            color: COLORS.ink,
                            fontSize: 60,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                        }}
                    >
                        予想屋の成績も、
                    </div>
                    <div
                        style={{
                            color: COLORS.ink,
                            fontSize: 60,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                        }}
                    >
                        <span style={{ color: COLORS.blue }}>丸見え。</span>
                    </div>
                    <div
                        style={{
                            marginTop: 24,
                            fontSize: 22,
                            fontWeight: 500,
                            color: COLORS.ink3,
                            lineHeight: 1.5,
                        }}
                    >
                        回収率も的中率も、全公開。<br />本物だけが、生き残る。
                    </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {tipsters.map((t) => (
                        <div
                            key={t.rank}
                            style={{
                                background: "#ffffff",
                                borderRadius: 16,
                                border: `${t.hero ? 2 : 1}px solid ${t.hero ? COLORS.blue : COLORS.line}`,
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                boxShadow: t.hero
                                    ? "0 20px 50px rgba(30,94,255,0.18)"
                                    : "0 10px 30px rgba(10,14,20,0.05)",
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: t.hero ? COLORS.blue : COLORS.bgAlt,
                                    color: t.hero ? "#fff" : COLORS.ink,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    fontWeight: 900,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    flexShrink: 0,
                                }}
                            >
                                {t.rank}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 800,
                                        color: COLORS.ink,
                                        marginBottom: 2,
                                    }}
                                >
                                    {t.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: COLORS.ink3,
                                        fontWeight: 600,
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {t.handle}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 16 }}>
                                {[
                                    { label: "回収率", value: `${t.roi}%`, highlight: true },
                                    { label: "的中率", value: `${t.hit}%`, highlight: false },
                                    { label: "販売", value: `${t.sales}`, highlight: false },
                                ].map((m) => (
                                    <div key={m.label} style={{ textAlign: "right", minWidth: 62 }}>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: COLORS.ink3,
                                                fontWeight: 700,
                                                letterSpacing: 1,
                                                marginBottom: 2,
                                            }}
                                        >
                                            {m.label}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 20,
                                                fontWeight: 900,
                                                color: m.highlight ? COLORS.blue : COLORS.ink,
                                                fontFamily: "'JetBrains Mono', monospace",
                                            }}
                                        >
                                            {m.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

// ========== Promo 4: 予想屋メリット（売上アップ） ==========
export const Promo4 = () => {
    const bars = [
        { label: "M1", before: 40, after: 40 },
        { label: "M2", before: 55, after: 58 },
        { label: "M3", before: 48, after: 72 },
        { label: "M4", before: 62, after: 95 },
        { label: "M5", before: 58, after: 128 },
        { label: "M6", before: 65, after: 168 },
    ];
    const maxVal = 180;

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
            <GridBackground />
            <CornerHud num="04" total="04" />

            <AbsoluteFill
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 60px",
                    gap: 40,
                }}
            >
                <div style={{ flex: 1.1 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "rgba(22,163,74,0.14)",
                            color: COLORS.green,
                            fontSize: 16,
                            fontWeight: 800,
                            letterSpacing: 1,
                            marginBottom: 24,
                        }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: 8, background: COLORS.green }} />
                        FOR TIPSTERS
                    </div>
                    <div
                        style={{
                            color: COLORS.ink,
                            fontSize: 60,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                        }}
                    >
                        正しい予想屋が、
                    </div>
                    <div
                        style={{
                            color: COLORS.ink,
                            fontSize: 60,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                        }}
                    >
                        <span style={{ color: COLORS.green }}>正しく稼げる。</span>
                    </div>
                    <div
                        style={{
                            marginTop: 24,
                            fontSize: 20,
                            fontWeight: 500,
                            color: COLORS.ink3,
                            lineHeight: 1.5,
                        }}
                    >
                        note等の外部予想も登録OK。<br />売上の窓口を、ひとつに。
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 28, alignItems: "center" }}>
                        {["note", "Brain", "X", "その他"].map((s) => (
                            <span
                                key={s}
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: 10,
                                    background: "#ffffff",
                                    border: `1px solid ${COLORS.line}`,
                                    fontSize: 13,
                                    fontWeight: 800,
                                    color: COLORS.ink2,
                                }}
                            >
                                {s}
                            </span>
                        ))}
                        <span style={{ fontSize: 14, color: COLORS.ink3, fontWeight: 700 }}>→ 連携</span>
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        background: "#ffffff",
                        borderRadius: 20,
                        border: `1px solid ${COLORS.line}`,
                        padding: 24,
                        boxShadow: "0 30px 80px rgba(10,14,20,0.08)",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink3, letterSpacing: 1, marginBottom: 4 }}>
                                MONTHLY SALES
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.ink, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 }}>
                                ¥1,680,000
                            </div>
                        </div>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "6px 10px",
                                borderRadius: 8,
                                background: "rgba(22,163,74,0.14)",
                                color: COLORS.green,
                                fontSize: 14,
                                fontWeight: 900,
                            }}
                        >
                            ▲ +320%
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180, padding: "0 4px", borderBottom: `1px solid ${COLORS.line}` }}>
                        {bars.map((b) => (
                            <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%", justifyContent: "flex-end", position: "relative" }}>
                                <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, height: "100%" }}>
                                    <div
                                        style={{
                                            width: "42%",
                                            height: `${(b.before / maxVal) * 100}%`,
                                            background: COLORS.bgAlt,
                                            borderRadius: "6px 6px 0 0",
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: "42%",
                                            height: `${(b.after / maxVal) * 100}%`,
                                            background: `linear-gradient(180deg, ${COLORS.green} 0%, #0d8a3d 100%)`,
                                            borderRadius: "6px 6px 0 0",
                                            boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 10, padding: "10px 4px 0" }}>
                        {bars.map((b) => (
                            <div key={b.label} style={{ flex: 1, textAlign: "center", fontSize: 11, color: COLORS.ink3, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                                {b.label}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 16, marginTop: 16, padding: "12px 14px", background: COLORS.bgAlt, borderRadius: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.bgAlt, border: `1px solid ${COLORS.ink3}` }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink3 }}>従来</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.green }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink }}>BOAT BANK導入後</span>
                        </div>
                    </div>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
