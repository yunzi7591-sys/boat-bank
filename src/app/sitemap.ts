import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://boatbank.jp";

    // 静的ページ
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, changeFrequency: "hourly", priority: 1.0 },
        { url: `${baseUrl}/market`, changeFrequency: "hourly", priority: 0.9 },
        { url: `${baseUrl}/ranking`, changeFrequency: "daily", priority: 0.8 },
        { url: `${baseUrl}/events`, changeFrequency: "daily", priority: 0.7 },
        { url: `${baseUrl}/search`, changeFrequency: "daily", priority: 0.6 },
        { url: `${baseUrl}/guide`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${baseUrl}/news`, changeFrequency: "weekly", priority: 0.5 },
        { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
        { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
        { url: `${baseUrl}/login`, changeFrequency: "yearly", priority: 0.3 },
        { url: `${baseUrl}/register`, changeFrequency: "yearly", priority: 0.4 },
    ];

    // 公開ユーザープロフィール
    const users = await prisma.user.findMany({
        select: { id: true },
        take: 200,
    });
    const userPages: MetadataRoute.Sitemap = users.map((u) => ({
        url: `${baseUrl}/users/${u.id}`,
        changeFrequency: "weekly",
        priority: 0.5,
    }));

    // 公開予想ページ
    const predictions = await prisma.prediction.findMany({
        where: { isPrivate: false },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 500,
    });
    const predictionPages: MetadataRoute.Sitemap = predictions.map((p) => ({
        url: `${baseUrl}/predictions/${p.id}`,
        lastModified: p.createdAt,
        changeFrequency: "daily",
        priority: 0.6,
    }));

    return [...staticPages, ...userPages, ...predictionPages];
}
