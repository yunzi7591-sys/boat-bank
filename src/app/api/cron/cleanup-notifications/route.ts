import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 毎日0時(JST)に全通知を削除
 */
export async function GET(request: Request) {
    try {
        const _auth = verifyCronAuth(request);
        if (!_auth.ok) return _auth.response;

        const result = await prisma.notification.deleteMany({});

        console.log(`[CRON] Notifications cleanup: ${result.count} deleted`);
        return NextResponse.json({ success: true, deleted: result.count });
    } catch (e: any) {
        console.error('[CRON] Notifications cleanup error:', e);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
