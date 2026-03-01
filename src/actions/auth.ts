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

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            points: 1000, // Give 1000 points on registration for MVP
        },
    });

    return { success: true };
}
