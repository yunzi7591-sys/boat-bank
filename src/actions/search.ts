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

    return users.map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        followerCount: user._count.followers,
    }));
}
