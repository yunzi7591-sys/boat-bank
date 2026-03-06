import { NextResponse } from 'next/server';
import { syncTodaySchedule } from '@/lib/boatrace-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds

export async function GET(request: Request) {
    try {
        // Validate Cron Secret
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== expectedAuth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        console.log("[CRON] Starting today's schedule + entry sync...");

        const result = await syncTodaySchedule();

        if (!result.success) {
            console.warn("[CRON] Schedule sync skipped or failed:", result.error);
            return NextResponse.json({ success: false, status: 'Skipped', message: result.error });
        }

        // Check if it was an early-skip (already synced today)
        if ((result as any).skipped) {
            console.log(`[CRON] Schedule already synced today (${result.count} races). No-op.`);
            return NextResponse.json({
                success: true,
                status: 'AlreadySynced',
                count: result.count
            });
        }

        console.log(`[CRON] Successfully synced ${result.count} schedules and ${(result as any).entries || 0} entries.`);
        return NextResponse.json({
            success: true,
            status: 'Success',
            count: result.count,
            syncedSchedules: result.count,
            syncedEntries: (result as any).entries || 0
        });
    } catch (e: any) {
        console.error('[CRON SCHEDULE SYNC ERROR]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
