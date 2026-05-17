import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const platform: string = body.platform === "ios" || body.platform === "android" ? body.platform : "web";

        let endpoint: string;
        let p256dh: string | null = null;
        let auth_: string | null = null;

        if (platform === "ios" || platform === "android") {
            const token: string | undefined = body.token;
            if (!token) {
                return NextResponse.json({ error: "Invalid token" }, { status: 400 });
            }
            endpoint = `${platform}:${token}`;
        } else {
            const { endpoint: ep, keys } = body;
            if (!ep || !keys?.p256dh || !keys?.auth) {
                return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
            }
            endpoint = ep;
            p256dh = keys.p256dh;
            auth_ = keys.auth;
        }

        const updated = await prisma.pushSubscription.updateMany({
            where: { endpoint, userId },
            data: { platform, p256dh, auth: auth_ },
        });
        if (updated.count > 0) {
            return NextResponse.json({ success: true });
        }

        try {
            await prisma.pushSubscription.create({
                data: { userId, platform, endpoint, p256dh, auth: auth_ },
            });
            return NextResponse.json({ success: true });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            throw e;
        }
    } catch (e) {
        console.error("[Push Subscribe Error]", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
