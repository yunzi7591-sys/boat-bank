import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 毎日 JST 03:00 (UTC 18:00) に前日のレースを掃除する。
 * Prediction / UserBet / EventBet のいずれにも紐づいていないレースだけ、
 * RaceSchedule / RaceResult / RaceEntry を削除する。
 */
export async function GET(request: Request) {
    try {
        const auth = verifyCronAuth(request);
        if (!auth.ok) return auth.response;

        // 「前日」(JST基準) の raceDate は UTC 00:00:00 で保存されている前提
        // 実行時刻が UTC 18:00 (= JST 翌日 03:00) のとき、UTCの当日 0:00 が「前日(JST)」
        const now = new Date();
        const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const [preds, userBets, eventBets, schedules] = await Promise.all([
            prisma.prediction.findMany({
                where: { raceDate: { gte: dayStart, lt: dayEnd } },
                select: { placeName: true, raceNumber: true },
            }),
            prisma.userBet.findMany({
                where: { raceDate: { gte: dayStart, lt: dayEnd } },
                select: { placeName: true, raceNumber: true },
            }),
            prisma.eventBet.findMany({
                where: { raceDate: { gte: dayStart, lt: dayEnd } },
                select: { placeName: true, raceNumber: true },
            }),
            prisma.raceSchedule.findMany({
                where: { raceDate: { gte: dayStart, lt: dayEnd } },
                select: { placeName: true, raceNumber: true },
            }),
        ]);

        const keyOf = (place: string | null | undefined, num: number | null | undefined) =>
            `${place ?? ''}::${num ?? ''}`;

        const usedKeys = new Set<string>();
        for (const p of preds) usedKeys.add(keyOf(p.placeName, p.raceNumber));
        for (const b of userBets) {
            if (b.placeName && b.raceNumber != null) usedKeys.add(keyOf(b.placeName, b.raceNumber));
        }
        for (const b of eventBets) usedKeys.add(keyOf(b.placeName, b.raceNumber));

        // 未使用レースを削除対象にする。ただし R1 は開催形態（モーニング/デイ/ナイター/
        // ミッドナイト）判定の基準になる一番早いレースなので、使われていなくても残す。
        // R1 を消すと残った遅いレースで代表時刻がずれ、ナイターがミッドナイトに誤分類される。
        const targets = schedules.filter(
            s => !usedKeys.has(keyOf(s.placeName, s.raceNumber)) && s.raceNumber !== 1
        );

        let deletedSchedule = 0;
        let deletedResult = 0;
        let deletedEntry = 0;

        if (targets.length > 0) {
            // 1件ずつではなく OR 条件でまとめて削除（削除対象の条件は同一）
            const where = {
                raceDate: { gte: dayStart, lt: dayEnd },
                OR: targets.map((t) => ({
                    placeName: t.placeName,
                    raceNumber: t.raceNumber,
                })),
            };
            const [entryRes, resultRes, scheduleRes] = await prisma.$transaction([
                prisma.raceEntry.deleteMany({ where }),
                prisma.raceResult.deleteMany({ where }),
                prisma.raceSchedule.deleteMany({ where }),
            ]);
            deletedEntry = entryRes.count;
            deletedResult = resultRes.count;
            deletedSchedule = scheduleRes.count;
        }

        console.log(
            `[CRON] cleanup-unused-races: target=${targets.length}/${schedules.length} ` +
            `schedule=${deletedSchedule} result=${deletedResult} entry=${deletedEntry}`
        );

        return NextResponse.json({
            success: true,
            date: dayStart.toISOString(),
            totalSchedules: schedules.length,
            unusedRaces: targets.length,
            deleted: {
                schedule: deletedSchedule,
                result: deletedResult,
                entry: deletedEntry,
            },
        });
    } catch (e: any) {
        console.error('[CRON] cleanup-unused-races error:', e);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
