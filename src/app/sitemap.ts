import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: "https://boatbank.jp",
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: "https://boatbank.jp/lp",
            changeFrequency: "weekly",
            priority: 0.9,
        },
    ];
}
