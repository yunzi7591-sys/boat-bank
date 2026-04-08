import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { syncAndSaveSingleResult } from '@/lib/boatrace-api';
import { settleRacePredictions } from '@/lib/evaluate';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
    try {
        // QStash 署名検証（本番のみ）
        if (process.env.NODE_ENV === 'production' && process.env.QSTASH_CURRENT_SIGNING_KEY) {
            const receiver = new Receiver({
                currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
                nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
            });

            const body = await request.text();
            const signature = request.headers.get('upstash-signature') || '';

            const isValid = await receiver.verify({
                signature,
                body,
                url: request.url,
            });

            if (!isValid) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }

            // body を再パース
            const data = JSON.parse(body);
            return await processRace(data);
        }

        // 開発環境: Bearer トークンまたは直接アクセス
        const authHeader = request.headers.get('authorization');
        if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
