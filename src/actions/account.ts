"use server";

import bcrypt from "bcryptjs";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function deleteAccount(input: {
    confirmation: string;
    password?: string;
}): Promise<{ success: boolean; error?: string }> {
    if (input.confirmation !== "削除") {
        return { success: false, error: "確認文字列が一致しません" };
    }

    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "ログインしていません" };
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
    });
    if (!user) {
        return { success: false, error: "ユーザーが見つかりません" };
    }

    if (user.password) {
        if (!input.password) {
            return { success: false, error: "パスワードを入力してください" };
        }
        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) {
            return { success: false, error: "パスワードが正しくありません" };
        }
    }

    try {
        await prisma.user.delete({ where: { id: userId } });
    } catch (e) {
        console.error("[deleteAccount] failed", e);
        return { success: false, error: "削除処理に失敗しました。サポートにお問い合わせください" };
    }

    await signOut({ redirect: false });
    return { success: true };
}

export async function getCurrentUserHasPassword(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) return false;
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
    });
    return Boolean(user?.password);
}
