"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { isNativeApp, isIOS } from "@/lib/platform";
import { toast } from "sonner";

export function AppleSignInButton({ callbackUrl = "/mypage", beforeSignIn }: { callbackUrl?: string; beforeSignIn?: () => boolean }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [native, setNative] = useState(false);

    useEffect(() => {
        setNative(isNativeApp() && isIOS());
    }, []);

    async function handleClick() {
        if (beforeSignIn && !beforeSignIn()) return;
        setLoading(true);
        try {
            if (native) {
                const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
                const clientId = process.env.NEXT_PUBLIC_APPLE_BUNDLE_ID || "jp.boatbank.app";
                const res = await SignInWithApple.authorize({
                    clientId,
                    redirectURI: "https://boatbank.jp/api/auth/callback/apple",
                    scopes: "email name",
                });
                const identityToken = res.response?.identityToken;
                if (!identityToken) {
                    toast.error("Apple サインインに失敗しました");
                    setLoading(false);
                    return;
                }
                const fullName = [res.response?.givenName, res.response?.familyName].filter(Boolean).join(" ");
                const result = await signIn("apple-native", {
                    identityToken,
                    name: fullName || undefined,
                    redirect: false,
                });
                if (result?.error) {
                    toast.error("ログインに失敗しました");
                    setLoading(false);
                    return;
                }
                router.push(callbackUrl);
                router.refresh();
            } else {
                await signIn("apple", { callbackUrl });
            }
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            if (err?.code === "1001" || err?.message?.includes("canceled")) {
                // ユーザーキャンセル
            } else {
                console.error("[AppleSignIn] error", e);
                toast.error("Apple サインインでエラーが発生しました");
            }
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="w-full h-11 bg-black text-white font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-60"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                    <path d="M17.564 12.77c-.025-2.548 2.08-3.781 2.175-3.841-1.186-1.733-3.03-1.97-3.684-2-1.571-.159-3.063.923-3.86.923-.807 0-2.025-.901-3.33-.875-1.715.025-3.3.997-4.18 2.532-1.78 3.087-.455 7.642 1.28 10.14.848 1.22 1.85 2.59 3.164 2.542 1.273-.05 1.752-.823 3.288-.823 1.535 0 1.963.823 3.303.795 1.367-.025 2.231-1.242 3.066-2.467.966-1.413 1.364-2.785 1.388-2.855-.03-.015-2.66-1.022-2.69-4.051zM14.902 4.62C15.616 3.758 16.097 2.56 15.965 1.37c-1.03.041-2.276.685-3.011 1.547-.66.762-1.237 1.98-1.08 3.148 1.15.088 2.322-.58 3.028-1.445z"/>
                </svg>
            )}
            <span>Apple で{loading ? "処理中..." : "続ける"}</span>
        </button>
    );
}
