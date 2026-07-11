"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";

/** アプリ（Capacitor WebView）からのリクエストかどうか。
 * アプリはUser-Agentに "BoatBankApp" を付けて名乗る（capacitor.config.ts の appendUserAgent） */
async function isFromNativeApp(): Promise<boolean> {
    const ua = (await headers()).get("user-agent") || "";
    return ua.includes("BoatBankApp");
}

/** 予想家への星評価を登録・更新する（星のみ・1人1件） */
export async function setUserRating(targetId: string, rating: number) {
    if (!(await isFromNativeApp())) {
        return { success: false, error: "評価はアプリ版からのみ行えます。アプリを最新版に更新してください。" };
    }
    const session = await auth();
    const raterId = session?.user?.id;
    if (!raterId) return { success: false, error: "ログインが必要です。" };
    if (raterId === targetId) return { success: false, error: "自分自身は評価できません。" };
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return { success: false, error: "評価は1〜5で指定してください。" };
    }

    const limit = await rateLimit(`rating:${raterId}`, 30, 60 * 60 * 1000);
    if (!limit.allowed) return { success: false, error: "操作が多すぎます。しばらくしてからお試しください。" };

    // 公開予想を1件以上持つユーザーのみ評価対象にする
    const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, _count: { select: { predictions: { where: { isPrivate: false } } } } },
    });
    if (!target) return { success: false, error: "ユーザーが見つかりません。" };
    if (target._count.predictions === 0) return { success: false, error: "このユーザーはまだ評価できません。" };

    await prisma.userRating.upsert({
        where: { raterId_targetId: { raterId, targetId } },
        create: { raterId, targetId, rating },
        update: { rating },
    });

    revalidatePath(`/users/${targetId}`);
    return { success: true };
}

/** 自分が付けた星評価を取り消す */
export async function clearUserRating(targetId: string) {
    if (!(await isFromNativeApp())) {
        return { success: false, error: "評価はアプリ版からのみ行えます。アプリを最新版に更新してください。" };
    }
    const session = await auth();
    const raterId = session?.user?.id;
    if (!raterId) return { success: false, error: "ログインが必要です。" };

    await prisma.userRating.deleteMany({ where: { raterId, targetId } });
    revalidatePath(`/users/${targetId}`);
    return { success: true };
}
