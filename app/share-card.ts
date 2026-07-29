export type ShareMode = "blank" | "score" | "answers";

type ShareInput = {
  mode: ShareMode;
  brand: string;
  puzzleNumber: number;
  dateKey: string;
  score: number;
  streak: number;
  siteUrl: string;
  cells: ({ answer: string; status: "correct" | "wrong" } | null)[];
  teams: string[];
  categories: string[];
};

/** 5 reaction tiers by score percent (out of 9). */
export function scoreReaction(score: number, total = 9): {
  emoji: string;
  label: string;
  percent: number;
} {
  const percent = Math.round((score / total) * 100);
  if (percent <= 20) return { emoji: "😭", label: "Rough day", percent };
  if (percent <= 40) return { emoji: "😕", label: "Not smiling", percent };
  if (percent <= 60) return { emoji: "😐", label: "Mid board", percent };
  if (percent <= 80) return { emoji: "🙂", label: "Solid", percent };
  return { emoji: "😄", label: "Cooking", percent };
}

/** Board cells never spoil right/wrong — filled vs empty only. */
function cellMark(cell: ShareInput["cells"][number], mode: ShareMode): string {
  if (mode === "blank") return "⬜";
  return cell ? "🟨" : "⬜";
}

function shortLabel(value: string, max = 10): string {
  const cleaned = value.trim();
  if (cleaned.length <= max) return cleaned.toUpperCase();
  return `${cleaned.slice(0, max - 1).toUpperCase()}…`;
}

function axisHeader(categories: string[]): string {
  return `      ${categories.map((category) => shortLabel(category, 8)).join("  ")}`;
}

function gridLinesWithAxes(input: ShareInput): string[] {
  const { cells, mode, teams, categories } = input;
  const lines = [axisHeader(categories)];
  for (let row = 0; row < 3; row++) {
    const rowEmojis = [0, 1, 2]
      .map((col) => cellMark(cells[row * 3 + col], mode))
      .join("");
    lines.push(`${shortLabel(teams[row], 7).padEnd(8)}${rowEmojis}`);
  }
  return lines;
}

function viralHook(mode: ShareMode, score: number): string {
  const reaction = scoreReaction(score);
  if (mode === "blank") {
    return "Can you fill all 9 before answers drop tomorrow?";
  }
  if (mode === "answers") {
    return `My locked picks ${reaction.emoji} — am I right?? Answers tomorrow.`;
  }
  return `I got ${score}/9 ${reaction.emoji} — am I right though?? Official answers drop tomorrow.`;
}

