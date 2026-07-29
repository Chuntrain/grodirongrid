"use client";

import { useEffect, useMemo, useState } from "react";
import { easternPuzzleDate } from "./game-data";
import {
  buildShareText,
  scoreReaction,
  shareCardToClipboard,
  type ShareMode,
} from "./share-card";

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
  const revealKey = `${storageKey}:revealed`;
  const streakKey = `gridiron-${sport.toLowerCase()}-streak`;

  const [cells, setCells] = useState<CellState[]>(Array(9).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [playerCard, setPlayerCard] = useState("");
  const [message, setMessage] = useState(
    "Lock 9 picks. No right/wrong until you check — share to unlock official answers.",
  );
  const [streak, setStreak] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answersUnlocked, setAnswersUnlocked] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>("score");
  const [shareBusy, setShareBusy] = useState(false);

  const previous = useMemo(() => {
    const day = new Date(`${dateKey}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 1);
    const key = day.toISOString().slice(0, 10);
    return { dateKey: key, number: puzzleNumberFor(key), board: pickBoard(key, boards) };
  }, [boards, dateKey, pickBoard]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const savedStreak = Number(window.localStorage.getItem(streakKey) || 0);
    const savedReveal = window.localStorage.getItem(revealKey) === "1";
    const savedAnswers = window.localStorage.getItem(`${revealKey}:answers`) === "1";
    if (savedStreak) setStreak(savedStreak);
    if (savedReveal) setRevealed(true);
    if (savedAnswers) setAnswersUnlocked(true);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 9) setCells(parsed);
      } catch {
        // ignore
      }
    }
  }, [storageKey, streakKey, revealKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(cells));
  }, [cells, storageKey]);

  const guesses = cells.filter(Boolean).length;
  const score = cells.filter((cell) => cell?.status === "correct").length;
  const finished = guesses === 9;
  const reaction = scoreReaction(score);

  useEffect(() => {
    if (finished && !revealed) {
      setMessage("Board locked. Hit Check the result for your score vibe — share to unlock answers.");
    }
  }, [finished, revealed]);

  function placePlayer(index: number, player: string) {
    if (!player || revealed) return;
    if (
      cells.some(
        (cell, cellIndex) =>
          cellIndex !== index && normalize(cell?.answer ?? "") === normalize(player),
      )
    ) {
      setMessage("That player is already on your board. Choose a different name.");
      return;
    }
    const team = board.teams[Math.floor(index / 3)];
    const accepted = board.answers[team.id][index % 3] ?? [];
    const valid = accepted.some((candidate) => normalize(candidate) === normalize(player));
    const next = [...cells];
    next[index] = { answer: player, status: valid ? "correct" : "wrong" };
    setCells(next);
    setMessage(`${player} locked in square ${index + 1}. No spoilers until you share.`);
    setPlayerCard("");
    setSelected(null);
  }

  function handleCellClick(index: number) {
    if (revealed) return;
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

  function unlockResult() {
    if (!revealed) {
      setRevealed(true);
      window.localStorage.setItem(revealKey, "1");
      if (score === 9) {
        const next = streak + 1;
        setStreak(next);
        window.localStorage.setItem(streakKey, String(next));
      }
    }
  }

  function unlockAnswers() {
    unlockResult();
    setAnswersUnlocked(true);
    window.localStorage.setItem(`${revealKey}:answers`, "1");
  }

  function checkResult() {
    if (!finished) return;
    unlockResult();
    setMessage(
      answersUnlocked
        ? `${reaction.emoji} ${score}/9 · ${reaction.label}.`
        : `${reaction.emoji} ${score}/9 · ${reaction.label}. Share your card to unlock official answers.`,
    );
    if (!answersUnlocked) {
      setShareMode("score");
      setShowShare(true);
    }
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
      score: revealed || finished ? score : 0,
      streak,
      siteUrl,
      cells,
      teams: board.teams.map((team) => team.name),
      categories: board.categories.map((category) => category.short),
    };
  }

  async function oneClickShare(mode: ShareMode) {
    setShareBusy(true);
    try {
      const kind = await shareCardToClipboard(shareInput(mode));
      unlockAnswers();
      setShowShare(false);
      setShowAnswers(true);
      setMessage(
        kind === "both"
          ? "Card + link copied. Here are today's official answers."
          : kind === "image"
            ? "Card image copied. Here are today's official answers."
            : "Share text + link copied. Here are today's official answers.",
      );
    } catch {
      setMessage("Share failed — try again or allow clipboard access.");
    } finally {
      setShareBusy(false);
    }
  }

  async function shareAndGetAnswer() {
    const mode: ShareMode = finished || revealed ? "score" : "blank";
    await oneClickShare(mode);
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
            <span>{revealed ? "SCORE" : "FILLED"}</span>
            <strong>
              {revealed ? score : guesses}
              <i>/9</i>
              {revealed && <em className="score-reaction">{reaction.emoji}</em>}
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
                    className={`cell drop-cell ${selected === index ? "selected" : ""} ${playerCard ? "drop-ready" : ""} ${cell ? "filled-locked" : ""} ${revealed && cell ? cell.status : ""}`}
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
                        <b className="cell-slot-number muted">{index + 1}</b>
                        <small>{cell.answer}</small>
                        {!revealed && <em>TAP TO SWAP</em>}
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
                draggable={!revealed}
                onDragStart={(event) => {
                  if (revealed) return;
                  setPlayerCard(name);
                  event.dataTransfer.setData("text/plain", name);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => {
                  if (revealed) return;
                  setPlayerCard(name);
                  setMessage(`${name} selected. Tap an empty square to lock it in.`);
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
            Playing hides right/wrong
            <br />
            Share to unlock answers
            <br />
            Tap a locked name to swap
          </p>
        </aside>
      </div>

      {finished && !revealed && (
        <div className="result-banner">
          <div>
            <strong>Board complete</strong>
            <span>Check your score vibe, then share to unlock official answers.</span>
          </div>
          <button type="button" onClick={checkResult}>
            Check the result
          </button>
        </div>
      )}

      {revealed && (
        <div className="result-banner revealed">
          <div className="result-emoji" aria-hidden>
            {reaction.emoji}
          </div>
          <div>
            <strong>
              {score}/9 · {reaction.label}
            </strong>
            <span>
              {answersUnlocked
                ? "Answers unlocked. Review the official picks anytime."
                : "Share your card to unlock today's official answers."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => (answersUnlocked ? setShowAnswers(true) : shareAndGetAnswer())}
            disabled={shareBusy}
          >
            {answersUnlocked ? "View answers" : shareBusy ? "Sharing…" : "Share & get answers"}
          </button>
        </div>
      )}

      <div className="game-footer">
        <div>
          <span>{message}</span>
          <small>
            {9 - guesses} open squares · {sport} daily grid
          </small>
        </div>
        <button className="share-button" disabled={shareBusy} onClick={() => shareAndGetAnswer()}>
          {shareBusy ? "Sharing…" : "Share card and get answer"} <span>↗</span>
        </button>
      </div>

      {showShare && (
        <div className="answer-overlay share-overlay" role="dialog" aria-modal="true" aria-label="Share your grid">
          <button className="overlay-backdrop" onClick={() => setShowShare(false)} aria-label="Close share panel" />
          <section className="answer-drawer share-drawer">
            <div className="drawer-head">
              <div>
                <small>ONE-CLICK SHARE</small>
                <h2>Copy card + link</h2>
                <p>Copies the card image and a play link to your clipboard — paste into X, IG, FB, LinkedIn.</p>
              </div>
              <button onClick={() => setShowShare(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="share-mode-tabs" role="tablist">
              {(
                [
                  ["blank", "Blank challenge", "Axes only — dare your friends"],
                  [
                    "score",
                    "My score vibe",
                    revealed ? `${reaction.emoji} ${score}/9 · Am I right?` : "Check the result first",
                  ],
                ] as const
              ).map(([mode, label, hint]) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={shareMode === mode}
                  className={shareMode === mode ? "active" : ""}
                  disabled={mode === "score" && !revealed}
                  onClick={() => setShareMode(mode)}
                >
                  <strong>{label}</strong>
                  <span>{hint}</span>
                </button>
              ))}
            </div>
            <pre className="share-preview">
              {buildShareText(shareInput(shareMode === "score" && !revealed ? "blank" : shareMode))}
            </pre>
            <div className="share-actions single">
              <button
                type="button"
                className="primary"
                disabled={shareBusy || (shareMode === "score" && !revealed)}
                onClick={() =>
                  oneClickShare(shareMode === "score" && !revealed ? "blank" : shareMode)
                }
              >
                {shareBusy ? "Preparing…" : "Copy card + link"}
              </button>
            </div>
            <p className="drawer-note">
              No names on the shared card. After you copy, official answers unlock here.
            </p>
          </section>
        </div>
      )}

      {showAnswers && (
        <div className="answer-overlay" role="dialog" aria-modal="true" aria-label="Today's answers">
          <button className="overlay-backdrop" onClick={() => setShowAnswers(false)} aria-label="Close answers" />
          <section className="answer-drawer">
            <div className="drawer-head">
              <div>
                <small>
                  {sport} #{String(puzzleNumber).padStart(3, "0")}
                </small>
                <h2>Today&apos;s answers</h2>
                <p>
                  {dateKey} · your score {score}/9 {reaction.emoji}
                </p>
              </div>
              <button onClick={() => setShowAnswers(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="previous-grid">
              <div />
              {board.categories.map((category) => (
                <strong key={category.short}>{category.short}</strong>
              ))}
              {board.teams.map((team, rowIndex) => (
                <div className="previous-row" key={team.id}>
                  <div>
                    <img src={`/${logoFolder}/${team.id.toLowerCase()}.png`} alt="" />
                    <span>{team.name}</span>
                  </div>
                  {board.categories.map((category, column) => {
                    const options = board.answers[team.id][column] ?? [];
                    const yours = cells[rowIndex * 3 + column];
                    const yoursOk = yours?.status === "correct";
                    return (
                      <article
                        key={category.short}
                        className={yours ? (yoursOk ? "yours-correct" : "yours-wrong") : undefined}
                      >
                        <b>{options[0] ?? "No answer"}</b>
                        <small>{options.length} accepted</small>
                        {yours && (
                          <span className="your-pick">
                            You: {yours.answer}
                            {yoursOk ? " ✓" : " ✕"}
                          </span>
                        )}
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="drawer-note">
              One accepted example is shown per square. Green/red marks how your locked pick compared.
            </p>
            <a href={`/${logoFolder}-grid/archive/`}>Open puzzle archive →</a>
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
