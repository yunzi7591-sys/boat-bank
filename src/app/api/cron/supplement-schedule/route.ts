import { NextResponse } from 'next/server';
import { syncOfficialGradeAndDay } from '@/lib/boatrace-api';
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes

export async function GET(request: Request) {
    try {
        // Validate Cron Secret
        const _auth = verifyCronAuth(request);
        if (!_auth.ok) return _auth.response;

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
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
