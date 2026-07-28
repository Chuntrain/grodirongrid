import type { Metadata } from "next";
import { MlbArchive } from "./view";

export const metadata: Metadata = {
  title: "MLB Grid Past Answers",
  description: "Review previous MLB Grid clubs, statistical clues, and official answers.",
  alternates: { canonical: "/mlb-grid/archive/" },
};

export default function Page() { return <MlbArchive />; }
