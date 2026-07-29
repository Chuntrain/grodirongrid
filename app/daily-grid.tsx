"use client";

import { useEffect, useMemo, useState } from "react";
import { buildShareText, renderShareImage, type ShareMode } from "./share-card";
import { dailyPuzzle, easternPuzzleDate, isValidPlayer, playerDatabase, playerOptions, teamLogo, validPlayers } from "./game-data";

type CellState = { answer: string; status: "correct" | "wrong" } | null;

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

export function DailyGrid({ date: requestedDate }: { date?: string } = {}) {
  const dateKey = useMemo(() => requestedDate || easternPuzzleDate(), [requestedDate]);
  const puzzle = useMemo(() => dailyPuzzle(dateKey), [dateKey]);
  const storageKey = `gridiron-grid:${dateKey}`;
  const [cells, setCells] = useState<CellState[]>(Array(9).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [playerCard, setPlayerCard] = useState("");
  const [message, setMessage] = useState("Drag a player from the right-side pool into a square.");
  const [streak, setStreak] = useState(0);
  const [showPrevious, setShowPrevious] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>("score");

  const previousPuzzle = useMemo(() => {
    const previous = new Date(`${dateKey}T12:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    return dailyPuzzle(previous.toISOString().slice(0, 10));
  }, [dateKey]);

  const playerDeck = useMemo(() => {
    const allPlayers = playerOptions(puzzle.teams.map((team) => team.id));
    let seed = [...dateKey].reduce((sum, character) => Math.imul(sum ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);
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
    puzzle.teams.forEach((team) => puzzle.categories.forEach((category) => {
      const candidate = shuffled.find((name) => !chosen.has(normalize(name)) && isValidPlayer(name, team.id, category.id));
      if (candidate) chosen.add(normalize(candidate));
    }));
    for (const candidate of shuffled) {
      if (chosen.size >= 9) break;
      chosen.add(normalize(candidate));
    }
    const namesByKey = new Map(allPlayers.map((name) => [normalize(name), name]));
    return shuffle([...chosen].map((key) => namesByKey.get(key)).filter((name): name is string => Boolean(name)));
  }, [dateKey, puzzle]);

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
    if (finished) setMessage("Grid submitted. The official answers will be published here tomorrow.");
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

  function placePlayer(index: number, player: string) {
    if (!player) return;
    if (cells.some((cell, cellIndex) => cellIndex !== index && normalize(cell?.answer ?? "") === normalize(player))) {
      setMessage("That player is already on your board. Choose a different name.");
      return;
    }
    const team = puzzle.teams[Math.floor(index / 3)];
    const category = puzzle.categories[index % 3];
    const valid = isValidPlayer(player, team.id, category.id);
    const next = [...cells];
    next[index] = { answer: player, status: valid ? "correct" : "wrong" };
    setCells(next);
    setMessage(valid ? "Touchdown! That player fits both clues. Tap the name to replace it." : "No match. Tap the name to remove or replace it.");
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
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "https://gridirongrid.org";

  function shareInput(mode: ShareMode) {
    return {
      mode,
      brand: "Gridiron Grid",
      puzzleNumber: puzzle.number,
      dateKey,
      score,
      streak,
      siteUrl,
      cells,
      teams: puzzle.teams.map((team) => team.shortName),
      categories: puzzle.categories.map((category) => category.shortLabel),
    };
  }

  function sharePayload(mode: ShareMode) {
    return buildShareText(shareInput(mode));
  }

  async function copyShare(mode: ShareMode) {
    await navigator.clipboard.writeText(sharePayload(mode));
    setMessage(
      mode === "blank"
        ? "Challenge card copied — paste on X, Facebook, LinkedIn, or Instagram."
        : mode === "answers"
          ? "Answer card copied (😊/😀 fuzzy marks + axes)."
          : "Viral score card copied — Am I right? style.",
    );
  }

  async function downloadShareImage(mode: ShareMode) {
    const blob = await renderShareImage(shareInput(mode));
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gridiron-grid-${dateKey}-${mode}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Share image downloaded (1080×1350, good for Instagram/Facebook).");
  }

  async function nativeShare(mode: ShareMode) {
    const text = sharePayload(mode);
    try {
      const blob = await renderShareImage(shareInput(mode));
      const file = new File([blob], `gridiron-grid-${mode}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Gridiron Grid", text, files: [file] });
        return;
      }
    } catch {
      // fall through to text-only share
    }
    if (navigator.share) {
      await navigator.share({ title: "Gridiron Grid", text });
      return;
    }
    await copyShare(mode);
  }

  return (
    <div className="game-shell">
      <div className="game-meta">
        <div><span>GRID #{String(puzzle.number).padStart(3, "0")}</span><span>{dateKey} · 8 PM ET</span></div>
        <div className="game-meta-actions">
          <button onClick={() => setShowPrevious(true)}>Yesterday&apos;s answers</button>
          <div className="score"><span>SCORE</span><strong>{score}<i>/9</i></strong></div>
        </div>
      </div>

      <div className="game-play-area">
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
                    aria-label={`${team.name} and ${puzzle.categories[columnIndex].label}${cell ? `: ${cell.answer}` : ""}`}
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
            <div><small>DAILY PLAYER POOL</small><strong>Drag a player</strong></div>
            <span>{playerDeck.length - cells.filter(Boolean).length} left</span>
          </div>
          <div className="pool-cards">
            {playerDeck.filter((name) => !cells.some((cell) => cell && normalize(cell.answer) === normalize(name))).map((name, index) => (
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
                <b>⠿</b>
              </button>
            ))}
          </div>
          <p>Desktop: drag and drop<br />Mobile: tap card, then square<br />Tap a placed name to remove it</p>
        </aside>
      </div>

      <div className="game-footer">
        <div><span>{message}</span><small>{9 - guesses} guesses left · {playerDatabase.length.toLocaleString()} qualifying players indexed</small></div>
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
                <p>Axes included. Fuzzy 😊/😀 marks. Viral “Am I right?” copy.</p>
              </div>
              <button onClick={() => setShowShare(false)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="share-mode-tabs" role="tablist">
              {(
                [
                  ["blank", "Blank challenge", "Teams + feats, empty board — dare them"],
                  ["score", "Am I right?", "Fuzzy 😊/😀 scoreboard · no hard spoilers"],
                  ["answers", "My picks", "Names + fuzzy marks · ask if you cooked"],
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

            <pre className="share-preview" aria-label="Share preview">
              {sharePayload(shareMode)}
            </pre>

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
            <p className="drawer-note">
              Tip: use <strong>Copy text</strong> for X and LinkedIn, <strong>Download image</strong> for Instagram and Facebook Stories/Posts.
            </p>
          </section>
        </div>
      )}

      {showPrevious && (
        <div className="answer-overlay" role="dialog" aria-modal="true" aria-label="Yesterday's answers">
          <button className="overlay-backdrop" onClick={() => setShowPrevious(false)} aria-label="Close answers" />
          <section className="answer-drawer">
            <div className="drawer-head">
              <div><small>GRID #{String(previousPuzzle.number).padStart(3, "0")}</small><h2>Yesterday&apos;s answers</h2><p>{previousPuzzle.dateKey}</p></div>
              <button onClick={() => setShowPrevious(false)} aria-label="Close">×</button>
            </div>
            <div className="previous-grid">
              <div />
              {previousPuzzle.categories.map((category) => <strong key={category.id}>{category.shortLabel}</strong>)}
              {previousPuzzle.teams.map((team) => (
                <div className="previous-row" key={team.id}>
                  <div><img src={teamLogo(team.id)} alt="" /><span>{team.shortName}</span></div>
                  {previousPuzzle.categories.map((category) => {
                    const options = validPlayers(team.id, category.id);
                    return <article key={category.id}><b>{options[0] ?? "No answer"}</b><small>{options.length} accepted</small></article>;
                  })}
                </div>
              ))}
            </div>
            <p className="drawer-note">One example is shown per square. The count includes every accepted answer currently in the database.</p>
            <a href="/archive/">Open puzzle archive →</a>
          </section>
        </div>
      )}
    </div>
  );
}
