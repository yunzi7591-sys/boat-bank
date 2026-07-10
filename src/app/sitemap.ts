import { MetadataRoute } from "next";
import { VENUES } from "@/lib/constants/venues";

const BASE = "https://boatbank.jp";

export default function sitemap(): MetadataRoute.Sitemap {
    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE, changeFrequency: "daily", priority: 1.0 },
        { url: `${BASE}/market`, changeFrequency: "hourly", priority: 0.9 },
        { url: `${BASE}/lp`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${BASE}/guide`, changeFrequency: "monthly", priority: 0.7 },
        { url: `${BASE}/shindan`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${BASE}/news`, changeFrequency: "daily", priority: 0.7 },
        { url: `${BASE}/ranking`, changeFrequency: "daily", priority: 0.7 },
        { url: `${BASE}/events`, changeFrequency: "weekly", priority: 0.5 },
        { url: `${BASE}/subscribe`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.3 },
        { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
        { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
        { url: `${BASE}/sct`, changeFrequency: "yearly", priority: 0.3 },
    ];

    // 全24場の場別ページ（レース情報・公開予想が毎日更新される）
    const placePages: MetadataRoute.Sitemap = VENUES.map(v => ({
        url: `${BASE}/place/${v.id}`,
        changeFrequency: "hourly",
        priority: 0.8,
    }));

    // ギャンブラー診断の結果ページ（8タイプ）
    const shindanPages: MetadataRoute.Sitemap = [
        "shokunin", "sniper", "hunter", "kitaichi", "ishibashi", "nekketsu", "yumeoi", "banshou",
    ].map(slug => ({
        url: `${BASE}/shindan/${slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.5,
    }));

    return [...staticPages, ...placePages, ...shindanPages];
}
