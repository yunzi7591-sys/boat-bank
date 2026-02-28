"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { name: string; bio: string }) {
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
            },
        });

        revalidatePath("/mypage");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update profile." };
    }
}
