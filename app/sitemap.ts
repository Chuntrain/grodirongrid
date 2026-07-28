import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gridirongrid.org";
  const now = new Date();

  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/archive`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/how-to-play`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/strategies`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/nba-grid`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/nba-grid/archive`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/nba-grid/how-to-play`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/nba-grid/strategies`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/mlb-grid`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/mlb-grid/archive`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/mlb-grid/how-to-play`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/mlb-grid/strategies`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];
}
