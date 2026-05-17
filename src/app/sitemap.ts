import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: "https://boatbank.jp",
            changeFrequency: "daily",
            priority: 1.0,
        },
    ];
}
