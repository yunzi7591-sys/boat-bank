import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
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
};

const SceneFade: React.FC<{ children: React.ReactNode; duration: number }> = ({ children, duration }) => {
    const frame = useCurrentFrame();
    const fadeIn = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(frame, [duration - 6, duration], [1, 0], { extrapolateLeft: "clamp" });
    return (
        <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
            {children}
        </AbsoluteFill>
    );
};

export const MainComp = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
            <Audio
                src={staticFile("bgm.mp3")}
                volume={(f) =>
                    interpolate(f, [0, 15, 330, 360], [0, 0.5, 0.5, 0], { extrapolateRight: "clamp" })
                }
            />
            <GridBackground />
            <Sequence from={0} durationInFrames={60}>
                <SceneFade duration={60}><Scene1 /></SceneFade>
            </Sequence>
            <Sequence from={60} durationInFrames={60}>
                <SceneFade duration={60}><Scene2 /></SceneFade>
            </Sequence>
            <Sequence from={120} durationInFrames={60}>
                <SceneFade duration={60}><Scene3 /></SceneFade>
            </Sequence>
            <Sequence from={180} durationInFrames={120}>
                <SceneFade duration={120}><Scene4 /></SceneFade>
            </Sequence>
            <Sequence from={300} durationInFrames={60}>
                <SceneFade duration={60}><Scene5 /></SceneFade>
            </Sequence>
        </AbsoluteFill>
    );
};

const GridBackground = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const driftX = interpolate(frame, [0, 360], [0, 120]);
    const driftY = interpolate(frame, [0, 360], [0, -80]);
    const pulse = Math.sin((frame / fps) * 0.8) * 0.08 + 1;

    return (
        <AbsoluteFill style={{ overflow: "hidden" }}>
            {/* ambient gradient blobs */}
            <div
                style={{
                    position: "absolute",
                    top: -200 + driftY,
                    left: -200 + driftX,
                    width: 1200,
                    height: 1200,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(30,94,255,0.28) 0%, rgba(30,94,255,0) 70%)",
                    filter: "blur(40px)",
                    transform: `scale(${pulse})`,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: -300 - driftY,
                    right: -300 - driftX,
                    width: 1400,
                    height: 1400,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(61,123,255,0.22) 0%, rgba(61,123,255,0) 70%)",
                    filter: "blur(50px)",
                    transform: `scale(${2 - pulse})`,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "40%",
                    left: "55%",
                    width: 900,
                    height: 900,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(11,60,207,0.15) 0%, rgba(11,60,207,0) 70%)",
                    filter: "blur(60px)",
                }}
            />
            {/* subtle noise/grain via svg feTurbulence */}
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.04, mixBlendMode: "multiply" }}>
                <filter id="grain">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
                    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#grain)" />
            </svg>
        </AbsoluteFill>
    );
};

const CornerHud = () => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
    return (
        <>
            <div
                style={{
                    position: "absolute",
                    top: 48,
                    left: 56,
                    opacity,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 20,
                    letterSpacing: 2,
                    color: COLORS.ink3,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <span style={{ width: 10, height: 10, borderRadius: 10, background: COLORS.blue }} />
                BOAT BANK · ON AIR
            </div>
            <div
                style={{
                    position: "absolute",
                    top: 48,
                    right: 56,
                    opacity,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 20,
                    letterSpacing: 2,
                    color: COLORS.ink3,
                }}
            >
                VOL.04 / 2026
            </div>
        </>
    );
};

const SceneKicker: React.FC<{ num: string; tag: string }> = ({ num, tag }) => {
    return (
        <div
            style={{
                position: "absolute",
                bottom: 56,
                left: 56,
                display: "flex",
                gap: 16,
                alignItems: "center",
                fontFamily: "'JetBrains Mono', monospace",
                color: COLORS.ink3,
                fontSize: 20,
                letterSpacing: 3,
            }}
        >
            <span>§ {num}</span>
            <span style={{ width: 40, height: 1, background: COLORS.ink3 }} />
            <span>{tag}</span>
        </div>
    );
};

const Scene1 = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const introProgress = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
    const clipPercent = interpolate(introProgress, [0, 1], [100, 0]);
    const subtleScale = interpolate(frame, [20, 55], [1, 1.03], { extrapolateRight: "clamp" });
    const drift = interpolate(frame, [0, 60], [8, -4]);

    return (
        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    color: COLORS.ink,
                    fontSize: 140,
                    fontWeight: 900,
                    letterSpacing: -2,
                    lineHeight: 1.1,
                    clipPath: `inset(0 ${clipPercent}% 0 0)`,
                    transform: `scale(${subtleScale}) translateY(${drift}px)`,
                }}
            >
                収支の見えない
            </div>
            {/* question marks floating in bg */}
            {[
                { x: 20, y: 25, size: 80, delay: 5 },
                { x: 78, y: 30, size: 60, delay: 10 },
                { x: 15, y: 72, size: 50, delay: 15 },
                { x: 82, y: 70, size: 70, delay: 20 },
            ].map((q, i) => {
                const p = interpolate(frame, [q.delay, q.delay + 30], [0, 1], { extrapolateRight: "clamp" });
                return (
                    <span
                        key={i}
                        style={{
                            position: "absolute",
                            top: `${q.y}%`,
                            left: `${q.x}%`,
                            fontSize: q.size,
                            fontWeight: 900,
                            color: COLORS.ink,
                            opacity: p * 0.08,
                            transform: `translateY(${interpolate(p, [0, 1], [20, 0])}px) rotate(${(i % 2 ? 1 : -1) * 12}deg)`,
                        }}
                    >
                        ?
                    </span>
                );
            })}
        </AbsoluteFill>
    );
};

