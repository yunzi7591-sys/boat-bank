"use client";

import { useState, useEffect } from "react";
import { Download, Share, Bell, Smartphone } from "lucide-react";

export function InstallBanner() {
    const [isInstalled, setIsInstalled] = useState(true);
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
        <div className="mx-4 mt-4">
            <div className="bg-white border border-[#e5edf5] rounded-xl overflow-hidden">
                {/* ヘッダー */}
                <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#533afd] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-[#061b31]">アプリとして使う</p>
                        <p className="text-[11px] text-[#94a3b8]">ホーム画面から直接アクセス</p>
                    </div>
                </div>

                {/* メリット */}
                <div className="px-4 pb-3 flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <Bell className="w-3 h-3 text-[#533afd]" />
                        <span className="text-[11px] text-[#64748d]">プッシュ通知</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Download className="w-3 h-3 text-[#533afd]" />
                        <span className="text-[11px] text-[#64748d]">フルスクリーン</span>
                    </div>
                </div>

                {/* 手順 */}
                <div className="border-t border-[#f1f5f9] px-4 py-3 bg-[#f8fafc]">
                    {isIOS ? (
                        <div className="flex items-center gap-2">
                            <Share className="w-4 h-4 text-[#533afd] shrink-0" />
                            <p className="text-[12px] text-[#061b31]">
                                <span className="font-bold">共有</span> → <span className="font-bold">ホーム画面に追加</span>をタップ
                            </p>
                        </div>
                    ) : deferredPrompt ? (
                        <button
                            onClick={handleInstall}
                            className="w-full bg-[#533afd] text-white text-sm font-bold py-2.5 rounded-lg hover:bg-[#4434d4] transition-colors"
                        >
                            インストール
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 text-[#533afd] shrink-0" />
                            <p className="text-[12px] text-[#061b31]">
                                ブラウザメニュー → <span className="font-bold">ホーム画面に追加</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
