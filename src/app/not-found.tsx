import Link from "next/link";

/**
 * 存在しないURLにアクセスした際の404画面（日本語）。
 */
export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f1f0ff] flex items-center justify-center mb-5">
                <span className="text-2xl font-black text-[#533afd]" aria-hidden="true">404</span>
            </div>
            <h1 className="text-lg font-black text-[#061b31] mb-2">
                ページが見つかりません
            </h1>
            <p className="text-sm text-[#64748d] leading-relaxed mb-6 max-w-xs">
                お探しのページは、移動または削除された可能性があります。
            </p>
            <Link
                href="/"
                className="bg-[#533afd] hover:bg-[#432ae0] text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
                ホームに戻る
            </Link>
        </div>
    );
}