const Scene2 = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const iconScale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
    const xProgress = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 140 } });

    const xAngle = interpolate(xProgress, [0, 1], [-20, 0]);
    const xScale = interpolate(xProgress, [0, 1], [0, 1]);

    // breathing pulse on evil icon
    const breath = 1 + Math.sin((frame / fps) * 3.5) * 0.02;
    // eye glow pulse
    const eyeGlow = 0.8 + Math.abs(Math.sin((frame / fps) * 5)) * 0.5;
    // shake on X impact
    const shake = frame >= 10 && frame <= 22 ? Math.sin(frame * 3) * (22 - frame) * 0.6 : 0;

    return (
        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: 280,
                    height: 280,
                    marginBottom: 48,
                    transform: `scale(${iconScale * breath}) translateX(${shake}px)`,
                }}
            >
                {/* devil horns */}
                <svg
                    width="280"
                    height="80"
                    viewBox="0 0 280 80"
                    style={{
                        position: "absolute",
                        top: -30,
                        left: 0,
                    }}
                >
                    <path d="M 70 70 L 55 15 L 100 55 Z" fill="#0a0e14" />
                    <path d="M 210 70 L 225 15 L 180 55 Z" fill="#0a0e14" />
                </svg>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        background: "#0a0e14",
                        boxShadow: `0 20px 60px rgba(225,29,29,0.35), inset 0 0 40px rgba(225,29,29,0.25)`,
                    }}
                />
                {/* evil eyes glow */}
                <div
                    style={{
                        position: "absolute",
                        top: 110,
                        left: 60,
                        width: 24,
                        height: 10,
                        borderRadius: 4,
                        background: COLORS.red,
                        boxShadow: `0 0 ${16 + eyeGlow * 16}px ${COLORS.red}`,
                        opacity: eyeGlow,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: 110,
                        right: 60,
                        width: 24,
                        height: 10,
                        borderRadius: 4,
                        background: COLORS.red,
                        boxShadow: `0 0 ${16 + eyeGlow * 16}px ${COLORS.red}`,
                        opacity: eyeGlow,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-end",
                        paddingBottom: 60,
                        fontSize: 72,
                        fontWeight: 900,
                        color: COLORS.red,
                        textShadow: `0 0 24px ${COLORS.red}`,
                        letterSpacing: -2,
                    }}
                >
                    予
                </div>
                <svg
                    width="280"
                    height="280"
                    style={{
                        position: "absolute",
                        inset: 0,
                        transform: `scale(${xScale}) rotate(${xAngle}deg)`,
                    }}
                >
                    <line x1="60" y1="60" x2="220" y2="220" stroke={COLORS.red} strokeWidth="22" strokeLinecap="round" />
                    <line x1="220" y1="60" x2="60" y2="220" stroke={COLORS.red} strokeWidth="22" strokeLinecap="round" />
                </svg>
            </div>
            <div
                style={{
                    color: COLORS.ink,
                    fontSize: 140,
                    fontWeight: 900,
                    letterSpacing: -2,
                    lineHeight: 1.1,
                }}
            >
                予想屋を
            </div>
        </AbsoluteFill>
    );
};

