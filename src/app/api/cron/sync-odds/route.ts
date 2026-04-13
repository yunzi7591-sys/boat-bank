import { NextResponse } from 'next/server';
import { syncOdds } from '@/lib/boatrace-api';

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

        const result = await syncOdds();
        return NextResponse.json(result);
    } catch (e: any) {
        console.error('[ODDS CRON ERROR]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
