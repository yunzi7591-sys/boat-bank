"use client";

export function ShareXButton({ text, url }: { text: string; url: string }) {
    const share = () => {
        const appLink = `twitter://post?message=${encodeURIComponent(`${text}\n${url}`)}`;
        const webIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

        // まずXアプリを試し、開かなかった場合だけWeb版にフォールバックする
        const timer = setTimeout(() => {
            if (!document.hidden) {
                window.open(webIntent, "_blank", "noopener,noreferrer");
            }
        }, 1200);
        window.addEventListener(
            "visibilitychange",
            () => { if (document.hidden) clearTimeout(timer); },
            { once: true },
        );
        window.location.href = appLink;
    };

    return (
        <button
            type="button"
            onClick={share}
            className="block w-full bg-[#061b31] hover:bg-[#0f2a47] active:scale-[0.99] transition-all text-white text-center font-black rounded-xl py-4 mb-4"
        >
            𝕏 で結果をシェアする
        </button>
    );
}
