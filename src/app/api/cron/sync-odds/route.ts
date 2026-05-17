import { NextResponse } from 'next/server';
import { syncOdds } from '@/lib/boatrace-api';
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
    try {
        const _auth = verifyCronAuth(request);
        if (!_auth.ok) return _auth.response;

        const oddsResult = await syncOdds();
        return NextResponse.json(oddsResult);
    } catch (e: any) {
        console.error('[ODDS CRON ERROR]', e);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
