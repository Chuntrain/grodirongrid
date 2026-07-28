import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot"], allow: "/" },
    ],
    sitemap: "https://gridirongrid.to/sitemap.xml",
    host: "https://gridirongrid.to",
  };
}
