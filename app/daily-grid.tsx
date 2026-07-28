"use client";

import { useEffect, useMemo, useState } from "react";

type CellState = { answer: string; status: "correct" | "wrong" } | null;

const rows = ["Chicago Bears", "Dallas Cowboys", "Miami Dolphins"];
const columns = ["Pro Bowl", "Super Bowl Champ", "1,000+ Rush Yds"];
const sampleAnswers: Record<string, string[]> = {
  "0-0": ["walter payton", "mike ditka", "devin hester"],
  "0-1": ["jim mcmahon", "willie gault", "richard dent"],
  "0-2": ["walter payton", "thomas jones", "matt forte"],
  "1-0": ["emmitt smith", "troy aikman", "michael irvin"],
  "1-1": ["emmitt smith", "troy aikman", "roger staubach"],
  "1-2": ["emmitt smith", "ezekiel elliott", "tony dorsett"],
  "2-0": ["dan marino", "jason taylor", "tyreek hill"],
  "2-1": ["larry csonka", "bob griese", "paul warfield"],
  "2-2": ["ricky williams", "reggie bush", "lamar smith"],
};

export function DailyGrid() {
  const [cells, setCells] = useState<CellState[]>(Array(9).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("Select a square to make your pick.");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const stored = window.localStorage.getItem("gridiron-grid-state");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.cells) && parsed.cells.length === 9) setCells(parsed.cells);
        if (typeof parsed.streak === "number") setStreak(parsed.streak);
      } catch {}
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("gridiron-grid-state", JSON.stringify({ cells, streak }));
  }, [cells, streak]);

  const guesses = cells.filter(Boolean).length;
  const score = cells.filter((cell) => cell?.status === "correct").length;
  const finished = guesses === 9;

  useEffect(() => {
    if (finished && score === 9 && streak === 0) setStreak(1);
  }, [finished, score, streak]);

  const clue = useMemo(() => {
    if (selected === null) return "";
    return `${rows[Math.floor(selected / 3)]} + ${columns[selected % 3]}`;
  }, [selected]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (selected === null || !value.trim() || cells[selected]) return;
    const normalized = value.trim().toLowerCase();
    const correct = sampleAnswers[`${Math.floor(selected / 3)}-${selected % 3}`].includes(normalized);
    const next = [...cells];
    next[selected] = { answer: value.trim(), status: correct ? "correct" : "wrong" };
    setCells(next);
    setMessage(correct ? "Touchdown! That player fits both clues." : "Not this time. That guess is now locked.");
    setValue("");
    setSelected(null);
  }

  async function share() {
    const squares = cells.map((cell) => cell?.status === "correct" ? "🟩" : cell ? "🟥" : "⬜");
    const text = `Gridiron Grid #001 — ${score}/9\n${squares.slice(0,3).join("")}\n${squares.slice(3,6).join("")}\n${squares.slice(6,9).join("")}\n🔥 ${streak} day streak\nhttps://gridirongrid.to/`;
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
        <div><span>GRID #001</span><span>MON, JUL 27</span></div>
        <div className="score"><span>SCORE</span><strong>{score}<i>/9</i></strong></div>
      </div>
      <div className="board" role="grid" aria-label="Daily NFL player grid">
        <div className="corner" />
        {columns.map((column) => <div className="column-clue" key={column}>{column}</div>)}
        {rows.map((row, rowIndex) => (
          <div className="board-row" key={row}>
            <div className="row-clue">{row}</div>
            {[0,1,2].map((columnIndex) => {
              const index = rowIndex * 3 + columnIndex;
              const cell = cells[index];
              return (
                <button
                  key={index}
                  className={`cell ${selected === index ? "selected" : ""} ${cell?.status ?? ""}`}
                  onClick={() => !cell && setSelected(index)}
                  aria-label={`${row} and ${columns[columnIndex]}${cell ? `: ${cell.answer}` : ""}`}
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
          <input id="player" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type an NFL player…" disabled={selected === null} autoComplete="off" />
          <button disabled={selected === null || !value.trim()}>Submit pick</button>
        </div>
      </form>

      <div className="game-footer">
        <div><span>{message}</span><small>{9 - guesses} guesses left</small></div>
        <button className="share-button" onClick={share}>Share result <span>↗</span></button>
      </div>
    </div>
  );
}
