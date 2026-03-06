import { NextResponse } from 'next/server';
import { syncOfficialGradeAndDay } from '@/lib/boatrace-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes

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

        console.log("[CRON] Starting schedule grade/day supplementation...");

        const result = await syncOfficialGradeAndDay();

        if (!result.success) {
            console.warn("[CRON] Schedule supplementation failed:", result.error);
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        console.log(`[CRON] Successfully supplemented schedule for ${result.count || 0} venues.`);
        return NextResponse.json({
            success: true,
            status: 'Success',
            count: result.count
        });
    } catch (e: any) {
        console.error('[CRON SCHEDULE SUPPLEMENT ERROR]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
