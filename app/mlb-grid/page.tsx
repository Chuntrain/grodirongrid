import type { Metadata } from "next";
import { MlbGrid } from "./mlb-grid";
import { SportSeoContent } from "../sport-content";
import { Past14Days } from "../past-14-days";

export const metadata: Metadata = {
  title: "MLB Grid – Daily Baseball Player Puzzle",
  description: "Drag baseball legends into a daily 3×3 MLB statistics grid. Teams, clues, and player pool change every day.",
  alternates: { canonical: "/mlb-grid/" },
};

export default function MlbGridPage() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="/"><span className="brand-ball">G</span><span>GRIDIRON<span>GRID</span></span></a>
        <nav aria-label="Game categories"><a href="/">NFL Grid</a><a href="/nba-grid/">NBA Grid</a><a className="active" href="/mlb-grid/">MLB Grid</a></nav>
        <a className="today-link" href="/archive/">Archive <span>↗</span></a>
      </header>
      <main className="nba-page mlb-page">
        <section className="nba-hero">
          <div><p className="eyebrow"><span /> DAILY BASEBALL PUZZLE</p><h1>MLB <em>Grid</em></h1><p>Three clubs. Three career tests. Nine player cards that change every day.</p></div>
          <MlbGrid />
        </section>
        <Past14Days sport="MLB" />
        <SportSeoContent sport="MLB" />
        <section className="sport-next">
          <p className="section-kicker">MORE LEAGUES</p><h2>Come back tomorrow.</h2>
          <div><a href="/">🏈 <strong>NFL Grid</strong><span>Play now →</span></a><a href="/nba-grid/">🏀 <strong>NBA Grid</strong><span>Play now →</span></a><a href="/mlb-grid/">⚾ <strong>MLB Grid</strong><span>Playing</span></a></div>
        </section>
      </main>
    </>
  );
}
