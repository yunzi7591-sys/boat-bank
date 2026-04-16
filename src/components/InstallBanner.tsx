"use client";

import { useState, useEffect } from "react";
import { Download, Share } from "lucide-react";

export function InstallBanner() {
    const [isInstalled, setIsInstalled] = useState(true); // 初期非表示、チェック後に表示
    const [isIOS, setIsIOS] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }
        setIsInstalled(false);

        const ua = navigator.userAgent;
        setIsIOS(/iPad|iPhone|iPod/.test(ua));

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
        }
    };

    if (isInstalled) return null;

    return (
        <div className="mx-4 mt-4 bg-gradient-to-r from-[#533afd] to-[#7c5cfc] rounded-xl p-4 text-white">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                    {isIOS ? <Share className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold mb-1">アプリをインストール</p>
                    <p className="text-[11px] text-white/70 leading-relaxed mb-2">
                        ホーム画面に追加するとプッシュ通知を受け取れます
                    </p>
                    {isIOS ? (
                        <p className="text-[11px] text-white/80 bg-white/10 rounded-lg px-3 py-2 leading-relaxed">
                            画面下の<Share className="w-3 h-3 inline mx-0.5 -mt-0.5" />共有ボタン →「ホーム画面に追加」をタップ
                        </p>
                    ) : deferredPrompt ? (
                        <button
                            onClick={handleInstall}
                            className="bg-white text-[#533afd] text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
                        >
                            インストール
                        </button>
                    ) : (
                        <p className="text-[11px] text-white/80 bg-white/10 rounded-lg px-3 py-2 leading-relaxed">
                            ブラウザメニューから「ホーム画面に追加」をタップ
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
