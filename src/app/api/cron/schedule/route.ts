import { NextResponse } from 'next/server';
import { syncTodaySchedule } from '@/lib/boatrace-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== expectedAuth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

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
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
