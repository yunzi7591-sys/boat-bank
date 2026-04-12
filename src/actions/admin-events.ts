"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createEvent(data: {
    name: string;
    placeName: string;
    startDate: string;
    endDate: string;
    initialPt: number;
}) {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        return { error: "権限がありません" };
    }

    try {
        // 1. イベントを作成
        const event = await prisma.event.create({
            data: {
                name: data.name,
                placeName: data.placeName,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                initialPt: data.initialPt,
            },
        });

        // 2. 全ユーザーを取得
        const users = await prisma.user.findMany({ select: { id: true } });

        // 3. 各ユーザーにEventParticipantを作成
        await prisma.eventParticipant.createMany({
            data: users.map((user) => ({
                eventId: event.id,
                userId: user.id,
                points: data.initialPt,
            })),
        });

        revalidatePath("/admin");
        revalidatePath("/events");
        return { success: true, event };
    } catch (error) {
        console.error("createEvent error:", error);
        return { error: "イベントの作成に失敗しました" };
    }
}

export async function getActiveEvents() {
    const events = await prisma.event.findMany({
        where: { isActive: true },
        include: {
            _count: { select: { participants: true } },
        },
        orderBy: { createdAt: "desc" },
    });
    return events;
}

export async function getAllEvents() {
    const events = await prisma.event.findMany({
        include: {
            _count: { select: { participants: true } },
        },
        orderBy: { createdAt: "desc" },
    });
    return events;
}

export async function endEvent(eventId: string) {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        return { error: "権限がありません" };
    }

    try {
        await prisma.event.update({
            where: { id: eventId },
            data: { isActive: false },
        });

        revalidatePath("/admin");
        revalidatePath("/events");
        return { success: true };
    } catch (error) {
        console.error("endEvent error:", error);
        return { error: "イベントの終了に失敗しました" };
    }
}
