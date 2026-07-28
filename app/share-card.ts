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
};

function statusEmoji(cell: ShareInput["cells"][number], mode: ShareMode): string {
  if (mode === "blank") return "⬜";
  if (!cell) return "⬜";
  return cell.status === "correct" ? "🟩" : "🟥";
}

function gridLines(cells: ShareInput["cells"], mode: ShareMode): string[] {
  const emojis = cells.map((cell) => statusEmoji(cell, mode));
  return [emojis.slice(0, 3).join(""), emojis.slice(3, 6).join(""), emojis.slice(6, 9).join("")];
}

export function buildShareText(input: ShareInput): string {
  const { mode, brand, puzzleNumber, dateKey, score, streak, siteUrl, cells } = input;
  const lines = gridLines(cells, mode);
  const header = `${brand} #${String(puzzleNumber).padStart(3, "0")} · ${dateKey}`;

  if (mode === "blank") {
    return [
      header,
      "Can you fill all 9 squares?",
      "",
      ...lines,
      "",
      "Play today's free grid ↓",
      siteUrl,
      "",
      "#NFL #GridironGrid #DailyTrivia",
    ].join("\n");
  }

  if (mode === "answers") {
    const picks = cells
      .map((cell, index) => {
        if (!cell) return `${index + 1}. —`;
        const mark = cell.status === "correct" ? "✓" : "×";
        return `${index + 1}. ${cell.answer} ${mark}`;
      })
      .join("\n");

    return [
      header,
      `My picks (${score}/9)`,
      "",
      ...lines,
      "",
      picks,
      "",
      `Play: ${siteUrl}`,
      `#GridironGrid #NFL`,
    ].join("\n");
  }

  return [
    header,
    `Score ${score}/9 · Streak ${streak} day${streak === 1 ? "" : "s"}`,
    "",
    ...lines,
    "",
    "Play today's puzzle ↓",
    siteUrl,
    "",
    "#GridironGrid #NFL #Wordle",
  ].join("\n");
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

  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = lime;
  ctx.fillRect(0, 0, width, 120);

  ctx.fillStyle = ink;
  ctx.font = "800 42px Barlow Condensed, Arial Black, sans-serif";
  ctx.fillText("GRIDIRON GRID", 48, 78);

  ctx.font = "600 28px Inter, Arial, sans-serif";
  ctx.fillStyle = "#2a3128";
  ctx.fillText(
    `#${String(input.puzzleNumber).padStart(3, "0")} · ${input.dateKey}`,
    48,
    170,
  );

  const title =
    input.mode === "blank"
      ? "Can you get 9/9?"
      : input.mode === "answers"
        ? `My picks · ${input.score}/9`
        : `Score ${input.score}/9 · Streak ${input.streak}`;

  ctx.font = "800 56px Barlow Condensed, Arial Black, sans-serif";
  ctx.fillStyle = paper;
  ctx.fillText(title, 48, 250);

  const square = 220;
  const startX = (width - square * 3 - 40) / 2;
  const startY = 320;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const cell = input.cells[index];
      const x = startX + col * (square + 20);
      const y = startY + row * (square + 20);

      ctx.fillStyle = paper;
      ctx.fillRect(x, y, square, square);

      if (input.mode === "blank") {
        ctx.fillStyle = "#b8b5aa";
        ctx.font = "700 72px Barlow Condensed, Arial, sans-serif";
        ctx.fillText(String(index + 1), x + 78, y + 138);
      } else {
        const color = !cell ? "#ddd9ce" : cell.status === "correct" ? "#6ecf85" : "#ef8a72";
        ctx.fillStyle = color;
        ctx.fillRect(x + 16, y + 16, square - 32, square - 32);
        ctx.fillStyle = ink;
        ctx.font = "800 64px Barlow Condensed, Arial, sans-serif";
        ctx.fillText(String(index + 1), x + 82, y + 132);
      }
    }
  }

  if (input.mode === "answers") {
    ctx.fillStyle = paper;
    ctx.font = "500 24px Inter, Arial, sans-serif";
    let y = startY + 3 * (square + 20) + 40;
    input.cells.forEach((cell, index) => {
      if (!cell) return;
      const mark = cell.status === "correct" ? "✓" : "×";
      const line = `${index + 1}. ${cell.answer} ${mark}`;
      ctx.fillText(line.length > 42 ? `${line.slice(0, 41)}…` : line, 48, y);
      y += 34;
    });
  }

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
