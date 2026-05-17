import { prisma } from "@/lib/prisma";
import { getVerificationTokenByToken } from "@/lib/tokens";
import { NextRequest, NextResponse } from "next/server";

// POST: メール認証は状態変更を伴うためPOSTを使用（CSRF対策）
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストが不正です" },
      { status: 400 }
    );
  }

  const token = body.token;

  if (!token || typeof token !== "string") {
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

  // 原子的なメール認証＋ボーナス付与（並列リクエストでの二重取得を防止）
  await prisma.$transaction(async (tx) => {
    // emailVerified が null のレコードのみを更新（DBレベルで一度だけ成功）
    const updated = await tx.user.updateMany({
      where: { id: user.id, emailVerified: null },
      data: { emailVerified: new Date(), points: { increment: 5000 } },
    });

    // この transaction が初回認証だった場合のみ Transaction を作成
    if (updated.count === 1) {
      // 念のため二重防止: WELCOME_BONUS が既にあれば作成しない
      const existingBonus = await tx.transaction.findFirst({
        where: { userId: user.id, action: "WELCOME_BONUS" },
        select: { id: true },
      });
      if (!existingBonus) {
        await tx.transaction.create({
          data: {
            userId: user.id,
            points: 5000,
            action: "WELCOME_BONUS",
          },
        });
      }
    }

    await tx.verificationToken.delete({
      where: { token },
    });
  });

  return NextResponse.json({ success: true });
}
