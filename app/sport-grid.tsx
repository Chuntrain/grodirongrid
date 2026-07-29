"use client";

import { useEffect, useMemo, useState } from "react";
import { easternPuzzleDate } from "./game-data";
import { buildShareText, renderShareImage, type ShareMode } from "./share-card";

export type SportBoard = {
  teams: { id: string; name: string; color: string; accent?: string }[];
  categories: { short: string; detail: string }[];
  answers: Record<string, string[][]>;
  pool: string[];
};

type CellState = { answer: string; status: "correct" | "wrong" } | null;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function puzzleNumberFor(dateKey: string) {
  return (
    Math.floor(
      (new Date(`${dateKey}T00:00:00Z`).getTime() - new Date("2026-01-01T00:00:00Z").getTime()) /
        86400000,
    ) + 1
  );
}

type SportDailyGridProps = {
  sport: "NBA" | "MLB";
  brand: string;
  boards: SportBoard[];
  pickBoard: (dateKey: string, boards: SportBoard[]) => SportBoard;
  logoFolder: "nba" | "mlb";
  emoji: string;
  sitePath: string;
  date?: string;
};

export function SportDailyGrid({
  sport,
  brand,
  boards,
  pickBoard,
  logoFolder,
  emoji,
  sitePath,
  date: requestedDate,
}: SportDailyGridProps) {
  const dateKey = useMemo(() => requestedDate || easternPuzzleDate(), [requestedDate]);
  const board = useMemo(() => pickBoard(dateKey, boards), [boards, dateKey, pickBoard]);
  const puzzleNumber = useMemo(() => puzzleNumberFor(dateKey), [dateKey]);
  const storageKey = `gridiron-${sport.toLowerCase()}:${dateKey}`;
  const streakKey = `gridiron-${sport.toLowerCase()}-streak`;

  const [cells, setCells] = useState<CellState[]>(Array(9).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [playerCard, setPlayerCard] = useState("");
  const [message, setMessage] = useState("Drag a player from the right-side pool into a square.");
  const [streak, setStreak] = useState(0);
  const [showPrevious, setShowPrevious] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>("score");

  const previous = useMemo(() => {
    const day = new Date(`${dateKey}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 1);
    const key = day.toISOString().slice(0, 10);
    return { dateKey: key, number: puzzleNumberFor(key), board: pickBoard(key, boards) };
  }, [boards, dateKey, pickBoard]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const savedStreak = Number(window.localStorage.getItem(streakKey) || 0);
    if (savedStreak) setStreak(savedStreak);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 9) setCells(parsed);
      } catch {
        // ignore bad local saves
      }
    }
  }, [storageKey, streakKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(cells));
  }, [cells, storageKey]);

  const guesses = cells.filter(Boolean).length;
  const score = cells.filter((cell) => cell?.status === "correct").length;
  const finished = guesses === 9;

  useEffect(() => {
    if (finished) setMessage("Grid submitted. The official answers will be published here tomorrow.");
    if (finished && score === 9) {
      const next = Math.max(1, streak);
      setStreak(next);
      window.localStorage.setItem(streakKey, String(next));
    }
  }, [finished, score, streak, streakKey]);

  function placePlayer(index: number, player: string) {
    if (!player) return;
    if (cells.some((cell, cellIndex) => cellIndex !== index && normalize(cell?.answer ?? "") === normalize(player))) {
      setMessage("That player is already on your board. Choose a different name.");
      return;
    }
    const team = board.teams[Math.floor(index / 3)];
    const accepted = board.answers[team.id][index % 3] ?? [];
    const valid = accepted.some((candidate) => normalize(candidate) === normalize(player));
    const next = [...cells];
    next[index] = { answer: player, status: valid ? "correct" : "wrong" };
    setCells(next);
    setMessage(
      valid
        ? "Nice! That player fits both clues. Tap the name to replace it."
        : "No match. Tap the name to remove or replace it.",
    );
    setPlayerCard("");
    setSelected(null);
  }

  function handleCellClick(index: number) {
    if (cells[index]) {
      const removed = cells[index]?.answer;
      const next = [...cells];
      next[index] = null;
      setCells(next);
      setSelected(index);
      setMessage(`${removed} returned to the player pool. Select a replacement.`);
      return;
    }
    setSelected(index);
    if (playerCard) placePlayer(index, playerCard);
  }

  const siteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${sitePath}`
      : `https://gridirongrid.org${sitePath}`;

  function shareInput(mode: ShareMode) {
    return {
      mode,
      brand,
      puzzleNumber,
      dateKey,
      score,
      streak,
      siteUrl,
      cells,
      teams: board.teams.map((team) => team.name),
      categories: board.categories.map((category) => category.short),
    };
  }

  function sharePayload(mode: ShareMode) {
    return buildShareText(shareInput(mode));
  }

  async function copyShare(mode: ShareMode) {
    await navigator.clipboard.writeText(sharePayload(mode));
    setMessage("Share card copied.");
  }

  async function downloadShareImage(mode: ShareMode) {
    const blob = await renderShareImage(shareInput(mode));
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sport.toLowerCase()}-grid-${dateKey}-${mode}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Share image downloaded.");
  }

  async function nativeShare(mode: ShareMode) {
    const text = sharePayload(mode);
    try {
      const blob = await renderShareImage(shareInput(mode));
      const file = new File([blob], `${sport.toLowerCase()}-grid-${mode}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: brand, text, files: [file] });
        return;
      }
    } catch {
      // fall through
    }
    if (navigator.share) {
      await navigator.share({ title: brand, text });
      return;
    }
    await copyShare(mode);
  }

  const remaining = board.pool.filter(
    (name) => !cells.some((cell) => cell && normalize(cell.answer) === normalize(name)),
  );

  return (
    <div className={`game-shell sport-shell sport-shell-${sport.toLowerCase()}`}>
      <div className="game-meta">
        <div>
          <span>
            {sport} #{String(puzzleNumber).padStart(3, "0")}
          </span>
          <span>
            {dateKey} · 8 PM ET
          </span>
        </div>
        <div className="game-meta-actions">
          <button onClick={() => setShowPrevious(true)}>Yesterday&apos;s answers</button>
          <div className="score">
            <span>SCORE</span>
            <strong>
              {score}
              <i>/9</i>
            </strong>
          </div>
        </div>
      </div>

      <div className="game-play-area">
        <div className="board" role="grid" aria-label={`Daily ${sport} player grid`}>
          <div className="corner">
            <span>TEAM</span>
            <b>×</b>
            <span>FEAT</span>
          </div>
          {board.categories.map((category) => (
            <div className="column-clue" key={category.short} title={category.detail}>
              <span>{category.short}</span>
              <small>{category.detail}</small>
            </div>
          ))}
          {board.teams.map((team, rowIndex) => (
            <div className="board-row" key={team.id}>
              <div
                className="row-clue"
                style={{ "--team": team.color, "--accent": team.accent ?? team.color } as React.CSSProperties}
              >
                <img
                  src={`/${logoFolder}/${team.id.toLowerCase()}.png`}
                  alt={`${team.name} logo`}
                  width="52"
                  height="52"
                />
                <span>{team.name}</span>
              </div>
              {[0, 1, 2].map((columnIndex) => {
                const index = rowIndex * 3 + columnIndex;
                const cell = cells[index];
                return (
                  <button
                    key={index}
                    className={`cell drop-cell ${selected === index ? "selected" : ""} ${playerCard ? "drop-ready" : ""} ${cell?.status ?? ""}`}
                    onClick={() => handleCellClick(index)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      placePlayer(index, event.dataTransfer.getData("text/plain") || playerCard);
                    }}
                    aria-label={`${team.name} and ${board.categories[columnIndex].short}${cell ? `: ${cell.answer}` : ""}`}
                  >
                    {cell ? (
                      <>
                        <span>{cell.status === "correct" ? "✓" : "×"}</span>
                        <small>{cell.answer}</small>
                        <em>REPLACE</em>
                      </>
                    ) : (
                      <>
                        <b className="cell-slot-number">{index + 1}</b>
                        {playerCard && <em>DROP</em>}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <aside className="player-pool" aria-label="Player card pool">
          <div className="pool-head">
            <div>
              <small>DAILY PLAYER POOL</small>
              <strong>Drag a player</strong>
            </div>
            <span>{remaining.length} left</span>
          </div>
          <div className="pool-cards">
            {remaining.map((name, index) => (
              <button
                key={name}
                className={`pool-card ${playerCard === name ? "picked" : ""}`}
                draggable
                onDragStart={(event) => {
                  setPlayerCard(name);
                  event.dataTransfer.setData("text/plain", name);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => {
                  setPlayerCard(name);
                  setMessage(`${name} selected. Tap an empty square to place the card.`);
                }}
                aria-label={`${name}. Drag to a grid square.`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{name}</strong>
                <b>{emoji}</b>
              </button>
            ))}
          </div>
          <p>
            Desktop: drag and drop
            <br />
            Mobile: tap card, then square
            <br />
            Tap a placed name to remove it
          </p>
        </aside>
      </div>

      <div className="game-footer">
        <div>
          <span>{message}</span>
          <small>
            {9 - guesses} guesses left · {sport} daily grid
          </small>
        </div>
        <button className="share-button" onClick={() => setShowShare(true)}>
          Share card <span>↗</span>
        </button>
      </div>

      {showShare && (
        <div className="answer-overlay share-overlay" role="dialog" aria-modal="true" aria-label="Share your grid">
          <button className="overlay-backdrop" onClick={() => setShowShare(false)} aria-label="Close share panel" />
          <section className="answer-drawer share-drawer">
            <div className="drawer-head">
              <div>
                <small>SHARE YOUR GRID</small>
                <h2>Pick a card</h2>
                <p>Same viral share flow as NFL — axes, fuzzy marks, Am I right?</p>
              </div>
              <button onClick={() => setShowShare(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="share-mode-tabs" role="tablist">
              {(
                [
                  ["blank", "Blank challenge", "Teams + feats, empty board"],
                  ["score", "Am I right?", "Fuzzy 😊/😀 scoreboard"],
                  ["answers", "My picks", "Names + fuzzy marks"],
                ] as const
              ).map(([mode, label, hint]) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={shareMode === mode}
                  className={shareMode === mode ? "active" : ""}
                  onClick={() => setShareMode(mode)}
                >
                  <strong>{label}</strong>
                  <span>{hint}</span>
                </button>
              ))}
            </div>
            <pre className="share-preview">{sharePayload(shareMode)}</pre>
            <div className="share-actions">
              <button type="button" onClick={() => copyShare(shareMode)}>
                Copy text
              </button>
              <button type="button" onClick={() => downloadShareImage(shareMode)}>
                Download image
              </button>
              <button type="button" className="primary" onClick={() => nativeShare(shareMode)}>
                Share to apps
              </button>
            </div>
          </section>
        </div>
      )}

      {showPrevious && (
        <div className="answer-overlay" role="dialog" aria-modal="true" aria-label="Yesterday's answers">
          <button className="overlay-backdrop" onClick={() => setShowPrevious(false)} aria-label="Close answers" />
          <section className="answer-drawer">
            <div className="drawer-head">
              <div>
                <small>
                  {sport} #{String(previous.number).padStart(3, "0")}
                </small>
                <h2>Yesterday&apos;s answers</h2>
                <p>{previous.dateKey}</p>
              </div>
              <button onClick={() => setShowPrevious(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="previous-grid">
              <div />
              {previous.board.categories.map((category) => (
                <strong key={category.short}>{category.short}</strong>
              ))}
              {previous.board.teams.map((team) => (
                <div className="previous-row" key={team.id}>
                  <div>
                    <img src={`/${logoFolder}/${team.id.toLowerCase()}.png`} alt="" />
                    <span>{team.name}</span>
                  </div>
                  {previous.board.categories.map((category, column) => {
                    const options = previous.board.answers[team.id][column] ?? [];
                    return (
                      <article key={category.short}>
                        <b>{options[0] ?? "No answer"}</b>
                        <small>{options.length} accepted</small>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="drawer-note">One example is shown per square.</p>
            <a href={`/${logoFolder}-grid/archive/`}>Open puzzle archive →</a>
          </section>
        </div>
      )}
    </div>
  );
}
