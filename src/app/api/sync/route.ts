import { NextResponse } from "next/server";
import { syncTodaySchedule, syncOfficialGradeAndDay } from "@/lib/boatrace-api";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Simple authentication check using URL search params or Authorization header
        // For cron jobs, Vercel allows passing a secure secret via a query parameter or header
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get("secret");
        const authHeader = req.headers.get("authorization");

        // Allow if secret matches CRON_SECRET or AUTH_SECRET
        const validSecret = process.env.CRON_SECRET || process.env.AUTH_SECRET;

        // If a secret is configured but not provided, reject the request
        if (validSecret) {
            const isParamValid = secret === validSecret;
            const isHeaderValid = authHeader === `Bearer ${validSecret}`;

            if (!isParamValid && !isHeaderValid) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        console.log("[CRON] Starting daily sync job...");

        // 1. First, sync the schedule from the JSON API (Programs)
        const scheduleResult = await syncTodaySchedule();

        // 2. Second, scrape the official website for accurate Grade and Day data
        const scrapeResult = await syncOfficialGradeAndDay();

        return NextResponse.json({
            success: true,
            schedule: scheduleResult,
            scrape: scrapeResult,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("[CRON] Sync failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
