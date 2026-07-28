import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://gridirongrid.to/", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://gridirongrid.to/nba-grid/", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: "https://gridirongrid.to/mlb-grid/", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: "https://gridirongrid.to/archive/", lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  ];
}
