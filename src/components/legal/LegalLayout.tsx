import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function LegalLayout({
    title,
    updatedAt,
    intro,
    children,
}: {
    title: string;
    updatedAt: string;
    intro?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-full bg-slate-50 px-4 py-6 sm:py-10">
            <div className="max-w-2xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-xs text-[#533afd] hover:underline mb-4"
                >
                    <ChevronLeft className="w-3 h-3" />
                    トップに戻る
                </Link>

                <header className="mb-6 pb-6 border-b border-slate-200">
                    <h1 className="text-2xl font-black text-[#061b31] tracking-tight mb-2">
                        {title}
                    </h1>
                    <p className="text-xs text-slate-500">最終更新日: {updatedAt}</p>
                </header>

                {intro && (
                    <div className="bg-white rounded-2xl p-5 mb-6 text-sm text-slate-700 leading-relaxed border border-slate-100">
                        {intro}
                    </div>
                )}

                <div className="space-y-4">
                    {children}
                </div>

                <footer className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-400">
                    <p>
                        URL:{" "}
                        <a href="https://boatbank.jp" className="text-[#533afd] hover:underline">
                            https://boatbank.jp
                        </a>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                        <Link href="/terms" className="hover:text-[#533afd]">利用規約</Link>
                        <span>|</span>
                        <Link href="/privacy" className="hover:text-[#533afd]">プライバシーポリシー</Link>
                        <span>|</span>
                        <Link href="/sct" className="hover:text-[#533afd]">特定商取引法</Link>
                        <span>|</span>
                        <Link href="/contact" className="hover:text-[#533afd]">お問い合わせ</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export function Section({
    num,
    title,
    children,
}: {
    num: number;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[rgba(50,50,93,0.05)_0px_4px_12px]">
            <h2 className="flex items-baseline gap-2 mb-3 pb-3 border-b border-slate-100">
                <span className="text-xs font-black text-[#533afd] tabular-nums">
                    {String(num).padStart(2, "0")}
                </span>
                <span className="text-base font-bold text-[#061b31] tracking-tight">
                    {title}
                </span>
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed space-y-3">
                {children}
            </div>
        </section>
    );
}

export function Highlight({ children }: { children: React.ReactNode }) {
    return (
        <p className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded-r-md text-amber-900 text-sm">
            {children}
        </p>
    );
}

export function BulletList({ items }: { items: React.ReactNode[] }) {
    return (
        <ul className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex gap-2">
                    <span className="text-[#533afd] font-bold flex-shrink-0">・</span>
                    <span className="flex-1">{item}</span>
                </li>
            ))}
        </ul>
    );
}