const Scene3 = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const checkProgress = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
    const dash = interpolate(checkProgress, [0, 1], [300, 0]);
    // ripple waves after check completes
    const ripple1 = interpolate(frame, [18, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const ripple2 = interpolate(frame, [28, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const circleBreath = 1 + Math.sin((frame / fps) * 3) * 0.015;

    return (
        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: 280,
                    height: 280,
                    marginBottom: 48,
                }}
            >
                {/* ripples */}
                {[ripple1, ripple2].map((r, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            border: `3px solid ${COLORS.blue}`,
                            transform: `scale(${1 + r * 1.4})`,
                            opacity: (1 - r) * 0.7,
                        }}
                    />
                ))}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        background: COLORS.blue,
                        boxShadow: "0 30px 80px rgba(30,94,255,0.35)",
                        transform: `scale(${circleBreath})`,
                    }}
                />
                <svg width="280" height="280" style={{ position: "absolute", inset: 0 }}>
                    <path
                        d="M 70 150 L 120 200 L 220 90"
                        stroke="#ffffff"
                        strokeWidth="22"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        strokeDasharray="300"
                        strokeDashoffset={dash}
                    />
                </svg>
            </div>
            <div
                style={{
                    color: COLORS.ink,
                    fontSize: 130,
                    fontWeight: 900,
                    letterSpacing: -2,
                    lineHeight: 1.1,
                }}
            >
                信じるのは
                <span style={{ color: COLORS.blue }}>やめよう</span>
            </div>
        </AbsoluteFill>
    );
};

