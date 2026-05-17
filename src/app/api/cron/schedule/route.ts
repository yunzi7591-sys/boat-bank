import { NextResponse } from 'next/server';
import { syncTodaySchedule } from '@/lib/boatrace-api';
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
    try {
        const _auth = verifyCronAuth(request);
        if (!_auth.ok) return _auth.response;

        console.log("[CRON] Starting today's schedule sync...");
        const result = await syncTodaySchedule();

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.error });
        }

        if ((result as any).skipped) {
            return NextResponse.json({ success: true, status: 'AlreadySynced', count: result.count });
        }

        return NextResponse.json({
            success: true,
            count: result.count,
            entries: (result as any).entries || 0
        });
    } catch (e: any) {
        console.error('[CRON SCHEDULE SYNC ERROR]', e);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
