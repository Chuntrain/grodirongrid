import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gridirongrid.org";
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Gridiron Grid – Daily Football Grid Game",
    template: "%s | Gridiron Grid",
  },
  description:
    "Fill the 3×3 grid with your NFL knowledge. Match players to teams, stats, and achievements. A new free football puzzle every day.",
  keywords: ["gridiron grid", "NFL grid", "football grid game", "daily NFL trivia", "NFL puzzle"],
  applicationName: "Gridiron Grid",
  authors: [{ name: "Gridiron Grid" }],
  creator: "Gridiron Grid",
  publisher: "Gridiron Grid",
  category: "games",
  robots: { index: true, follow: true },
  verification: {
    google: googleSiteVerification,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Gridiron Grid",
    title: "Gridiron Grid - Daily NFL Puzzle",
    description: "Nine squares. Nine guesses. A fresh NFL puzzle every day.",
    images: [
      {
        url: "/og.png?v=3",
        width: 1200,
        height: 630,
        alt: "Gridiron Grid daily football puzzle",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gridiron Grid - Daily NFL Puzzle",
    description: "Nine squares. Nine guesses. A fresh NFL puzzle every day.",
    images: ["/og.png?v=3"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/icon-48.png?v=3", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/favicon.svg?v=3", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
