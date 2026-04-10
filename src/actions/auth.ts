"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "すべての項目を入力してください" };
    }

    if (password.length < 6) {
        return { error: "パスワードは6文字以上で入力してください" };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "このメールアドレスは既に登録されています" };
    }

    // Create user and welcome bonus transaction atomically
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                points: 5000, // 5,000pt Welcome Bonus!
            },
        });

        await tx.transaction.create({
            data: {
                userId: user.id,
                points: 5000,
                action: "WELCOME_BONUS",
            }
        });
    });

    return { success: true };
}

export async function getUserPoints(): Promise<number> {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (!session?.user?.id) return 0;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { points: true },
    });

    return user?.points ?? 0;
}
