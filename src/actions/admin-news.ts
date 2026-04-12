"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createNews(data: { title: string; content: string }) {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        return { error: "権限がありません" };
    }

    try {
        const news = await prisma.news.create({
            data: {
                title: data.title,
                content: data.content,
            },
        });

        revalidatePath("/admin");
        revalidatePath("/news");
        revalidatePath("/");
        return { success: true, news };
    } catch (error) {
        console.error("createNews error:", error);
        return { error: "ニュースの作成に失敗しました" };
    }
}

export async function getNewsList() {
    const news = await prisma.news.findMany({
        orderBy: { createdAt: "desc" },
    });
    return news;
}

export async function deleteNews(id: string) {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        return { error: "権限がありません" };
    }

    try {
        await prisma.news.delete({
            where: { id },
        });

        revalidatePath("/admin");
        revalidatePath("/news");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("deleteNews error:", error);
        return { error: "ニュースの削除に失敗しました" };
    }
}
