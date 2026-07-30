export type ShareMode = "blank" | "score" | "answers";

export type ShareInput = {
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
  /** Today's nine selectable player names for the share card. */
  pool?: string[];
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

function shortLabel(value: string, max = 10): string {
  const cleaned = value.trim();
  if (cleaned.length <= max) return cleaned.toUpperCase();
  return `${cleaned.slice(0, max - 1).toUpperCase()}…`;
}

function viralHook(mode: ShareMode, score: number): string {
  const reaction = scoreReaction(score);
  if (mode === "blank") {
    return "Can you place all 9?";
  }
  return `I got ${score}/9 ${reaction.emoji} — beat me?`;
}

/** Short clipboard/social text — no emoji table (the image is the board). */
export function buildShareText(input: ShareInput): string {
  const { mode, brand, puzzleNumber, dateKey, score, siteUrl } = input;
  const header = `${brand} #${String(puzzleNumber).padStart(3, "0")} · ${dateKey}`;
  const hook = viralHook(mode === "answers" ? "score" : mode, score);
  return [header, hook, `Play free → ${siteUrl}`, "#GridironGrid"].join("\n");
}

export type SocialTarget = {
  id: string;
  label: string;
  href: string;
};

/** Deep links to open native share sheets / compose windows. */
export function socialShareTargets(text: string, url: string): SocialTarget[] {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const combined = encodeURIComponent(`${text}\n${url}`);
  return [
    {
      id: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${combined}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      id: "reddit",
      label: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    },
  ];
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

function drawWrappedName(
  ctx: CanvasRenderingContext2D,
  name: string,
  cx: number,
  cy: number,
  maxWidth: number,
) {
  const words = name.toUpperCase().split(/\s+/);
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
  const shown = lines.slice(0, 2);
  if (lines.length > 2) {
    shown[1] = `${shown[1].slice(0, Math.max(1, shown[1].length - 1))}…`;
  }
  const lineHeight = 20;
  const startY = cy - ((shown.length - 1) * lineHeight) / 2;
  shown.forEach((line, index) => {
    const w = ctx.measureText(line).width;
    ctx.fillText(line, cx - w / 2, startY + index * lineHeight);
  });
}

export async function renderShareImage(input: ShareInput): Promise<Blob> {
  const width = 1080;
  const height = 1480;
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
  const mode = input.mode === "answers" ? "score" : input.mode;
  const pool = (input.pool ?? []).slice(0, 9);

  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = lime;
  ctx.fillRect(0, 0, width, 110);

  ctx.fillStyle = ink;
  ctx.font = "800 40px Barlow Condensed, Arial Black, sans-serif";
  ctx.fillText(input.brand.toUpperCase(), 48, 72);

  ctx.font = "600 24px Inter, Arial, sans-serif";
  ctx.fillStyle = "#c8cec5";
  ctx.fillText(`#${String(input.puzzleNumber).padStart(3, "0")} · ${input.dateKey}`, 48, 158);

  const hook = viralHook(mode, input.score);
  ctx.fillStyle = paper;
  ctx.font = "800 42px Barlow Condensed, Arial Black, sans-serif";
  const hookLines = wrapText(ctx, hook, width - 96);
  hookLines.forEach((line, index) => {
    ctx.fillText(line, 48, 215 + index * 46);
  });

  let cursorY = 215 + hookLines.length * 46 + 18;
  if (mode !== "blank") {
    ctx.font = "64px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
    ctx.fillText(reaction.emoji, 48, cursorY + 52);
    ctx.fillStyle = lime;
    ctx.font = "800 36px Barlow Condensed, Arial Black, sans-serif";
    ctx.fillText(`${input.score}/9 · ${reaction.label.toUpperCase()}`, 130, cursorY + 42);
    cursorY += 78;
  }

  const labelCol = 160;
  const square = 168;
  const gap = 12;
  const boardW = labelCol + square * 3 + gap * 2;
  const startX = (width - boardW) / 2;
  const startY = cursorY;

  ctx.fillStyle = cream;
  ctx.fillRect(startX + labelCol, startY, square * 3 + gap * 2, 64);
  ctx.fillStyle = ink;
  ctx.font = "800 18px Barlow Condensed, Arial Black, sans-serif";
  input.categories.forEach((category, col) => {
    const x = startX + labelCol + col * (square + gap);
    const label = shortLabel(category, 12);
    const textWidth = ctx.measureText(label).width;
    ctx.fillText(label, x + (square - textWidth) / 2, startY + 40);
  });

  ctx.fillStyle = "#2a3128";
  ctx.fillRect(startX, startY, labelCol - 12, 64);
  ctx.fillStyle = lime;
  ctx.font = "700 15px Inter, Arial, sans-serif";
  ctx.fillText("TEAM × FEAT", startX + 16, startY + 38);

  for (let row = 0; row < 3; row++) {
    const y = startY + 64 + 10 + row * (square + gap);

    ctx.fillStyle = cream;
    ctx.fillRect(startX, y, labelCol - 12, square);
    ctx.fillStyle = ink;
    ctx.font = "800 22px Barlow Condensed, Arial Black, sans-serif";
    const team = shortLabel(input.teams[row], 10);
    const teamWidth = ctx.measureText(team).width;
    ctx.fillText(team, startX + (labelCol - 12 - teamWidth) / 2, y + square / 2 + 8);

    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const cell = input.cells[index];
      const x = startX + labelCol + col * (square + gap);

      ctx.fillStyle = paper;
      ctx.fillRect(x, y, square, square);

      if (!cell) {
        ctx.fillStyle = "#b8b5aa";
        ctx.font = "700 52px Barlow Condensed, Arial, sans-serif";
        const num = String(index + 1);
        const numW = ctx.measureText(num).width;
        ctx.fillText(num, x + (square - numW) / 2, y + square / 2 + 18);
      } else {
        ctx.fillStyle = "#f0e3a8";
        ctx.fillRect(x + 10, y + 10, square - 20, square - 20);
        ctx.fillStyle = ink;
        ctx.font = "800 17px Barlow Condensed, Arial Black, sans-serif";
        drawWrappedName(ctx, cell.answer, x + square / 2, y + square / 2 + 4, square - 28);
      }
    }
  }

  const boardBottom = startY + 64 + 10 + 3 * (square + gap);
  let poolY = boardBottom + 28;

  if (pool.length > 0) {
    ctx.fillStyle = lime;
    ctx.font = "800 26px Barlow Condensed, Arial Black, sans-serif";
    ctx.fillText("PLAYER POOL — PICK FROM THESE 9", 48, poolY);
    poolY += 28;

    ctx.font = "700 22px Inter, Arial, sans-serif";
    const colW = (width - 96) / 3;
    pool.forEach((name, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 48 + col * colW;
      const y = poolY + row * 36;
      ctx.fillStyle = cream;
      ctx.fillRect(x, y, colW - 12, 30);
      ctx.fillStyle = ink;
      const label = `${index + 1}. ${shortLabel(name, 14)}`;
      ctx.fillText(label, x + 10, y + 21);
    });
    poolY += 3 * 36 + 16;
  }

  ctx.fillStyle = "#aeb5ab";
  ctx.font = "500 20px Inter, Arial, sans-serif";
  ctx.fillText("Paste this card · play free at the link", 48, height - 160);

  ctx.fillStyle = field;
  ctx.fillRect(0, height - 130, width, 130);
  ctx.fillStyle = lime;
  ctx.font = "800 32px Barlow Condensed, Arial Black, sans-serif";
  ctx.fillText("PLAY FREE DAILY · gridirongrid.org", 48, height - 68);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export image"));
    }, "image/png");
  });
}

