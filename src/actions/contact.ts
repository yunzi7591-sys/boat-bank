"use server";

import { auth } from "@/auth";
import { sendContactEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const CATEGORIES = ["不具合報告", "ご要望", "サブスクについて", "その他"] as const;
type Category = typeof CATEGORIES[number];

export async function sendContactMessage(formData: FormData) {
    const name = (formData.get("name") as string || "").trim();
    const email = (formData.get("email") as string || "").trim().toLowerCase();
    const category = formData.get("category") as Category;
    const message = (formData.get("message") as string || "").trim();

    if (!name || !email || !category || !message) {
        return { error: "すべての項目を入力してください" };
    }

    if (!CATEGORIES.includes(category)) {
        return { error: "カテゴリが不正です" };
    }

    if (name.length > 100) {
        return { error: "名前が長すぎます（100文字以内）" };
    }

    if (message.length > 3000) {
        return { error: "メッセージが長すぎます（3000文字以内）" };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: "メールアドレスの形式が正しくありません" };
    }

    const ip = await getClientIp();
    const ipLimit = await rateLimit(`contact:ip:${ip}`, 5, 60 * 60 * 1000);
    const emailLimit = await rateLimit(`contact:email:${email}`, 3, 60 * 60 * 1000);
    if (!ipLimit.allowed || !emailLimit.allowed) {
        return { error: "短時間に多くの送信が検出されました。しばらく経ってからお試しください。" };
    }

    const session = await auth();
    const userId = session?.user?.id;

    try {
        await sendContactEmail({
            fromName: name,
            fromEmail: email,
            category,
            message,
            userId,
        });
        return { success: true };
    } catch (error) {
        return { error: "送信に失敗しました。時間をおいて再度お試しください。" };
    }
}
