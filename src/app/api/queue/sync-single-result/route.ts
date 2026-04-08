import { NextResponse } from 'next/server';
import { syncAndSaveSingleResult } from '@/lib/boatrace-api';
import { settleRacePredictions } from '@/lib/evaluate';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
    try {
        // 認証: x-cron-secret ヘッダー（QStash経由）または Authorization ヘッダー（手動）
        if (process.env.NODE_ENV === 'production') {
            const cronSecret = request.headers.get('x-cron-secret');
            const authHeader = request.headers.get('authorization');
            const expected = process.env.CRON_SECRET;

            if (cronSecret !== expected && authHeader !== `Bearer ${expected}`) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const data = await request.json();
        return await processRace(data);
    } catch (e: any) {
        console.error('[QUEUE WORKER ERROR]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// GET もサポート（手動テスト / レガシー互換）
export async function GET(request: Request) {
    const url = new URL(request.url);
    const placeName = url.searchParams.get('placeName');
    const raceNumber = url.searchParams.get('raceNumber');
    const raceDate = url.searchParams.get('raceDate');

    if (!placeName || !raceNumber || !raceDate) {
        return NextResponse.json({ error: 'Missing params: placeName, raceNumber, raceDate' }, { status: 400 });
    }

    // 開発環境のみ許可
    if (process.env.NODE_ENV === 'production') {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    return await processRace({
        placeName,
        raceNumber: parseInt(raceNumber, 10),
        raceDate,
    });
}

async function processRace(data: { placeName: string; raceNumber: number; raceDate: string }) {
    const { placeName, raceNumber, raceDate: raceDateStr } = data;
    const raceDate = new Date(raceDateStr);

    console.log(`[QUEUE] Processing ${placeName} R${raceNumber}...`);

    // 1. 結果取得 + 保存（スクレイピング優先 + APIフォールバック）
    await syncAndSaveSingleResult(placeName, raceNumber, raceDate);

    // 2. 精算処理
    try {
        const stats = await settleRacePredictions(placeName, raceNumber, raceDate);
        console.log(`[QUEUE] ${placeName} R${raceNumber}: 精算完了 (${stats.settledCount}件)`);
    } catch (evalErr: any) {
        console.warn(`[QUEUE] ${placeName} R${raceNumber}: 精算スキップ (${evalErr.message})`);
    }

    return NextResponse.json({
        success: true,
        race: `${placeName} R${raceNumber}`,
    });
}
