import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return new Response('Not found', { status: 404 });

    const prediction = await prisma.prediction.findUnique({
        where: { id },
        select: {
            title: true,
            placeName: true,
            raceNumber: true,
            deadlineAt: true,
            isSettled: true,
            isHit: true,
            author: { select: { name: true } },
        },
    });

    if (!prediction) return new Response('Not found', { status: 404 });

    const title = prediction.title || '渾身の勝負レース';
    const deadlineStr = new Date(prediction.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' });

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#1c1e54',
                    padding: '60px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Top: Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', backgroundColor: '#533afd', color: '#ffffff', fontSize: '28px', fontWeight: 900, padding: '6px 14px', borderRadius: '8px', letterSpacing: '2px' }}>
                        BOAT
                    </div>
                    <div style={{ display: 'flex', color: '#ffffff', fontSize: '28px', fontWeight: 900, letterSpacing: '2px' }}>
                        BANK
                    </div>
                </div>

                {/* Center: Race info + Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                        <div style={{ display: 'flex', color: '#ffffff', fontSize: '72px', fontWeight: 900, letterSpacing: '4px' }}>
                            {prediction.placeName} {prediction.raceNumber}R
                        </div>
                        <div style={{ display: 'flex', color: '#94a3b8', fontSize: '32px', fontWeight: 600 }}>
                            {deadlineStr} 締切
                        </div>
                    </div>
                    <div style={{ display: 'flex', color: '#e2e8f0', fontSize: '36px', fontWeight: 700 }}>
                        {title}
                    </div>
                </div>

                {/* Bottom: Author + domain */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', color: '#b9b9f9', fontSize: '24px', fontWeight: 700 }}>
                        {prediction.author?.name || 'Anonymous'}
                    </div>
                    <div style={{ display: 'flex', color: '#64748b', fontSize: '22px', fontWeight: 600 }}>
                        boatbank.jp
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    );
}
