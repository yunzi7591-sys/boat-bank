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
        return { success: false, error: error.message || "Failed to update profile." };
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
        return { success: false, error: error.message || "パスワードの変更に失敗しました。" };
    }
}
