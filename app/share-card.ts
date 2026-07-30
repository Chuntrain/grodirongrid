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
  /** Absolute or same-origin URLs for each row team logo (drawn on the card). */
  teamLogos?: string[];
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

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    img.onload = () => {
      if (typeof img.decode === "function") {
        img
          .decode()
          .then(() => done(img))
          .catch(() => done(img.naturalWidth > 0 ? img : null));
      } else {
        done(img);
      }
    };
    img.onerror = () => done(null);
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      done(img);
    }
  });
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  box: number,
) {
  const scale = Math.min(box / img.width, box / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, x + (box - w) / 2, y + (box - h) / 2, w, h);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  const pushBrokenWord = (word: string) => {
    let chunk = "";
    for (const ch of word) {
      const next = chunk + ch;
      if (ctx.measureText(next).width > maxWidth && chunk) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk = next;
      }
    }
    if (chunk) current = chunk;
  };

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = "";
      if (ctx.measureText(word).width > maxWidth) {
        pushBrokenWord(word);
      } else {
        current = word;
      }
    } else if (ctx.measureText(next).width > maxWidth) {
      pushBrokenWord(word);
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Centered multi-line label — keeps every line of the source text (no ellipsis). */
function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  cx: number,
  cy: number,
  lineHeight: number,
) {
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    const w = ctx.measureText(line).width;
    ctx.fillText(line, cx - w / 2, startY + index * lineHeight);
  });
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
  const logoUrls = (input.teamLogos ?? []).slice(0, 3);
  const logos = await Promise.all(logoUrls.map((src) => (src ? loadImage(src) : Promise.resolve(null))));

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

  const labelCol = 176;
  const square = 176;
  const gap = 12;
  const boardW = labelCol + square * 3 + gap * 2;
  const startX = (width - boardW) / 2;
  const startY = cursorY;
  const teamColW = labelCol - 12;
  const categoryPad = 10;
  const categoryLineH = 20;

  // Full X-axis labels — wrap to fit the column, never ellipsis-truncate.
  ctx.font = "800 18px Barlow Condensed, Arial Black, sans-serif";
  const categoryLines = input.categories.map((category) =>
    wrapText(ctx, category.trim().toUpperCase(), square - categoryPad * 2),
  );
  const maxCatLines = Math.max(1, ...categoryLines.map((lines) => lines.length));
  const headerH = Math.max(72, 28 + maxCatLines * categoryLineH);

  ctx.fillStyle = cream;
  ctx.fillRect(startX + labelCol, startY, square * 3 + gap * 2, headerH);
  ctx.fillStyle = ink;
  ctx.font = "800 18px Barlow Condensed, Arial Black, sans-serif";
  categoryLines.forEach((lines, col) => {
    const x = startX + labelCol + col * (square + gap);
    drawCenteredLines(ctx, lines, x + square / 2, startY + headerH / 2 + 6, categoryLineH);
  });

  ctx.fillStyle = "#2a3128";
  ctx.fillRect(startX, startY, teamColW, headerH);
  ctx.fillStyle = lime;
  ctx.font = "700 15px Inter, Arial, sans-serif";
  ctx.fillText("TEAM × FEAT", startX + 16, startY + headerH / 2 + 5);

  for (let row = 0; row < 3; row++) {
    const y = startY + headerH + 10 + row * (square + gap);
    const logo = logos[row];
    const teamName = (input.teams[row] ?? "").trim();

    ctx.fillStyle = cream;
    ctx.fillRect(startX, y, teamColW, square);

    // Team logo + name (match the live board: logo above, name below).
    if (logo) {
      const logoBox = 78;
      drawImageContain(ctx, logo, startX + (teamColW - logoBox) / 2, y + 18, logoBox);
      ctx.fillStyle = ink;
      ctx.font = "800 18px Barlow Condensed, Arial Black, sans-serif";
      const nameLines = wrapText(ctx, teamName.toUpperCase(), teamColW - 16);
      drawCenteredLines(ctx, nameLines.slice(0, 2), startX + teamColW / 2, y + square - 28, 18);
    } else {
      ctx.fillStyle = ink;
      ctx.font = "800 22px Barlow Condensed, Arial Black, sans-serif";
      const nameLines = wrapText(ctx, teamName.toUpperCase(), teamColW - 16);
      drawCenteredLines(ctx, nameLines.slice(0, 3), startX + teamColW / 2, y + square / 2 + 6, 22);
    }

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

  const boardBottom = startY + headerH + 10 + 3 * (square + gap);
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

/** Build the share card and try to put IMAGE + caption on the clipboard. */
export async function shareCardToClipboard(
  input: ShareInput,
  _filePrefix?: string,
): Promise<{ kind: "both" | "image" | "text"; blob: Blob; text: string; previewUrl: string }> {
  const safeInput: ShareInput =
    input.mode === "answers" ? { ...input, mode: "score" } : input;
  const text = buildShareText(safeInput);
  const blob = await renderShareImage(safeInput);
  const previewUrl = URL.createObjectURL(blob);
  const textBlob = new Blob([text], { type: "text/plain" });

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    // Prefer image + caption together when the browser allows it.
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
          "text/plain": textBlob,
        }),
      ]);
      return { kind: "both", blob, text, previewUrl };
    } catch {
      // Fall through — mixed clipboard often fails on Safari / some Chromium builds.
    }
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
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard blocked — caller still has the preview/download + caption UI.
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
