"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildShareText,
  scoreReaction,
  shareCardToClipboard,
  type ShareMode,
} from "./share-card";
import { ShareDonePanel } from "./share-done-panel";
import {
  dailyPuzzle,
  easternPuzzleDate,
  isValidPlayer,
  playerDatabase,
  playerOptions,
  teamLogo,
  validPlayers,
} from "./game-data";

type CellState = { answer: string; status: "correct" | "wrong" } | null;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function DailyGrid({ date: requestedDate }: { date?: string } = {}) {
  const dateKey = useMemo(() => requestedDate || easternPuzzleDate(), [requestedDate]);
  const puzzle = useMemo(() => dailyPuzzle(dateKey), [dateKey]);

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
  const [showShareDone, setShowShareDone] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>("score");
  const [shareBusy, setShareBusy] = useState(false);
  const [lastShareText, setLastShareText] = useState("");
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const [clipboardKind, setClipboardKind] = useState<"both" | "image" | "text">("image");

  const previousPuzzle = useMemo(() => {
    const previous = new Date(`${dateKey}T12:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    return dailyPuzzle(previous.toISOString().slice(0, 10));
  }, [dateKey]);

  const playerDeck = useMemo(() => {
    const allPlayers = playerOptions(puzzle.teams.map((team) => team.id));
    let seed = [...dateKey].reduce(
      (sum, character) => Math.imul(sum ^ character.charCodeAt(0), 16777619) >>> 0,
      2166136261,
    );
    const shuffle = (values: string[]) => {
      const copy = [...values];
      for (let index = copy.length - 1; index > 0; index--) {
        seed = Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0;
        const target = seed % (index + 1);
        [copy[index], copy[target]] = [copy[target], copy[index]];
      }
      return copy;
    };
    const shuffled = shuffle(allPlayers);
    const chosen = new Set<string>();
    puzzle.teams.forEach((team) =>
      puzzle.categories.forEach((category) => {
        const candidate = shuffled.find(
          (name) => !chosen.has(normalize(name)) && isValidPlayer(name, team.id, category.id),
        );
        if (candidate) chosen.add(normalize(candidate));
      }),
    );
    for (const candidate of shuffled) {
      if (chosen.size >= 9) break;
      chosen.add(normalize(candidate));
    }
    const namesByKey = new Map(allPlayers.map((name) => [normalize(name), name]));
    return shuffle(
      [...chosen].map((key) => namesByKey.get(key)).filter((name): name is string => Boolean(name)),
    );
  }, [dateKey, puzzle]);

  useEffect(() => {
    return () => {
      if (sharePreviewUrl) URL.revokeObjectURL(sharePreviewUrl);
    };
  }, [sharePreviewUrl]);

  const guesses = cells.filter(Boolean).length;
  const score = cells.filter((cell) => cell?.status === "correct").length;
  const finished = guesses === 9;
  const reaction = scoreReaction(score);
  // Session-only lock — refresh clears state and lets you play again.
  const boardLocked = revealed || answersUnlocked;

  useEffect(() => {
    if (finished && !boardLocked) {
      setMessage("Board locked. Hit Check the result for your score vibe — share to unlock answers.");
    }
  }, [finished, boardLocked]);

  function placePlayer(index: number, player: string) {
    if (!player || boardLocked) return;
    if (
      cells.some(
        (cell, cellIndex) =>
          cellIndex !== index && normalize(cell?.answer ?? "") === normalize(player),
      )
    ) {
      setMessage("That player is already on your board. Choose a different name.");
      return;
    }
    const team = puzzle.teams[Math.floor(index / 3)];
    const category = puzzle.categories[index % 3];
    const valid = isValidPlayer(player, team.id, category.id);
    const next = [...cells];
    next[index] = { answer: player, status: valid ? "correct" : "wrong" };
    setCells(next);
    setMessage(`${player} locked in square ${index + 1}. No spoilers until you share.`);
    setPlayerCard("");
    setSelected(null);
  }

  function handleCellClick(index: number) {
    if (boardLocked) return;
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
      if (score === 9) setStreak((value) => value + 1);
    }
  }

  function unlockAnswers() {
    setRevealed(true);
    setAnswersUnlocked(true);
    if (score === 9 && !revealed) setStreak((value) => value + 1);
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
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "https://gridirongrid.org";

  function shareInput(mode: ShareMode) {
    return {
      mode,
      brand: "Gridiron Grid",
      puzzleNumber: puzzle.number,
      dateKey,
      score: boardLocked || finished ? score : 0,
      streak,
      siteUrl,
      cells,
      teams: puzzle.teams.map((team) => team.shortName),
      categories: puzzle.categories.map((category) => category.shortLabel),
      pool: playerDeck,
    };
  }

  async function oneClickShare(mode: ShareMode) {
    setShareBusy(true);
    try {
      const input = shareInput(mode);
      const result = await shareCardToClipboard(input);
      unlockAnswers();
      if (sharePreviewUrl) URL.revokeObjectURL(sharePreviewUrl);
      setSharePreviewUrl(result.previewUrl);
      setClipboardKind(result.kind);
      setLastShareText(result.text);
      setShowShare(false);
      setShowShareDone(true);
      setMessage(
        result.kind === "text"
          ? "Card ready — download the image to share (clipboard image blocked)."
          : "Share card image added to clipboard. Paste it into your app.",
      );
    } catch {
      setMessage("Share failed — try again or allow clipboard access.");
    } finally {
      setShareBusy(false);
    }
  }

  async function shareAndGetAnswer() {
    const mode: ShareMode = finished || boardLocked ? "score" : "blank";
    await oneClickShare(mode);
  }

  return (
    <div className="game-shell">
      <div className="game-meta">
        <div>
          <span>GRID #{String(puzzle.number).padStart(3, "0")}</span>
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
        <div className="board" role="grid" aria-label="Daily NFL player grid">
          <div className="corner">
            <span>TEAM</span>
            <b>×</b>
            <span>FEAT</span>
          </div>
          {puzzle.categories.map((category) => (
            <div className="column-clue" key={category.id} title={category.description}>
              <span>{category.shortLabel}</span>
              <small>{category.description}</small>
            </div>
          ))}
          {puzzle.teams.map((team, rowIndex) => (
            <div className="board-row" key={team.id}>
              <div
                className="row-clue"
                style={{ "--team": team.color, "--accent": team.accent } as React.CSSProperties}
              >
                <img src={teamLogo(team.id)} alt={`${team.name} logo`} width="52" height="52" />
                <span>{team.shortName}</span>
              </div>
              {[0, 1, 2].map((columnIndex) => {
                const index = rowIndex * 3 + columnIndex;
                const cell = cells[index];
                return (
                  <button
                    key={index}
                    className={`cell drop-cell ${selected === index ? "selected" : ""} ${playerCard ? "drop-ready" : ""} ${cell ? "filled-locked" : ""} ${boardLocked && cell ? cell.status : ""}`}
                    onClick={() => handleCellClick(index)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      placePlayer(index, event.dataTransfer.getData("text/plain") || playerCard);
                    }}
                    aria-label={`${team.name} and ${puzzle.categories[columnIndex].label}${cell ? `: ${cell.answer}` : ""}`}
                  >
                    {cell ? (
                      <>
                        <b className="cell-slot-number muted">{index + 1}</b>
                        <small>{cell.answer}</small>
                        {!boardLocked && <em>TAP TO SWAP</em>}
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
            <span>{playerDeck.length - cells.filter(Boolean).length} left</span>
          </div>
          <div className="pool-cards">
            {playerDeck
              .filter((name) => !cells.some((cell) => cell && normalize(cell.answer) === normalize(name)))
              .map((name, index) => (
                <button
                  key={name}
                  className={`pool-card ${playerCard === name ? "picked" : ""}`}
                  draggable={!boardLocked}
                  onDragStart={(event) => {
                    if (boardLocked) return;
                    setPlayerCard(name);
                    event.dataTransfer.setData("text/plain", name);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => {
                    if (boardLocked) return;
                    setPlayerCard(name);
                    setMessage(`${name} selected. Tap an empty square to lock it in.`);
                  }}
                  aria-label={`${name}. Drag to a grid square.`}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{name}</strong>
                  <b>⠿</b>
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

      {finished && !boardLocked && (
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

      {boardLocked && (
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
                ? "Answers unlocked for this session. Refresh to play again."
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
            {9 - guesses} open squares · {playerDatabase.length.toLocaleString()} players indexed
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
                <p>Copies the card image (with player pool names) and a play link — then unlocks answers.</p>
              </div>
              <button onClick={() => setShowShare(false)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="share-mode-tabs" role="tablist">
              {(
                [
                  ["blank", "Blank challenge", "Axes + player pool — dare your friends"],
                  ["score", "My score vibe", revealed ? `${reaction.emoji} ${score}/9 · Am I right?` : "Check the result first for your vibe"],
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

            <div className="share-actions single">
              <button
                type="button"
                className="primary"
                disabled={shareBusy || (shareMode === "score" && !revealed)}
                onClick={() => oneClickShare(shareMode === "score" && !revealed ? "blank" : shareMode)}
              >
                {shareBusy ? "Preparing…" : "Copy card + link"}
              </button>
            </div>
            <p className="drawer-note">
              Shared card shows your locked player names and today&apos;s 9-player pool. No text table — paste the image.
            </p>
          </section>
        </div>
      )}

      {showShareDone && (
        <ShareDonePanel
          siteUrl={siteUrl}
          shareText={lastShareText || buildShareText(shareInput(finished || boardLocked ? "score" : "blank"))}
          previewUrl={sharePreviewUrl}
          clipboardKind={clipboardKind}
          onClose={() => setShowShareDone(false)}
          onViewAnswers={() => {
            setShowShareDone(false);
            setShowAnswers(true);
          }}
        />
      )}

      {showAnswers && (
        <div className="answer-overlay" role="dialog" aria-modal="true" aria-label="Today's answers">
          <button className="overlay-backdrop" onClick={() => setShowAnswers(false)} aria-label="Close answers" />
          <section className="answer-drawer">
            <div className="drawer-head">
              <div>
                <small>GRID #{String(puzzle.number).padStart(3, "0")}</small>
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
              {puzzle.categories.map((category) => (
                <strong key={category.id}>{category.shortLabel}</strong>
              ))}
              {puzzle.teams.map((team, rowIndex) => (
                <div className="previous-row" key={team.id}>
                  <div>
                    <img src={teamLogo(team.id)} alt="" />
                    <span>{team.shortName}</span>
                  </div>
                  {puzzle.categories.map((category, columnIndex) => {
                    const options = validPlayers(team.id, category.id);
                    const yours = cells[rowIndex * 3 + columnIndex];
                    const yoursOk = yours?.status === "correct";
                    return (
                      <article
                        key={category.id}
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
            <a href="/archive/">Open puzzle archive →</a>
          </section>
        </div>
      )}

      {showPrevious && (
        <div className="answer-overlay" role="dialog" aria-modal="true" aria-label="Yesterday's answers">
          <button className="overlay-backdrop" onClick={() => setShowPrevious(false)} aria-label="Close answers" />
          <section className="answer-drawer">
            <div className="drawer-head">
              <div>
                <small>GRID #{String(previousPuzzle.number).padStart(3, "0")}</small>
                <h2>Yesterday&apos;s answers</h2>
                <p>{previousPuzzle.dateKey}</p>
              </div>
              <button onClick={() => setShowPrevious(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="previous-grid">
              <div />
              {previousPuzzle.categories.map((category) => (
                <strong key={category.id}>{category.shortLabel}</strong>
              ))}
              {previousPuzzle.teams.map((team) => (
                <div className="previous-row" key={team.id}>
                  <div>
                    <img src={teamLogo(team.id)} alt="" />
                    <span>{team.shortName}</span>
                  </div>
                  {previousPuzzle.categories.map((category) => {
                    const options = validPlayers(team.id, category.id);
                    return (
                      <article key={category.id}>
                        <b>{options[0] ?? "No answer"}</b>
                        <small>{options.length} accepted</small>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="drawer-note">
              One example is shown per square. The count includes every accepted answer currently in the database.
            </p>
            <a href="/archive/">Open puzzle archive →</a>
          </section>
        </div>
      )}
    </div>
  );
}
