import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evaluatePrediction } from '@/lib/evaluate';

// This API route evaluates all pending predictions that are past their deadline.
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET || 'dev-cron-secret';

    if (authHeader !== `Bearer ${secret}` && process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("[Cron] Starting background evaluation batch...");

        // 1. Find all predictions that are past deadline but not checked
        const pendingPredictions = await prisma.prediction.findMany({
            where: {
                resultChecked: false,
                deadlineAt: {
                    lt: new Date()
                }
            },
            select: {
                id: true,
                placeName: true,
                raceNumber: true,
                raceDate: true
            }
        });

        const checkedIds = [];
        let hitCount = 0;

        // 2. Try to evaluate them.
        for (const pred of pendingPredictions) {
            // evaluatePrediction attempts to find matching RaceResult and sums refund
            // If RaceResult isn't there, it won't check it. So it's safe to run on missing results.
            const stats = await evaluatePrediction(pred.id);
            if (stats) {
                checkedIds.push(pred.id);
                if (stats.isHit) hitCount++;
            }
        }

        console.log(`[Cron] Batch evaluated ${checkedIds.length} out of ${pendingPredictions.length} pending past-deadline predictions. ${hitCount} were hits.`);

        return NextResponse.json({
            success: true,
            message: `Batch completed`,
            stats: {
                pendingConsidered: pendingPredictions.length,
                actuallyEvaluated: checkedIds.length,
                hits: hitCount
            }
        });
    } catch (error: any) {
        console.error("[Cron Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
