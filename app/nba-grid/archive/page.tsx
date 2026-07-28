import type { Metadata } from "next";
import { NbaArchive } from "./view";

export const metadata: Metadata = {
  title: "NBA Grid Past Answers",
  description: "Review previous NBA Grid teams, statistical clues, and official answers.",
  alternates: { canonical: "/nba-grid/archive/" },
};

export default function Page() { return <NbaArchive />; }
