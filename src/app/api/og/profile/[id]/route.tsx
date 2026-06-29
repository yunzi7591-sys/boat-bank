import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getPublicUserStats } from '@/lib/stats';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!id) return new Response('Not found', { status: 404 });

    const user = await prisma.user.findUnique({
        where: { id },
        select: { name: true },
    });
    if (!user) return new Response('Not found', { status: 404 });

    const stats = await getPublicUserStats(id);
    const netProfit = stats.totalRefund - stats.totalInvestment;
    const recovery = stats.recoveryRate.toFixed(1);
    const profitStr = `${netProfit >= 0 ? '+' : '−'}${Math.abs(netProfit).toLocaleString()}円`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    background: 'linear-gradient(145deg, #0a0c2e 0%, #1c1e54 35%, #2a1a6b 70%, #533afd 100%)',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                    // 下部はXのタイトル帯が重なるため大きめに空ける
                    padding: '50px 64px 150px 64px',
                }}
            >
                <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: '520px', height: '520px', background: 'radial-gradient(circle, rgba(83,58,253,0.45) 0%, transparent 70%)', display: 'flex' }} />
                <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '4px', background: 'linear-gradient(90deg, #533afd, #ea2261, #f96bee, #533afd)', display: 'flex' }} />

                {/* ロゴ＋名前 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', color: '#b9b9f9', fontSize: '28px', fontWeight: 700 }}>競艇収支・予想</div>
                        <div style={{ display: 'flex', color: '#ffffff', fontSize: '58px', fontWeight: 900, letterSpacing: '1px' }}>
                            {user.name || 'プレイヤー'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', background: 'linear-gradient(135deg, #533afd, #7c5cff)', color: '#fff', fontSize: '26px', fontWeight: 900, padding: '6px 16px', borderRadius: '8px', letterSpacing: '2px' }}>BOAT</div>
                        <div style={{ display: 'flex', color: '#fff', fontSize: '26px', fontWeight: 900, letterSpacing: '2px' }}>BANK</div>
                    </div>
                </div>

                {/* 回収率・収支 */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '64px', marginTop: '40px', zIndex: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', color: '#b9b9f9', fontSize: '26px', fontWeight: 700, marginBottom: '2px' }}>回収率</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', color: '#ffffff', fontSize: '128px', fontWeight: 900, lineHeight: 1, textShadow: '0 0 50px rgba(83,58,253,0.6)' }}>
                            {recovery}<span style={{ display: 'flex', fontSize: '50px', fontWeight: 800, marginBottom: '14px' }}>%</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', color: '#b9b9f9', fontSize: '26px', fontWeight: 700, marginBottom: '2px' }}>収支</div>
                        <div style={{ display: 'flex', color: netProfit >= 0 ? '#7cf6c8' : '#ff8fab', fontSize: '56px', fontWeight: 900, lineHeight: 1 }}>
                            {profitStr}
                        </div>
                    </div>
                </div>

                {/* 投資額・回収額・的中（タイトル帯に被らないよう中段に配置） */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '52px', marginTop: '36px', zIndex: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', color: '#8b93c9', fontSize: '23px', fontWeight: 700 }}>投資額</div>
                        <div style={{ display: 'flex', color: '#ffffff', fontSize: '38px', fontWeight: 800 }}>{stats.totalInvestment.toLocaleString()}円</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', color: '#8b93c9', fontSize: '23px', fontWeight: 700 }}>回収額</div>
                        <div style={{ display: 'flex', color: '#ffffff', fontSize: '38px', fontWeight: 800 }}>{stats.totalRefund.toLocaleString()}円</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', color: '#8b93c9', fontSize: '23px', fontWeight: 700 }}>的中</div>
                        <div style={{ display: 'flex', color: '#ffffff', fontSize: '38px', fontWeight: 800 }}>{stats.hitCount} / {stats.totalPredictions}R</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', color: '#b9b9f9', fontSize: '24px', fontWeight: 700, letterSpacing: '1px' }}>boatbank.jp</div>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            headers: {
                'Cache-Control': 'public, max-age=600, s-maxage=600',
            },
        },
    );
}
