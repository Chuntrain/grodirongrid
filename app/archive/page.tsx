import type { Metadata } from "next";
import { PuzzleArchive } from "./puzzle-archive";

export const metadata: Metadata = {
  title: "Gridiron Grid Puzzle Archive",
  description: "Browse completed Gridiron Grid puzzles and reveal accepted answers from previous days.",
  alternates: { canonical: "/archive/" },
};

export default function ArchivePage() {
  return <PuzzleArchive />;
}
