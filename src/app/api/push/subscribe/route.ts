import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { endpoint, keys } = await request.json();
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
            create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("[Push Subscribe Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