const Scene4 = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const cardProgress = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
    const textOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: "clamp" });

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
        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                padding: "0 120px",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 80,
                    width: "100%",
                    maxWidth: 1600,
                    alignItems: "center",
                }}
            >
                <div>
                    <div
                        style={{
                            color: COLORS.ink,
                            fontSize: 82,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            opacity: textOpacity,
                            whiteSpace: "nowrap",
                        }}
                    >
                        詳細に分析された
                    </div>
                    <div
                        style={{
                            fontSize: 82,
                            fontWeight: 900,
                            letterSpacing: -2,
                            lineHeight: 1.15,
                            marginTop: 4,
                            opacity: textOpacity,
                            color: COLORS.ink,
                            whiteSpace: "nowrap",
                        }}
                    >
                        予想を<span style={{ color: COLORS.blue }}>信じよう</span>
                    </div>
                </div>

                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: 20,
                        border: `1px solid ${COLORS.line}`,
                        padding: 28,
                        boxShadow: "0 30px 80px rgba(10,14,20,0.08)",
                        transform: `translateY(${interpolate(cardProgress, [0, 1], [40, 0])}px)`,
                        opacity: cardProgress,
                    }}
                >
                    {/* time-of-day tabs */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            gap: 4,
                            background: COLORS.bgAlt,
                            borderRadius: 12,
                            padding: 4,
                            marginBottom: 12,
                        }}
                    >
                        {["全て", "モーニング", "デイ", "ナイター", "ミッドナイト"].map((t, i) => (
                            <div
                                key={t}
                                style={{
                                    textAlign: "center",
                                    padding: "10px 0",
                                    fontSize: 15,
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
                    {/* period tabs */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 4,
                            background: COLORS.bgAlt,
                            borderRadius: 12,
                            padding: 4,
                            marginBottom: 16,
                        }}
                    >
                        {["通算", "2026年", "月別"].map((t, i) => (
                            <div
                                key={t}
                                style={{
                                    textAlign: "center",
                                    padding: "10px 0",
                                    fontSize: 15,
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
                    {/* mode chips */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        <span
                            style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: COLORS.blue,
                                color: "#ffffff",
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                        >
                            回収率
                        </span>
                        <span
                            style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: COLORS.bgAlt,
                                color: COLORS.ink3,
                                fontSize: 13,
                                fontWeight: 700,
                            }}
                        >
                            利益
                        </span>
                    </div>
                    {/* summary */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 16px",
                            border: `1px solid ${COLORS.line}`,
                            borderRadius: 12,
                            marginBottom: 14,
                        }}
                    >
                        <span style={{ fontSize: 17, fontWeight: 700, color: COLORS.ink }}>
                            全場合計 <span style={{ color: COLORS.ink3, fontWeight: 500, fontSize: 14 }}>28R</span>
                        </span>
                        <span style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.blue }}>
                                {interpolate(frame, [30, 75], [0, 112.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }).toFixed(1)}%
                            </span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.blue }}>
                                +{Math.round(interpolate(frame, [30, 75], [0, 324000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })).toLocaleString()}円
                            </span>
                        </span>
                    </div>
                    {/* 24 venue grid */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 8,
                        }}
                    >
                        {venues.map((v, i) => {
                            const cellProgress = spring({
                                frame: frame - 10 - i * 1.2,
                                fps,
                                config: { damping: 18, stiffness: 140 },
                            });
                            const rateNum = v.rate ? parseFloat(v.rate) : null;
                            const isProfit = rateNum !== null && rateNum >= 100;
                            const isLoss = rateNum !== null && rateNum < 100;
                            const isHero = v.name === "住之江";
                            const heroPulse = isHero
                                ? 1 + Math.sin(Math.max(0, (frame - 70) / fps) * 4) * 0.04
                                : 1;
                            const heroGlow = isHero
                                ? interpolate(frame, [70, 85, 100, 115], [0, 1, 1, 0.6], { extrapolateRight: "clamp" })
                                : 0;
                            return (
                                <div
                                    key={v.name}
                                    style={{
                                        position: "relative",
                                        border: `${isHero ? 2 : 1}px solid ${isHero && heroGlow > 0 ? COLORS.blue : COLORS.line}`,
                                        borderRadius: 10,
                                        padding: "10px 8px",
                                        textAlign: "center",
                                        opacity: cellProgress,
                                        transform: `scale(${interpolate(cellProgress, [0, 1], [0.8, 1]) * heroPulse})`,
                                        boxShadow: isHero && heroGlow > 0 ? `0 0 ${20 * heroGlow}px rgba(30,94,255,${0.5 * heroGlow})` : "none",
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 2 }}>
                                        {v.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 16,
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
            </div>
        </AbsoluteFill>
    );
};

const Scene5 = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const logoProgress = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
    const urlOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
    const taglineOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
    const appStoreOpacity = interpolate(frame, [32, 48], [0, 1], { extrapolateRight: "clamp" });
    const appStoreSlide = interpolate(frame, [32, 48], [20, 0], { extrapolateRight: "clamp" });
    // URL pill breathing after it settles
    const urlBreath = frame > 40 ? 1 + Math.sin((frame - 40) / fps * 4) * 0.015 : 1;
    // logo subtle float
    const logoFloat = Math.sin((frame / fps) * 2) * 3;

    return (
        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "center",
                    transform: `scale(${logoProgress}) translateY(${logoFloat}px)`,
                }}
            >
                <div
                    style={{
                        width: 140,
                        height: 140,
                        borderRadius: 28,
                        background: COLORS.blue,
                        color: "#ffffff",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: 96,
                        fontWeight: 900,
                        boxShadow: "0 30px 80px rgba(30,94,255,0.35)",
                    }}
                >
                    B
                </div>
                <div
                    style={{
                        fontSize: 140,
                        fontWeight: 900,
                        letterSpacing: -3,
                        color: COLORS.ink,
                    }}
                >
                    BOAT BANK
                </div>
            </div>

            <div
                style={{
                    marginTop: 32,
                    fontSize: 48,
                    fontWeight: 700,
                    color: COLORS.ink2,
                    letterSpacing: -1,
                    opacity: taglineOpacity,
                }}
            >
                競艇を<span style={{ color: COLORS.blue }}>データで</span>
            </div>

            <div
                style={{
                    marginTop: 56,
                    padding: "28px 64px",
                    borderRadius: 999,
                    background: COLORS.blue,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 64,
                    fontWeight: 800,
                    letterSpacing: 2,
                    color: "#ffffff",
                    opacity: urlOpacity,
                    boxShadow: `0 20px 60px rgba(30,94,255,${0.35 * urlBreath})`,
                    transform: `scale(${urlBreath})`,
                }}
            >
                boatbank.jp
            </div>

            <div
                style={{
                    marginTop: 32,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: "14px 28px",
                    borderRadius: 999,
                    background: COLORS.ink,
                    color: "#ffffff",
                    opacity: appStoreOpacity,
                    transform: `translateY(${appStoreSlide}px)`,
                }}
            >
                <svg width="28" height="34" viewBox="0 0 384 512" fill="#ffffff" aria-hidden="true">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
                    <span style={{ fontSize: 14, letterSpacing: 1, opacity: 0.7, fontFamily: "'JetBrains Mono', monospace" }}>
                        Download on the
                    </span>
                    <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginTop: 2 }}>
                        App Store
                    </span>
                </div>
            </div>
        </AbsoluteFill>
    );
};
