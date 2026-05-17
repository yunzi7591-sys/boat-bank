import { NextResponse } from "next/server";
import { syncTodaySchedule } from "@/lib/boatrace-api";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const _auth = verifyCronAuth(req);
        if (!_auth.ok) return _auth.response;

        console.log("[SYNC] Starting schedule sync (v3 API - grade/day included)...");

        // v3 API で grade_label / day_label も含めて取得されるため、supplement-schedule は不要
        const scheduleResult = await syncTodaySchedule();

        return NextResponse.json({
            success: true,
            schedule: scheduleResult,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("[SYNC] Failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
