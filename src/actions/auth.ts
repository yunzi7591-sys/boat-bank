"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateVerificationToken, generatePasswordResetToken, getPasswordResetTokenByToken } from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mail";

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "すべての項目を入力してください" };
    }

    if (password.length < 8) {
        return { error: "パスワードは8文字以上で入力してください" };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        // If the user exists but hasn't verified email, resend verification
        if (!existingUser.emailVerified) {
            const verificationToken = await generateVerificationToken(email);
            try {
                await sendVerificationEmail(email, verificationToken.token);
            } catch {
                return { error: "確認メールの送信に失敗しました。しばらくしてから再度お試しください。" };
            }
            return { success: true, needsVerification: true };
        }
        // ユーザー列挙対策: 既存ユーザーにも同じレスポンスを返す
        return { success: true, needsVerification: true };
    }

    // Create user and welcome bonus transaction atomically
    const hashedPassword = await bcrypt.hash(password, 12);

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

    // Generate verification token and send email
    const verificationToken = await generateVerificationToken(email);
    try {
        await sendVerificationEmail(email, verificationToken.token);
    } catch {
        return { error: "確認メールの送信に失敗しました。しばらくしてから再度お試しください。" };
    }

    return { success: true, needsVerification: true };
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

export async function resendVerificationEmail(email: string) {
    if (!email) {
        return { error: "メールアドレスが必要です" };
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Don't reveal whether user exists
        return { success: true };
    }

    if (user.emailVerified) {
        return { error: "このメールアドレスは既に確認済みです" };
    }

    // レート制限: 最後のトークン生成から2分以内は再送不可
    const existingToken = await prisma.verificationToken.findFirst({
        where: { identifier: email },
    });
    if (existingToken) {
        // トークン生成時刻 = expires - 1時間(有効期限)
        const createdAt = new Date(existingToken.expires).getTime() - 60 * 60 * 1000;
        const tokenAge = Date.now() - createdAt;
        if (tokenAge < 2 * 60 * 1000) {
            return { error: "しばらくしてから再度お試しください（2分間隔）" };
        }
    }

    const verificationToken = await generateVerificationToken(email);
    try {
        await sendVerificationEmail(email, verificationToken.token);
    } catch {
        return { error: "確認メールの送信に失敗しました。しばらくしてから再度お試しください。" };
    }

    return { success: true };
}

export async function requestPasswordReset(email: string) {
    if (!email) {
        return { error: "メールアドレスを入力してください" };
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // ユーザー列挙対策: 存在しなくてもsuccessを返す
        return { success: true };
    }

    // レート制限: 最後のトークン生成から2分以内は再送不可
    const existingToken = await prisma.passwordResetToken.findFirst({
        where: { email },
    });
    if (existingToken) {
        const tokenAge = new Date().getTime() - new Date(existingToken.createdAt).getTime();
        if (tokenAge < 2 * 60 * 1000) {
            return { error: "しばらくしてから再度お試しください（2分間隔）" };
        }
    }

    const passwordResetToken = await generatePasswordResetToken(email);
    try {
        await sendPasswordResetEmail(email, passwordResetToken.token);
    } catch {
        return { error: "メールの送信に失敗しました。しばらくしてから再度お試しください。" };
    }

    return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
    if (!token) {
        return { error: "無効なリンクです" };
    }

    if (!newPassword || newPassword.length < 8) {
        return { error: "パスワードは8文字以上で入力してください" };
    }

    const passwordResetToken = await getPasswordResetTokenByToken(token);

    if (!passwordResetToken) {
        return { error: "無効または期限切れのリンクです" };
    }

    const hasExpired = new Date(passwordResetToken.expires) < new Date();
    if (hasExpired) {
        return { error: "リンクの有効期限が切れています。再度リセットをお試しください。" };
    }

    const user = await prisma.user.findUnique({
        where: { email: passwordResetToken.email },
    });

    if (!user) {
        return { error: "ユーザーが見つかりません" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // パスワード更新とトークン削除をアトミックに実行
    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.delete({
            where: { id: passwordResetToken.id },
        }),
        // 既存セッション(Account)を無効化 - JWTベースのため、
        // セッションテーブルがあれば削除する
        prisma.session.deleteMany({
            where: { userId: user.id },
        }),
    ]);

    return { success: true };
}
