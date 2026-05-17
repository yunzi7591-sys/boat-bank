import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new Response('id required', { status: 400 });

    const prediction = await prisma.prediction.findUnique({
        where: { id },
        select: { createdAt: true },
    });
    if (!prediction) return new Response('not found', { status: 404 });

    const imgUrl = `https://boatbank.jp/api/og/prediction/${id}/${prediction.createdAt.getTime()}`;
    try {
        await fetch(imgUrl, { cache: 'no-store' });
    } catch {}

    return new Response('ok');
}
