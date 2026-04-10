import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 毎日のポイントリセット: dailyPointsを500にリセット
 * 前日の未使用dailyPointsは持ち越さない
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== expectedAuth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 全ユーザーのdailyPointsを500にリセット
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
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
