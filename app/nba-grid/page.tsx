import type { Metadata } from "next";
import { NbaGrid } from "./nba-grid";

export const metadata: Metadata = {
  title: "NBA Grid – Daily Basketball Player Puzzle",
  description: "Drag NBA legends and stars into a daily 3×3 basketball trivia grid.",
  alternates: { canonical: "/nba-grid/" },
};

export default function NbaGridPage() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="/"><span className="brand-ball">G</span><span>GRIDIRON<span>GRID</span></span></a>
        <nav aria-label="Game categories"><a href="/">NFL Grid</a><a className="active" href="/nba-grid/">NBA Grid</a><a href="/mlb-grid/">MLB Grid</a></nav>
        <a className="today-link" href="/archive/">Archive <span>↗</span></a>
      </header>
      <main className="nba-page">
        <section className="nba-hero">
          <div><p className="eyebrow"><span /> DAILY BASKETBALL PUZZLE</p><h1>NBA <em>Grid</em></h1><p>Drag the right player into every square. Nine picks. No repeats.</p></div>
          <NbaGrid />
        </section>
        <section className="sport-next" id="more">
          <p className="section-kicker">MORE LEAGUES</p><h2>One grid. Every sport.</h2>
          <div><a href="/">🏈 <strong>NFL Grid</strong><span>Play now →</span></a><a href="/nba-grid/">🏀 <strong>NBA Grid</strong><span>Playing</span></a><a href="/mlb-grid/"><span>⚾</span><strong>MLB Grid</strong><span>Play now →</span></a></div>
        </section>
      </main>
    </>
  );
}
