import { NextResponse } from 'next/server';
import { syncTodayResults } from '@/lib/boatrace-api';
import { settleRacePredictions, settleAllPending } from '@/lib/evaluate';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Phase 53: This route now scrapes results from boatrace.jp, then evaluates pending predictions.
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.NODE_ENV === 'production') {
        if (authHeader !== expectedAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log("[Cron] Starting scraping-based result sync + evaluation batch...");

        // 1. Scrape results from boatrace.jp official site
        const syncRes = await syncTodayResults();
        const processedRaces = syncRes.processedRaces || [];

        // 2. Settle predictions for newly synced races
        let settlementCount = 0;
        for (const race of processedRaces) {
            try {
                const stats = await settleRacePredictions(race.placeName, race.raceNumber, race.raceDate);
                if (stats.success) {
                    settlementCount += stats.settledCount;
                }
            } catch (e) {
                // If settlement fails for one race, continue with others
            }
        }

        // 3. 結果取得済みだが未精算の分も全て精算
        const pendingStats = await settleAllPending();
        settlementCount += pendingStats.settledCount;

        console.log(`[Cron] Batch: scraped ${processedRaces.length} races, settled ${settlementCount} total.`);

        return NextResponse.json({
            success: true,
            message: `Batch completed`,
            stats: {
                racesScraped: processedRaces.length,
                predictionsSettled: settlementCount,
                pendingSettled: pendingStats.settledCount,
                pendingRacesChecked: pendingStats.racesChecked,
            }
        });
    } catch (error: any) {
        console.error("[Cron Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

