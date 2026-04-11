"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(data: { name: string; bio: string; link?: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Input validation
    if (!data.name || data.name.trim().length === 0 || data.name.length > 50) {
        return { success: false, error: "名前は1〜50文字で入力してください。" };
    }
    if (data.bio && data.bio.length > 500) {
        return { success: false, error: "自己紹介は500文字以内で入力してください。" };
    }
    if (data.link && (data.link.length > 200 || !/^https?:\/\//.test(data.link))) {
        return { success: false, error: "リンクは有効なURL（http/httpsで始まる200文字以内）を入力してください。" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                bio: data.bio,
                link: data.link || null,
            },
        });

        revalidatePath("/mypage");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "プロフィールの更新に失敗しました。" };
    }
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "ログインが必要です。" };
    }

    const userId = session.user.id;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user?.password) {
            return { success: false, error: "パスワードが設定されていません。" };
        }

        const isValid = await bcrypt.compare(data.currentPassword, user.password);
        if (!isValid) {
            return { success: false, error: "現在のパスワードが正しくありません。" };
        }

        if (data.newPassword.length < 8) {
            return { success: false, error: "新しいパスワードは8文字以上で入力してください。" };
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: "パスワードの変更に失敗しました。" };
    }
}
