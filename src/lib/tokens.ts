import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function generateVerificationToken(email: string) {
  // UUIDv4(122bit)よりも高エントロピーな256bit暗号論的乱数トークン
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(new Date().getTime() + 60 * 60 * 1000); // 1時間

  // 既存のトークンを削除
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return verificationToken;
}

export async function generatePasswordResetToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(new Date().getTime() + 60 * 60 * 1000); // 1時間

  // 既存のトークンを削除
  await prisma.passwordResetToken.deleteMany({
    where: { email },
  });

  const passwordResetToken = await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return passwordResetToken;
}

export async function getPasswordResetTokenByToken(token: string) {
  try {
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    return passwordResetToken;
  } catch {
    return null;
  }
}

export async function getVerificationTokenByToken(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });
    return verificationToken;
  } catch {
    return null;
  }
}
