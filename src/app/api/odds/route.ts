import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const placeName = searchParams.get('placeName');
    const raceNumber = searchParams.get('raceNumber');
    const raceDate = searchParams.get('raceDate');

    if (!placeName || !raceNumber || !raceDate) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const odds = await prisma.raceOdds.findMany({
        where: {
            placeName,
            raceNumber: parseInt(raceNumber),
            raceDate: new Date(raceDate),
        },
        select: {
            oddsType: true,
            oddsData: true,
            fetchedAt: true,
        },
    });

    const result: Record<string, { data: any; fetchedAt: string }> = {};
    for (const o of odds) {
        result[o.oddsType] = {
            data: o.oddsData,
            fetchedAt: o.fetchedAt.toISOString(),
        };
    }

    return NextResponse.json(result);
}
