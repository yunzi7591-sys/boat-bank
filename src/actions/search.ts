"use server";

import { prisma } from "@/lib/prisma";

export async function searchUsers(query: string) {
    const users = await prisma.user.findMany({
        where: query
            ? {
                  name: {
                      contains: query,
                      mode: "insensitive" as const,
                  },
              }
            : undefined,
        select: {
            id: true,
            name: true,
            role: true,
            _count: {
                select: {
                    followers: true,
                },
            },
        },
        orderBy: {
            followers: {
                _count: "desc" as const,
            },
        },
    });

    // 星評価（平均・件数）をまとめて取得
    const ratingRows = users.length > 0
        ? await prisma.userRating.groupBy({
            by: ["targetId"],
            where: { targetId: { in: users.map(u => u.id) } },
            _avg: { rating: true },
            _count: true,
        })
        : [];
    const ratingMap = new Map(ratingRows.map(r => [r.targetId, { avg: r._avg.rating ?? 0, count: r._count }]));

    return users.map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        followerCount: user._count.followers,
        rating: ratingMap.get(user.id) ?? null,
    }));
}
