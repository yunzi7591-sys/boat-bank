import { NextResponse } from 'next/server';
import { syncTodayScheduleChunk } from '@/lib/boatrace-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== expectedAuth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const url = new URL(request.url);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);

        console.log(`[CRON] Schedule sync chunk: offset=${offset}, limit=${limit}`);

        const result = await syncTodayScheduleChunk(offset, limit);

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('[CRON SCHEDULE SYNC ERROR]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
