import { Zen_Kaku_Gothic_New, Anton, JetBrains_Mono } from "next/font/google";

const zenKaku = Zen_Kaku_Gothic_New({
    weight: ["400", "500", "700", "900"],
    subsets: ["latin"],
    variable: "--font-zen-kaku",
    display: "swap",
});

const anton = Anton({
    weight: ["400"],
    subsets: ["latin"],
    variable: "--font-anton",
    display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
    weight: ["400", "500", "700"],
    subsets: ["latin"],
    variable: "--font-jetbrains",
    display: "swap",
});

export default function LpLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`${zenKaku.variable} ${anton.variable} ${jetBrainsMono.variable}`}>
            {children}
        </div>
    );
}
