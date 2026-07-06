"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Bell, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { isNativeApp, getPlatform } from "@/lib/platform";

const STORAGE_KEY = "push-permission-asked-v2";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function isStandalone() {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if ((window.navigator as any).standalone === true) return true;
    return false;
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24時間

export function PushPermissionPrompt({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [native, setNative] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) return;

        const onNative = isNativeApp();
        setNative(onNative);

        // クールダウンチェック (24時間)
        try {
            const last = localStorage.getItem(STORAGE_KEY);
            if (last && Date.now() - Number(last) < COOLDOWN_MS) return;
        } catch {}

        let cancelled = false;
        (async () => {
            if (onNative) {
                try {
                    const { Capacitor } = await import("@capacitor/core");
                    if (!Capacitor.isPluginAvailable("PushNotifications")) return;
                    const { PushNotifications } = await import("@capacitor/push-notifications");
                    const status = await PushNotifications.checkPermissions();
                    if (status.receive === "granted" || status.receive === "denied") return;
                } catch {
                    return;
                }
            } else {
                if (!isStandalone()) return;
                if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
                if (Notification.permission !== "default") return;
            }
            if (cancelled) return;
            setTimeout(() => !cancelled && setOpen(true), 1200);
        })();
        return () => { cancelled = true; };
    }, [isLoggedIn]);

    const close = (setCooldown = true) => {
        if (setCooldown) {
            try { localStorage.setItem(STORAGE_KEY, Date.now().toString()); } catch {}
        }
        setOpen(false);
    };

    const handleAllow = async () => {
        setLoading(true);
        try {
            if (native) {
                const { PushNotifications } = await import("@capacitor/push-notifications");

                const perm = await PushNotifications.requestPermissions();
                if (perm.receive !== "granted") {
                    toast.error("通知が許可されませんでした");
                    close();
                    return;
                }

                let resolveToken!: (token: string) => void;
                let rejectToken!: (err: Error) => void;
                const tokenPromise = new Promise<string>((res, rej) => {
                    resolveToken = res;
                    rejectToken = rej;
                });

                const regHandle = await PushNotifications.addListener("registration", (token) => {
                    resolveToken(token.value);
                });
                const errHandle = await PushNotifications.addListener("registrationError", (err) => {
                    rejectToken(new Error(err.error || "registration error"));
                });

                const timeoutId = setTimeout(() => {
                    rejectToken(new Error("APNs registration timeout (8s) - 古いビルドの可能性"));
                }, 8000);

                let deviceToken: string;
                try {
                    await PushNotifications.register();
                    deviceToken = await tokenPromise;
                } catch (regErr) {
                    // トークン取得失敗（FCM未設定の旧ビルド / タイムアウト等）は静かに終了。
                    // 未更新の旧アプリで失敗トーストが出るのを防ぐ。
                    console.warn("[Push] token registration skipped", regErr);
                    setLoading(false);
                    close();
                    return;
                } finally {
                    clearTimeout(timeoutId);
                    regHandle.remove();
                    errHandle.remove();
                }

                const res = await fetch("/api/push/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ platform: getPlatform(), token: deviceToken }),
                });

                if (res.ok) {
                    toast.success("通知をONにしました");
                } else {
                    toast.error("通知の設定に失敗しました");
                }
                setLoading(false);
                close();
                return;
            }

            const reg = await navigator.serviceWorker.register("/sw.js");
            await navigator.serviceWorker.ready;

            const perm = await Notification.requestPermission();
            if (perm !== "granted") {
                toast.error("通知が許可されませんでした");
                close();
                return;
            }

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                ),
            });

            const res = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
                        auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
                    },
                }),
            });

            if (res.ok) {
                toast.success("通知をONにしました");
            } else {
                toast.error("通知の設定に失敗しました");
            }
        } catch (e) {
            console.error("[PushPermissionPrompt]", e);
            const msg = e instanceof Error ? e.message : String(e);
            toast.error(`通知の設定に失敗しました: ${msg.slice(0, 80)}`);
            setLoading(false);
            close(false);
            return;
        }
        setLoading(false);
        close();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && close()}>
            <DialogContent className="max-w-sm p-0 border-0 overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white rounded-2xl">
                <DialogTitle className="sr-only">通知をONにする</DialogTitle>

                <div className="relative px-6 pt-8 pb-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="absolute top-4 right-6"
                    >
                        <Sparkles className="w-5 h-5 text-sky-300" />
                    </motion.div>

                    <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
                    >
                        <Bell className="w-7 h-7 text-sky-300" />
                    </motion.div>

                    <motion.h2
                        initial={{ y: -5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg font-bold mb-2"
                    >
                        通知をONにしませんか？
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs text-white/70 mb-6 leading-relaxed"
                    >
                        予想が購入された時や、<br />
                        フォロー中の人が新しい予想を出した時に<br />
                        すぐお知らせが届きます
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={handleAllow}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mb-2"
                    >
                        {loading ? "処理中..." : "通知をONにする"}
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => close()}
                        disabled={loading}
                        className="w-full text-white/60 hover:text-white font-semibold py-2 text-sm transition-colors"
                    >
                        あとで
                    </motion.button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
