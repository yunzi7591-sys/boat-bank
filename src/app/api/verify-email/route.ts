import { prisma } from "@/lib/prisma";
import { getVerificationTokenByToken } from "@/lib/tokens";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "トークンが指定されていません" },
      { status: 400 }
    );
  }

  const verificationToken = await getVerificationTokenByToken(token);

  if (!verificationToken) {
    return NextResponse.json(
      { error: "無効なトークンです。再度登録してください。" },
      { status: 400 }
    );
  }

  // Check expiration
  if (new Date() > verificationToken.expires) {
    // Clean up expired token
    await prisma.verificationToken.delete({
      where: { token },
    });
    return NextResponse.json(
      { error: "トークンの有効期限が切れています。再度登録してください。" },
      { status: 400 }
    );
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
  });

  if (!user) {
    return NextResponse.json(
      { error: "ユーザーが見つかりません" },
      { status: 400 }
    );
  }

  // Update user's emailVerified and delete the token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { token },
    }),
  ]);

  return NextResponse.json({ success: true });
}
