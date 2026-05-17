import { NextResponse } from 'next/server';
import { syncAbsentBoats } from '@/lib/boatrace-api';
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
    try {
        const _auth = verifyCronAuth(request);
        if (!_auth.ok) return _auth.response;

        const result = await syncAbsentBoats();
        return NextResponse.json(result);
    } catch (e: any) {
        console.error('[ABSENT CRON ERROR]', e);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
