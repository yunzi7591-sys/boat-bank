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
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(145deg, #0a0c2e 0%, #1c1e54 30%, #2a1a6b 60%, #533afd 100%)',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* 背景の装飾: 光の線 */}
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(83,58,253,0.4) 0%, transparent 70%)', display: 'flex' }} />
                <div style={{ position: 'absolute', bottom: '-150px', right: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(234,34,97,0.3) 0%, transparent 70%)', display: 'flex' }} />
                <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '4px', background: 'linear-gradient(90deg, #533afd, #ea2261, #f96bee, #533afd)', display: 'flex' }} />
                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: 'linear-gradient(90deg, #f96bee, #533afd, #ea2261, #f96bee)', display: 'flex' }} />

                {/* ロゴ 上部 */}
                <div style={{ position: 'absolute', top: '40px', left: '50px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', background: 'linear-gradient(135deg, #533afd, #7c5cff)', color: '#fff', fontSize: '36px', fontWeight: 900, padding: '8px 20px', borderRadius: '10px', letterSpacing: '3px' }}>
                        BOAT
                    </div>
                    <div style={{ display: 'flex', color: '#fff', fontSize: '36px', fontWeight: 900, letterSpacing: '3px' }}>
                        BANK
                    </div>
                </div>

                {/* メイン: レース情報 ど真ん中 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                    {/* 締切時刻 */}
                    <div style={{ display: 'flex', background: 'linear-gradient(90deg, #ea2261, #f96bee)', color: '#fff', fontSize: '28px', fontWeight: 900, padding: '6px 28px', borderRadius: '30px', letterSpacing: '2px' }}>
                        {deadlineStr} 締切
                    </div>

                    {/* 場名+R番号 ドでかく */}
                    <div style={{ display: 'flex', color: '#ffffff', fontSize: '120px', fontWeight: 900, letterSpacing: '8px', textShadow: '0 0 40px rgba(83,58,253,0.6), 0 0 80px rgba(83,58,253,0.3)' }}>
                        {prediction.placeName} {prediction.raceNumber}R
                    </div>

                    {/* タイトル */}
                    <div style={{ display: 'flex', color: '#ffffff', fontSize: '44px', fontWeight: 800, textAlign: 'center', maxWidth: '1000px', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                        {title}
                    </div>
                </div>

                {/* 下部: 投稿者 + ドメイン */}
                <div style={{ position: 'absolute', bottom: '40px', left: '50px', right: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #533afd, #7c5cff)', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: 900 }}>
                            {(prediction.author?.name || 'A').charAt(0)}
                        </div>
                        <div style={{ display: 'flex', color: '#ffffff', fontSize: '32px', fontWeight: 800 }}>
                            {prediction.author?.name || 'Anonymous'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', color: '#b9b9f9', fontSize: '26px', fontWeight: 700, letterSpacing: '1px' }}>
                        boatbank.jp
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    );
}
