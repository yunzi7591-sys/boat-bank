import { NextResponse } from "next/server";
import { syncTodaySchedule } from "@/lib/boatrace-api";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get("secret");
        const authHeader = req.headers.get("authorization");

        const validSecret = process.env.CRON_SECRET || process.env.AUTH_SECRET;

        if (validSecret) {
            const isParamValid = secret === validSecret;
            const isHeaderValid = authHeader === `Bearer ${validSecret}`;

            if (!isParamValid && !isHeaderValid) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

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
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