/** Build the share card and try to put the IMAGE on the clipboard. */
export async function shareCardToClipboard(
  input: ShareInput,
  _filePrefix?: string,
): Promise<{ kind: "both" | "image" | "text"; blob: Blob; text: string; previewUrl: string }> {
  const safeInput: ShareInput =
    input.mode === "answers" ? { ...input, mode: "score" } : input;
  const text = buildShareText(safeInput);
  const blob = await renderShareImage(safeInput);
  const previewUrl = URL.createObjectURL(blob);

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    // Prefer image-only first — mixed text+image often fails and drops the picture.
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": Promise.resolve(blob),
        }),
      ]);
      return { kind: "image", blob, text, previewUrl };
    } catch {
      // Fall through.
    }
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return { kind: "both", blob, text, previewUrl };
    } catch {
      // Fall through.
    }
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard blocked — caller still has the preview/download.
  }
  return { kind: "text", blob, text, previewUrl };
}

/** Try the OS share sheet with the card image attached (mobile / supported browsers). */
export async function shareCardNative(input: {
  blob: Blob;
  text: string;
  url: string;
  title?: string;
}): Promise<boolean> {
  const file = new File([input.blob], "gridiron-grid-share.png", { type: "image/png" });
  const payload: ShareData = {
    files: [file],
    text: input.text,
    url: input.url,
    title: input.title ?? "Gridiron Grid",
  };
  if (typeof navigator.share !== "function") return false;
  if (navigator.canShare && !navigator.canShare(payload)) {
    // Retry without files if the browser rejects image shares.
    try {
      await navigator.share({ text: input.text, url: input.url, title: payload.title });
      return true;
    } catch {
      return false;
    }
  }
  try {
    await navigator.share(payload);
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Use shareCardToClipboard — kept for any stale imports. */
export async function shareToClipboardAndDownload(
  input: ShareInput,
  filePrefix: string,
): Promise<void> {
  await shareCardToClipboard(input, filePrefix);
}
