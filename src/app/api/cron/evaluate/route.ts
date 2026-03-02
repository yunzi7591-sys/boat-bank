import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { settleRacePredictions } from '@/lib/evaluate';

// This API route evaluates all pending predictions that are past their deadline.
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET || 'dev-cron-secret';

    if (authHeader !== `Bearer ${secret}` && process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("[Cron] Starting background evaluation batch...");

        // 1. Find all distinct races that have unsettled predictions past deadline
        const pendingPredictions = await prisma.prediction.findMany({
            where: {
                isSettled: false,
                deadlineAt: {
                    lt: new Date()
                }
            },
            select: {
                placeName: true,
                raceNumber: true,
                raceDate: true
            },
            distinct: ['placeName', 'raceNumber', 'raceDate'],
        });

        let totalSettled = 0;

        // 2. Try to settle each pending race.
        for (const race of pendingPredictions) {
            // settleRacePredictions attempts to find matching RaceResult and sum refunds/hits
            // If RaceResult isn't there, it handles gracefully.
            try {
                const stats = await settleRacePredictions(race.placeName, race.raceNumber, race.raceDate);
                if (stats.success) {
                    totalSettled += stats.settledCount;
                }
            } catch (e) {
                // If race result is not found, we just skip it for now and it will be evaluated later
            }
        }

        console.log(`[Cron] Batch evaluated ${pendingPredictions.length} pending races. Settled ${totalSettled} predictions.`);

        return NextResponse.json({
            success: true,
            message: `Batch completed`,
            stats: {
                racesConsidered: pendingPredictions.length,
                predictionsSettled: totalSettled
            }
        });
    } catch (error: any) {
        console.error("[Cron Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
