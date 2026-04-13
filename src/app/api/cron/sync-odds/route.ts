import { NextResponse } from 'next/server';
import { syncOdds, syncAbsentBoats } from '@/lib/boatrace-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== expectedAuth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const [oddsResult, absentResult] = await Promise.all([
            syncOdds(),
            syncAbsentBoats(),
        ]);
        return NextResponse.json({ odds: oddsResult, absent: absentResult });
    } catch (e: any) {
        console.error('[ODDS CRON ERROR]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
