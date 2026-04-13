"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllUsers() {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        return { error: "権限がありません", users: [] };
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                points: true,
                dailyPoints: true,
                emailVerified: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        predictions: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });
        return { users };
    } catch (error) {
        console.error("getAllUsers error:", error);
        return { error: "ユーザー一覧の取得に失敗しました", users: [] };
    }
}

export async function updateUser(
    userId: string,
    data: {
        name?: string;
        email?: string;
        role?: string;
        points?: number;
        dailyPoints?: number;
    }
) {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        return { error: "権限がありません" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.email !== undefined && { email: data.email }),
                ...(data.role !== undefined && { role: data.role }),
                ...(data.points !== undefined && { points: data.points }),
                ...(data.dailyPoints !== undefined && { dailyPoints: data.dailyPoints }),
            },
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("updateUser error:", error);
        return { error: "ユーザーの更新に失敗しました" };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        return { error: "権限がありません" };
    }

    // 自分自身は削除不可
    if (session?.user?.id === userId) {
        return { error: "自分自身は削除できません" };
    }

    try {
        // Followsにはcascade未設定のため先に削除
        await prisma.follows.deleteMany({
            where: {
                OR: [{ followerId: userId }, { followingId: userId }],
            },
        });

        await prisma.user.delete({
            where: { id: userId },
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("deleteUser error:", error);
        return { error: "ユーザーの削除に失敗しました" };
    }
}
