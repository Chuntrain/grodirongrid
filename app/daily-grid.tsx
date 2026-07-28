"use client";

import { useEffect, useMemo, useState } from "react";
import { answers, dailyPuzzle, easternPuzzleDate, teamLogo } from "./game-data";

type CellState = { answer: string; status: "correct" | "wrong" } | null;

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

export function DailyGrid() {
  const dateKey = useMemo(() => easternPuzzleDate(), []);
  const puzzle = useMemo(() => dailyPuzzle(dateKey), [dateKey]);
  const storageKey = `gridiron-grid:${dateKey}`;
  const [cells, setCells] = useState<CellState[]>(Array(9).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("Select a square to make your pick.");
  const [streak, setStreak] = useState(0);

  const playerNames = useMemo(() => {
    const names = new Set<string>();
    puzzle.teams.forEach((team) => puzzle.categories.forEach((category) => {
      answers[team.id][category.id].forEach((name) => names.add(name));
    }));
    return [...names].sort();
  }, [puzzle]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const savedStreak = Number(window.localStorage.getItem("gridiron-grid-streak") || 0);
    if (savedStreak) setStreak(savedStreak);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 9) setCells(parsed);
      } catch {}
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(cells));
  }, [cells, storageKey]);

  const guesses = cells.filter(Boolean).length;
  const score = cells.filter((cell) => cell?.status === "correct").length;
  const finished = guesses === 9;

  useEffect(() => {
    if (finished && score === 9) {
      const next = Math.max(1, streak);
      setStreak(next);
      window.localStorage.setItem("gridiron-grid-streak", String(next));
    }
  }, [finished, score, streak]);

  const clue = useMemo(() => {
    if (selected === null) return "";
    return `${puzzle.teams[Math.floor(selected / 3)].name} + ${puzzle.categories[selected % 3].shortLabel}`;
  }, [selected, puzzle]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (selected === null || !value.trim() || cells[selected]) return;
    if (cells.some((cell) => cell?.status === "correct" && normalize(cell.answer) === normalize(value))) {
      setMessage("That player is already on your board. Choose a different name.");
      return;
    }
    const team = puzzle.teams[Math.floor(selected / 3)];
    const category = puzzle.categories[selected % 3];
    const valid = answers[team.id][category.id].some((name) => normalize(name) === normalize(value));
    const next = [...cells];
    next[selected] = { answer: value.trim(), status: valid ? "correct" : "wrong" };
    setCells(next);
    setMessage(valid ? "Touchdown! That player fits both clues." : "No match in today’s answer set. That guess is locked.");
    setValue("");
    setSelected(null);
  }

  async function share() {
    const squares = cells.map((cell) => cell?.status === "correct" ? "🟩" : cell ? "🟥" : "⬜");
    const text = `Gridiron Grid #${puzzle.number} — ${score}/9\n${squares.slice(0,3).join("")}\n${squares.slice(3,6).join("")}\n${squares.slice(6,9).join("")}\n🔥 ${streak} day streak\nhttps://gridirongrid.to/`;
    try {
      if (navigator.share) await navigator.share({ title: "Gridiron Grid", text });
      else {
        await navigator.clipboard.writeText(text);
        setMessage("Score copied to your clipboard.");
      }
    } catch {}
  }

  return (
    <div className="game-shell">
      <div className="game-meta">
        <div><span>GRID #{String(puzzle.number).padStart(3, "0")}</span><span>{dateKey} · 8 PM ET</span></div>
        <div className="score"><span>SCORE</span><strong>{score}<i>/9</i></strong></div>
      </div>
      <div className="board" role="grid" aria-label="Daily NFL player grid">
        <div className="corner"><span>TEAM</span><b>×</b><span>FEAT</span></div>
        {puzzle.categories.map((category) => (
          <div className="column-clue" key={category.id} title={category.description}>
            <span>{category.shortLabel}</span><small>{category.description}</small>
          </div>
        ))}
        {puzzle.teams.map((team, rowIndex) => (
          <div className="board-row" key={team.id}>
            <div className="row-clue" style={{ "--team": team.color, "--accent": team.accent } as React.CSSProperties}>
              <img src={teamLogo(team.id)} alt={`${team.name} logo`} width="52" height="52" />
              <span>{team.shortName}</span>
            </div>
            {[0,1,2].map((columnIndex) => {
              const index = rowIndex * 3 + columnIndex;
              const cell = cells[index];
              return (
                <button
                  key={index}
                  className={`cell ${selected === index ? "selected" : ""} ${cell?.status ?? ""}`}
                  onClick={() => !cell && setSelected(index)}
                  aria-label={`${team.name} and ${puzzle.categories[columnIndex].label}${cell ? `: ${cell.answer}` : ""}`}
                >
                  {cell ? <><span>{cell.status === "correct" ? "✓" : "×"}</span><small>{cell.answer}</small></> : <b>+</b>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <form className="answer-form" onSubmit={submit}>
        <label htmlFor="player">{clue || "Choose a square above"}</label>
        <div>
          <input id="player" list="player-names" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type an NFL player…" disabled={selected === null} autoComplete="off" />
          <datalist id="player-names">{playerNames.map((name) => <option value={name} key={name} />)}</datalist>
          <button disabled={selected === null || !value.trim()}>Submit pick</button>
        </div>
      </form>

      <div className="game-footer">
        <div><span>{message}</span><small>{9 - guesses} guesses left · refreshes daily</small></div>
        <button className="share-button" onClick={share}>Share result <span>↗</span></button>
      </div>
    </div>
  );
}
