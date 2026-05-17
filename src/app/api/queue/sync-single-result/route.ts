import { NextResponse } from 'next/server';
import { syncAndSaveSingleResult } from '@/lib/boatrace-api';
import { settleRacePredictions } from '@/lib/evaluate';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
    try {
        // 認証: x-cron-secret ヘッダー（QStash経由）または Authorization ヘッダー（手動）
        const secret = process.env.CRON_SECRET;
        if (!secret) {
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
            }
        } else {
            const cronSecret = request.headers.get('x-cron-secret');
            const authHeader = request.headers.get('authorization');
            if (cronSecret !== secret && authHeader !== `Bearer ${secret}`) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const data = await request.json();
        return await processRace(data);
    } catch (e: any) {
        console.error('[QUEUE WORKER ERROR]', e?.message, e?.stack);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
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

    const _auth = verifyCronAuth(request);
    if (!_auth.ok) return _auth.response;

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
    try {
        await syncAndSaveSingleResult(placeName, raceNumber, raceDate);
    } catch (syncErr: any) {
        // 結果未発表のレースは想定内 → 200 で返し QStash のリトライ暴発を防ぐ
        const msg = syncErr?.message || '';
        const isNotReady = /着順データ不足|払戻・返還データなし|両方失敗/.test(msg);
        if (isNotReady) {
            console.log(`[QUEUE] ${placeName} R${raceNumber}: 結果未発表のためスキップ (${msg})`);
            return NextResponse.json({
                success: true,
                race: `${placeName} R${raceNumber}`,
                notReady: true,
            });
        }
        throw syncErr;
    }

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
