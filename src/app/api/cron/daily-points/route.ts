import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 毎日のポイントリセット: dailyPointsを300にリセット
 * 前日の未使用dailyPointsは持ち越さない
 */
export async function GET(request: Request) {
    try {
        const _auth = verifyCronAuth(request);
        if (!_auth.ok) return _auth.response;

        // 全ユーザーのdailyPointsを300にリセット
        const result = await prisma.user.updateMany({
            data: {
                dailyPoints: 300,
                lastDailyReset: new Date(),
            },
        });

        console.log(`[CRON] Daily points reset: ${result.count} users`);
        return NextResponse.json({ success: true, usersReset: result.count });
    } catch (e: any) {
        console.error('[CRON] Daily points reset error:', e);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
