"use client";

import { useMemo, useState } from "react";
import { dailyPuzzle, easternPuzzleDate, teamLogo, validPlayers } from "../game-data";

export function PuzzleArchive() {
  const [open, setOpen] = useState<number | null>(0);
  const puzzles = useMemo(() => {
    const current = new Date(`${easternPuzzleDate()}T12:00:00Z`);
    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date(current);
      day.setUTCDate(day.getUTCDate() - index - 1);
      return dailyPuzzle(day.toISOString().slice(0, 10));
    });
  }, []);

  return (
    <main className="archive-page">
      <header className="archive-header">
        <a className="brand" href="/"><span className="brand-ball">G</span><span>GRIDIRON<span>GRID</span></span></a>
        <a href="/">← Back to today&apos;s grid</a>
      </header>
      <section className="archive-hero">
        <p className="section-kicker">THE VAULT</p>
        <h1>Puzzle archive</h1>
        <p>Review completed boards and reveal one accepted answer for every square. Today&apos;s puzzle stays hidden.</p>
      </section>
      <section className="archive-list">
        {puzzles.map((puzzle, index) => (
          <article className="archive-item" key={puzzle.dateKey}>
            <button onClick={() => setOpen(open === index ? null : index)}>
              <span>#{String(puzzle.number).padStart(3, "0")}</span>
              <strong>{puzzle.dateKey}</strong>
              <div>{puzzle.teams.map((team) => <img src={teamLogo(team.id)} alt={team.shortName} key={team.id} />)}</div>
              <b>{open === index ? "Hide answers −" : "View answers +"}</b>
            </button>
            {open === index && (
              <div className="archive-answer-grid">
                {puzzle.teams.map((team) => puzzle.categories.map((category) => (
                  <div key={`${team.id}-${category.id}`}>
                    <img src={teamLogo(team.id)} alt="" />
                    <span><small>{team.shortName} × {category.shortLabel}</small><strong>{validPlayers(team.id, category.id)[0]}</strong></span>
                  </div>
                )))}
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