export function buildShareText(input: ShareInput): string {
  const { mode, brand, puzzleNumber, dateKey, score, streak, siteUrl, cells, teams, categories } =
    input;
  const board = gridLinesWithAxes(input);
  const header = `${brand} #${String(puzzleNumber).padStart(3, "0")} · ${dateKey}`;
  const hook = viralHook(mode, score);
  const reaction = scoreReaction(score);

  if (mode === "blank") {
    return [
      header,
      hook,
      "",
      "Teams ↓ / feats →",
      ...board,
      "",
      "Play free → drop your score in the comments",
      siteUrl,
      "",
      "#GridironGrid #DailyTrivia #AmIRight",
    ].join("\n");
  }

  if (mode === "answers") {
    const picks = cells
      .map((cell, index) => {
        if (!cell) return `${index + 1}. —`;
        const team = teams[Math.floor(index / 3)];
        const feat = categories[index % 3];
        return `${index + 1}. ${team} × ${feat}: ${cell.answer}`;
      })
      .join("\n");

    return [
      header,
      hook,
      `Reaction: ${reaction.emoji} ${reaction.label} (${score}/9)`,
      "",
      "Teams ↓ / feats →",
      ...board,
      "",
      "My locked picks (no spoilers — check tomorrow):",
      picks,
      "",
      `Play: ${siteUrl}`,
      "#GridironGrid #AmIRight",
    ].join("\n");
  }

  return [
    header,
    hook,
    streak > 0 ? `Streak: ${streak} day${streak === 1 ? "" : "s"} 🔥` : "",
    "",
    "Teams ↓ / feats →",
    ...board,
    "",
    `Score vibe: ${reaction.emoji} ${reaction.label}`,
    "🟨 = locked picks · official answers tomorrow",
    "",
    `Play free → ${siteUrl}`,
    "#GridironGrid #AmIRight",
  ]
    .filter((line, index, arr) => line !== "" || arr[index - 1] !== "")
    .join("\n");
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderShareImage(input: ShareInput): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const lime = "#D4FF39";
  const ink = "#10140F";
  const paper = "#F3F0E7";
  const field = "#153F2D";
  const cream = "#E9E3D3";
  const reaction = scoreReaction(input.score);

  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = lime;
  ctx.fillRect(0, 0, width, 120);

  ctx.fillStyle = ink;
  ctx.font = "800 42px Barlow Condensed, Arial Black, sans-serif";
  ctx.fillText("GRIDIRON GRID", 48, 78);

  ctx.font = "600 26px Inter, Arial, sans-serif";
  ctx.fillStyle = "#c8cec5";
  ctx.fillText(`#${String(input.puzzleNumber).padStart(3, "0")} · ${input.dateKey}`, 48, 168);

  const hook = viralHook(input.mode, input.score);
  ctx.fillStyle = paper;
  ctx.font = "800 44px Barlow Condensed, Arial Black, sans-serif";
  const hookLines = wrapText(ctx, hook, width - 96);
  hookLines.forEach((line, index) => {
    ctx.fillText(line, 48, 230 + index * 50);
  });

  // Big reaction badge for score modes
  if (input.mode !== "blank") {
    const badgeY = 230 + hookLines.length * 50 + 10;
    ctx.font = "72px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
    ctx.fillText(reaction.emoji, 48, badgeY + 60);
    ctx.fillStyle = lime;
    ctx.font = "800 40px Barlow Condensed, Arial Black, sans-serif";
    ctx.fillText(`${input.score}/9 · ${reaction.label.toUpperCase()}`, 140, badgeY + 48);
  }

  const labelCol = 170;
  const square = 180;
  const gap = 14;
  const boardW = labelCol + square * 3 + gap * 2;
  const startX = (width - boardW) / 2;
  const startY =
    input.mode === "blank"
      ? 230 + hookLines.length * 50 + 28
      : 230 + hookLines.length * 50 + 100;

  ctx.fillStyle = cream;
  ctx.fillRect(startX + labelCol, startY, square * 3 + gap * 2, 72);
  ctx.fillStyle = ink;
  ctx.font = "800 20px Barlow Condensed, Arial Black, sans-serif";
  input.categories.forEach((category, col) => {
    const x = startX + labelCol + col * (square + gap);
    const label = shortLabel(category, 12);
    const textWidth = ctx.measureText(label).width;
    ctx.fillText(label, x + (square - textWidth) / 2, startY + 44);
  });

  ctx.fillStyle = "#2a3128";
  ctx.fillRect(startX, startY, labelCol - 12, 72);
  ctx.fillStyle = lime;
  ctx.font = "700 16px Inter, Arial, sans-serif";
  ctx.fillText("TEAM × FEAT", startX + 18, startY + 42);

  for (let row = 0; row < 3; row++) {
    const y = startY + 72 + 12 + row * (square + gap);

    ctx.fillStyle = cream;
    ctx.fillRect(startX, y, labelCol - 12, square);
    ctx.fillStyle = ink;
    ctx.font = "800 24px Barlow Condensed, Arial Black, sans-serif";
    const team = shortLabel(input.teams[row], 10);
    const teamWidth = ctx.measureText(team).width;
    ctx.fillText(team, startX + (labelCol - 12 - teamWidth) / 2, y + square / 2 + 8);

    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const cell = input.cells[index];
      const x = startX + labelCol + col * (square + gap);

      ctx.fillStyle = paper;
      ctx.fillRect(x, y, square, square);

      if (input.mode === "blank" || !cell) {
        ctx.fillStyle = "#b8b5aa";
        ctx.font = "700 56px Barlow Condensed, Arial, sans-serif";
        const num = String(index + 1);
        const numW = ctx.measureText(num).width;
        ctx.fillText(num, x + (square - numW) / 2, y + square / 2 + 18);
      } else {
        ctx.fillStyle = "#f0e3a8";
        ctx.fillRect(x + 12, y + 12, square - 24, square - 24);
        ctx.fillStyle = ink;
        ctx.font = "700 18px Inter, Arial, sans-serif";
        const name =
          input.mode === "answers"
            ? cell.answer.length > 14
              ? `${cell.answer.slice(0, 13)}…`
              : cell.answer
            : `PICK ${index + 1}`;
        const nameW = ctx.measureText(name).width;
        ctx.fillText(name, x + (square - nameW) / 2, y + square / 2 + 6);
      }
    }
  }

  ctx.fillStyle = "#aeb5ab";
  ctx.font = "500 22px Inter, Arial, sans-serif";
  ctx.fillText("Official answers drop tomorrow · no spoilers", 48, height - 170);

  ctx.fillStyle = field;
  ctx.fillRect(0, height - 140, width, 140);
  ctx.fillStyle = lime;
  ctx.font = "800 34px Barlow Condensed, Arial Black, sans-serif";
  ctx.fillText("PLAY FREE DAILY · gridirongrid.org", 48, height - 72);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export image"));
    }, "image/png");
  });
}

export async function shareToClipboardAndDownload(
  input: ShareInput,
  filePrefix: string,
): Promise<void> {
  const text = buildShareText(input);
  await navigator.clipboard.writeText(text);
  const blob = await renderShareImage(input);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filePrefix}-${input.mode}.png`;
  anchor.click();
  URL.revokeObjectURL(url);
}
