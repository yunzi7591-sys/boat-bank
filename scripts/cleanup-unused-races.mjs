#!/usr/bin/env node
/**
 * 既存データの一括クリーンアップ用スクリプト
 *
 * Prediction / UserBet / EventBet のいずれにも紐づいていない過去のレースを
 * RaceSchedule / RaceResult / RaceEntry から削除する。
 *
 * 使い方:
 *   node scripts/cleanup-unused-races.mjs               # dry-run（件数だけ表示）
 *   node scripts/cleanup-unused-races.mjs --execute     # 実削除
 *   node scripts/cleanup-unused-races.mjs --before=YYYY-MM-DD  # 指定日より前のみ対象（既定: 今日）
 *
 * 必要な環境変数: DATABASE_URL
 */
import { PrismaClient } from '@prisma/client';

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const beforeArg = args.find(a => a.startsWith('--before='));
const beforeDate = beforeArg
    ? new Date(beforeArg.split('=')[1] + 'T00:00:00.000Z')
    : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z'); // 今日(UTC) 00:00

async function main() {
    const prisma = new PrismaClient();
    console.log(`[CLEANUP] mode = ${isExecute ? 'EXECUTE' : 'DRY-RUN'}`);
    console.log(`[CLEANUP] target = raceDate < ${beforeDate.toISOString()}`);

    try {
        // 1. 使用中レースキー（Prediction / UserBet / EventBet）を全部集める
        const [preds, userBets, eventBets] = await Promise.all([
            prisma.prediction.findMany({
                where: { raceDate: { lt: beforeDate } },
                select: { placeName: true, raceNumber: true, raceDate: true },
            }),
            prisma.userBet.findMany({
                where: { raceDate: { lt: beforeDate } },
                select: { placeName: true, raceNumber: true, raceDate: true },
            }),
            prisma.eventBet.findMany({
                where: { raceDate: { lt: beforeDate } },
                select: { placeName: true, raceNumber: true, raceDate: true },
            }),
        ]);

        const keyOf = (place, num, date) =>
            `${place ?? ''}::${num ?? ''}::${date ? new Date(date).toISOString() : ''}`;

        const usedKeys = new Set();
        for (const p of preds) usedKeys.add(keyOf(p.placeName, p.raceNumber, p.raceDate));
        for (const b of userBets) {
            if (b.placeName && b.raceNumber != null && b.raceDate) {
                usedKeys.add(keyOf(b.placeName, b.raceNumber, b.raceDate));
            }
        }
        for (const b of eventBets) usedKeys.add(keyOf(b.placeName, b.raceNumber, b.raceDate));

        console.log(`[CLEANUP] used race keys: ${usedKeys.size}`);
        console.log(`  - Prediction rows: ${preds.length}`);
        console.log(`  - UserBet rows:    ${userBets.length}`);
        console.log(`  - EventBet rows:   ${eventBets.length}`);

        // 2. 既存の RaceSchedule / RaceResult / RaceEntry を取得
        const [schedules, results, entries] = await Promise.all([
            prisma.raceSchedule.findMany({
                where: { raceDate: { lt: beforeDate } },
                select: { id: true, placeName: true, raceNumber: true, raceDate: true },
            }),
            prisma.raceResult.findMany({
                where: { raceDate: { lt: beforeDate } },
                select: { id: true, placeName: true, raceNumber: true, raceDate: true },
            }),
            prisma.raceEntry.findMany({
                where: { raceDate: { lt: beforeDate } },
                select: { id: true, placeName: true, raceNumber: true, raceDate: true },
            }),
        ]);

        // R1 は開催形態（モーニング/デイ/ナイター/ミッドナイト）判定の基準になる
        // 一番早いレースなので、使われていなくても RaceSchedule は残す。
        const scheduleTargets = schedules.filter(
            s => !usedKeys.has(keyOf(s.placeName, s.raceNumber, s.raceDate)) && s.raceNumber !== 1
        );
        const resultTargets = results.filter(
            r => !usedKeys.has(keyOf(r.placeName, r.raceNumber, r.raceDate))
        );
        const entryTargets = entries.filter(
            e => !usedKeys.has(keyOf(e.placeName, e.raceNumber, e.raceDate))
        );

        console.log('');
        console.log('[CLEANUP] summary');
        console.log(`  RaceSchedule: ${scheduleTargets.length} / ${schedules.length} will be deleted`);
        console.log(`  RaceResult:   ${resultTargets.length} / ${results.length} will be deleted`);
        console.log(`  RaceEntry:    ${entryTargets.length} / ${entries.length} will be deleted`);

        // 日付ごとの内訳を表示
        const byDate = new Map();
        for (const s of scheduleTargets) {
            const d = new Date(s.raceDate).toISOString().slice(0, 10);
            byDate.set(d, (byDate.get(d) || 0) + 1);
        }
        const sorted = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        if (sorted.length > 0) {
            console.log('');
            console.log('[CLEANUP] schedule deletions by date:');
            for (const [d, n] of sorted) console.log(`  ${d}: ${n}`);
        }

        if (!isExecute) {
            console.log('');
            console.log('[CLEANUP] DRY-RUN finished. Re-run with --execute to actually delete.');
            return;
        }

        // 3. 実削除（チャンクで処理）
        console.log('');
        console.log('[CLEANUP] EXECUTE: deleting...');

        const chunk = (arr, size) => {
            const out = [];
            for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
            return out;
        };

        let deletedEntry = 0;
        for (const c of chunk(entryTargets.map(e => e.id), 500)) {
            const r = await prisma.raceEntry.deleteMany({ where: { id: { in: c } } });
            deletedEntry += r.count;
        }
        console.log(`  RaceEntry deleted: ${deletedEntry}`);

        let deletedResult = 0;
        for (const c of chunk(resultTargets.map(r => r.id), 500)) {
            const r = await prisma.raceResult.deleteMany({ where: { id: { in: c } } });
            deletedResult += r.count;
        }
        console.log(`  RaceResult deleted: ${deletedResult}`);

        let deletedSchedule = 0;
        for (const c of chunk(scheduleTargets.map(s => s.id), 500)) {
            const r = await prisma.raceSchedule.deleteMany({ where: { id: { in: c } } });
            deletedSchedule += r.count;
        }
        console.log(`  RaceSchedule deleted: ${deletedSchedule}`);

        console.log('[CLEANUP] Done.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
