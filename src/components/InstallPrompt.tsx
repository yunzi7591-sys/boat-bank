"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

function isDismissed() {
    try {
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        return dismissed ? Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000 : false;
    } catch {
        return false;
    }
}

export function InstallPrompt() {
    const [show, setShow] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // 既にPWAとして動作中 or 7日以内に閉じた場合は非表示
        if (window.matchMedia("(display-mode: standalone)").matches) return;
        if (isDismissed()) return;

        const ua = navigator.userAgent;
        const ios = /iPad|iPhone|iPod/.test(ua);
        setIsIOS(ios);

        if (ios) {
            setTimeout(() => setShow(true), 3000);
        } else {
            const handler = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e);
                if (!isDismissed()) {
                    setTimeout(() => setShow(true), 3000);
                }
            };
            window.addEventListener("beforeinstallprompt", handler);
            return () => window.removeEventListener("beforeinstallprompt", handler);
        }
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
        }
        setShow(false);
    };

    const handleDismiss = () => {
        setShow(false);
        try { localStorage.setItem("pwa-install-dismissed", Date.now().toString()); } catch {}
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-[80px] left-2 right-2 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-[#061b31] text-white rounded-xl p-4 shadow-xl flex items-start gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                    {isIOS ? <Share className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold mb-0.5">ホーム画面に追加</p>
                    {isIOS ? (
                        <p className="text-[11px] text-white/60 leading-relaxed">
                            画面下の共有ボタン
                            <Share className="w-3 h-3 inline mx-0.5" />
                            から「ホーム画面に追加」でアプリとして使えます
                        </p>
                    ) : (
                        <p className="text-[11px] text-white/60 leading-relaxed">
                            アプリとしてインストールすると通知も受け取れます
                        </p>
                    )}
                    {!isIOS && deferredPrompt && (
                        <button
                            onClick={handleInstall}
                            className="mt-2 bg-[#533afd] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-[#4434d4] transition-colors"
                        >
                            インストール
                        </button>
                    )}
                </div>
                <button onClick={handleDismiss} className="text-white/40 hover:text-white/80 p-1">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
