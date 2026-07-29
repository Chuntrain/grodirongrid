export type ShareMode = "blank" | "score" | "answers";

export type ShareAxis = {
  teams: string[];
  categories: string[];
};

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

/** Fuzzy result marks — both look "happy" so the board stays spoiler-light. */
function statusEmoji(cell: ShareInput["cells"][number], mode: ShareMode): string {
  if (mode === "blank" || !cell) return "⬜";
  return cell.status === "correct" ? "😊" : "😀";
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
      .map((col) => statusEmoji(cells[row * 3 + col], mode))
      .join("");
    lines.push(`${shortLabel(teams[row], 7).padEnd(8)}${rowEmojis}`);
  }
  return lines;
}

function viralHook(mode: ShareMode, score: number): string {
  if (mode === "blank") {
    const hooks = [
      "Can you beat today's Gridiron Grid?",
      "I dare you to fill all 9 👀",
      "Think you know NFL better than me?",
    ];
    return hooks[score % hooks.length];
  }
  if (mode === "answers") {
    const hooks = [
      "Am I right though?? Be honest 👀",
      "Did I cook… or am I cooked?",
      "No spoilers — just tell me if I cooked.",
      "Rate my picks. Am I delusional?",
    ];
    return hooks[score % hooks.length];
  }
  const hooks = [
    "Am I right?? Don't spoil it 👀",
    "Did I cook or what 👀",
    "Be honest… how cooked am I?",
    "Guess my score. No cheating.",
  ];
  return hooks[score % hooks.length];
}

export function buildShareText(input: ShareInput): string {
  const { mode, brand, puzzleNumber, dateKey, score, streak, siteUrl, cells, teams, categories } =
    input;
  const board = gridLinesWithAxes(input);
  const header = `${brand} #${String(puzzleNumber).padStart(3, "0")} · ${dateKey}`;
  const hook = viralHook(mode, score);

  if (mode === "blank") {
    return [
      header,
      hook,
      "",
      "Teams ↓ / feats →",
      ...board,
      "",
      "Drop your board in the comments 👇",
      siteUrl,
      "",
      "#NFL #GridironGrid #DailyTrivia",
    ].join("\n");
  }

  if (mode === "answers") {
    const picks = cells
      .map((cell, index) => {
        if (!cell) return `${index + 1}. —`;
        const mark = cell.status === "correct" ? "😊" : "😀";
        const team = teams[Math.floor(index / 3)];
        const feat = categories[index % 3];
        return `${index + 1}. ${team} × ${feat}: ${cell.answer} ${mark}`;
      })
      .join("\n");

    return [
      header,
      hook,
      "",
      "Teams ↓ / feats →",
      ...board,
      "",
      picks,
      "",
      `Think you can do better? ${siteUrl}`,
      "#GridironGrid #NFL #AmIRight",
    ].join("\n");
  }

  return [
    header,
    hook,
    streak > 0 ? `Streak: ${streak} day${streak === 1 ? "" : "s"} 🔥` : "First day on the board 👀",
    "",
    "Teams ↓ / feats →",
    ...board,
    "",
    "😊 / 😀 = my tries (you figure it out)",
    "",
    `Play today's free grid → ${siteUrl}`,
    "#GridironGrid #NFL #AmIRight",
  ].join("\n");
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
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
  ctx.font = "800 48px Barlow Condensed, Arial Black, sans-serif";
  const hookLines = wrapText(ctx, hook, width - 96);
  hookLines.forEach((line, index) => {
    ctx.fillText(line, 48, 230 + index * 54);
  });

  const labelCol = 170;
  const square = 190;
  const gap = 16;
  const boardW = labelCol + square * 3 + gap * 2;
  const startX = (width - boardW) / 2;
  const startY = 230 + hookLines.length * 54 + 36;

  // Column headers (feats / categories)
  ctx.fillStyle = cream;
  ctx.fillRect(startX + labelCol, startY, square * 3 + gap * 2, 78);
  ctx.fillStyle = ink;
  ctx.font = "800 22px Barlow Condensed, Arial Black, sans-serif";
  input.categories.forEach((category, col) => {
    const x = startX + labelCol + col * (square + gap);
    const label = shortLabel(category, 12);
    const textWidth = ctx.measureText(label).width;
    ctx.fillText(label, x + (square - textWidth) / 2, startY + 48);
  });

  // Corner label
  ctx.fillStyle = "#2a3128";
  ctx.fillRect(startX, startY, labelCol - 12, 78);
  ctx.fillStyle = lime;
  ctx.font = "700 18px Inter, Arial, sans-serif";
  ctx.fillText("TEAM × FEAT", startX + 18, startY + 46);

  for (let row = 0; row < 3; row++) {
    const y = startY + 78 + 12 + row * (square + gap);

    // Row header (team)
    ctx.fillStyle = cream;
    ctx.fillRect(startX, y, labelCol - 12, square);
    ctx.fillStyle = ink;
    ctx.font = "800 26px Barlow Condensed, Arial Black, sans-serif";
    const team = shortLabel(input.teams[row], 10);
    const teamWidth = ctx.measureText(team).width;
    ctx.fillText(team, startX + (labelCol - 12 - teamWidth) / 2, y + square / 2 + 8);

    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const cell = input.cells[index];
      const x = startX + labelCol + col * (square + gap);

      ctx.fillStyle = paper;
      ctx.fillRect(x, y, square, square);

      if (input.mode === "blank") {
        ctx.fillStyle = "#b8b5aa";
        ctx.font = "700 64px Barlow Condensed, Arial, sans-serif";
        const num = String(index + 1);
        const numW = ctx.measureText(num).width;
        ctx.fillText(num, x + (square - numW) / 2, y + square / 2 + 22);
      } else {
        // Soft tint — not hard green/red spoilers
        ctx.fillStyle = !cell ? "#ddd9ce" : cell.status === "correct" ? "#e8f5c8" : "#f3ead8";
        ctx.fillRect(x + 12, y + 12, square - 24, square - 24);

        ctx.font = "64px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
        const emoji = statusEmoji(cell, input.mode);
        const emojiW = ctx.measureText(emoji).width;
        ctx.fillText(emoji, x + (square - emojiW) / 2, y + square / 2 + 18);

        if (input.mode === "answers" && cell) {
          ctx.fillStyle = ink;
          ctx.font = "700 18px Inter, Arial, sans-serif";
          const name =
            cell.answer.length > 14 ? `${cell.answer.slice(0, 13)}…` : cell.answer;
          const nameW = ctx.measureText(name).width;
          ctx.fillText(name, x + (square - nameW) / 2, y + square - 22);
        } else {
          ctx.fillStyle = "#5a5f56";
          ctx.font = "700 20px Barlow Condensed, Arial, sans-serif";
          const num = String(index + 1);
          const numW = ctx.measureText(num).width;
          ctx.fillText(num, x + (square - numW) / 2, y + 40);
        }
      }
    }
  }

  ctx.fillStyle = "#aeb5ab";
  ctx.font = "500 22px Inter, Arial, sans-serif";
  ctx.fillText("😊 / 😀 = my tries · you decide if I cooked", 48, height - 170);

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
