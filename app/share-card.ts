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
  options?: { fontSize?: number; lineHeight?: number; maxLines?: number },
) {
  const fontSize = options?.fontSize ?? 22;
  const lineHeight = options?.lineHeight ?? Math.round(fontSize * 1.15);
  const maxLines = options?.maxLines ?? 3;
  ctx.font = `800 ${fontSize}px Barlow Condensed, Arial Black, sans-serif`;

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

  const fitted: string[] = [];
  for (const line of lines) {
    if (ctx.measureText(line).width <= maxWidth) {
      fitted.push(line);
      continue;
    }
    let chunk = "";
    for (const ch of line) {
      const next = chunk + ch;
      if (ctx.measureText(next).width > maxWidth && chunk) {
        fitted.push(chunk);
        chunk = ch;
      } else {
        chunk = next;
      }
    }
    if (chunk) fitted.push(chunk);
  }

  const shown = fitted.slice(0, maxLines);
  if (fitted.length > maxLines) {
    const last = shown[maxLines - 1];
    shown[maxLines - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
  }
  const startY = cy - ((shown.length - 1) * lineHeight) / 2;
  shown.forEach((line, index) => {
    const w = ctx.measureText(line).width;
    ctx.fillText(line, cx - w / 2, startY + index * lineHeight);
  });
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
  const paper = "#FBFAF6";
  const field = "#153F2D";
  const cream = "#E9E3D3";
  const gridLine = "#C7C4B9";
  const reaction = scoreReaction(input.score);
  const mode = input.mode === "answers" ? "score" : input.mode;
  const logoUrls = (input.teamLogos ?? []).slice(0, 3);
  const logos = await Promise.all(logoUrls.map((src) => (src ? loadImage(src) : Promise.resolve(null))));

  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, width, height);

  // Compact brand bar — keep the table as the hero.
  ctx.fillStyle = lime;
  ctx.fillRect(0, 0, width, 88);
  ctx.fillStyle = ink;
  ctx.font = "800 36px Barlow Condensed, Arial Black, sans-serif";
  ctx.fillText(input.brand.toUpperCase(), 40, 58);

  ctx.font = "700 22px Inter, Arial, sans-serif";
  ctx.fillStyle = "#2a3128";
  const meta = `#${String(input.puzzleNumber).padStart(3, "0")} · ${input.dateKey}`;
  const metaW = ctx.measureText(meta).width;
  ctx.fillText(meta, width - 40 - metaW, 58);

  const hook =
    mode === "blank" ? viralHook("blank", 0) : `${input.score}/9 ${reaction.emoji} · ${reaction.label}`;
  ctx.fillStyle = paper;
  ctx.font = "800 34px Barlow Condensed, Arial Black, sans-serif";
  ctx.fillText(hook, 40, 140);

  // Big contiguous table — nearly full card width.
  const marginX = 36;
  const labelCol = 168;
  const availableW = width - marginX * 2 - labelCol;
  const square = Math.floor(availableW / 3);
  const boardW = labelCol + square * 3;
  const startX = Math.round((width - boardW) / 2);
  const startY = 168;
  const teamColW = labelCol;

  ctx.font = "800 20px Barlow Condensed, Arial Black, sans-serif";
  const categoryLines = input.categories.map((category) =>
    wrapText(ctx, category.trim().toUpperCase(), square - 16),
  );
  const maxCatLines = Math.max(1, ...categoryLines.map((lines) => lines.length));
  const headerH = Math.max(88, 28 + maxCatLines * 22);

  ctx.fillStyle = cream;
  ctx.fillRect(startX, startY, boardW, headerH + square * 3);

  ctx.fillStyle = "#2a3128";
  ctx.fillRect(startX, startY, teamColW, headerH);
  ctx.fillStyle = lime;
  ctx.font = "800 16px Inter, Arial, sans-serif";
  ctx.fillText("TEAM", startX + 24, startY + headerH / 2 - 4);
  ctx.fillText("× FEAT", startX + 24, startY + headerH / 2 + 18);

  categoryLines.forEach((lines, col) => {
    const x = startX + labelCol + col * square;
    ctx.fillStyle = cream;
    ctx.fillRect(x, startY, square, headerH);
    ctx.fillStyle = ink;
    ctx.font = "800 20px Barlow Condensed, Arial Black, sans-serif";
    drawCenteredLines(ctx, lines, x + square / 2, startY + headerH / 2 + 6, 22);
  });

  for (let row = 0; row < 3; row++) {
    const y = startY + headerH + row * square;
    const logo = logos[row];
    const teamName = (input.teams[row] ?? "").trim();

    ctx.fillStyle = cream;
    ctx.fillRect(startX, y, teamColW, square);

    if (logo) {
      const logoBox = 72;
      drawImageContain(ctx, logo, startX + (teamColW - logoBox) / 2, y + 22, logoBox);
      ctx.fillStyle = ink;
      ctx.font = "800 20px Barlow Condensed, Arial Black, sans-serif";
      const nameLines = wrapText(ctx, teamName.toUpperCase(), teamColW - 16);
      drawCenteredLines(ctx, nameLines.slice(0, 2), startX + teamColW / 2, y + square - 28, 20);
    } else {
      ctx.fillStyle = ink;
      ctx.font = "800 24px Barlow Condensed, Arial Black, sans-serif";
      const nameLines = wrapText(ctx, teamName.toUpperCase(), teamColW - 16);
      drawCenteredLines(ctx, nameLines.slice(0, 3), startX + teamColW / 2, y + square / 2 + 6, 24);
    }

    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      const cell = input.cells[index];
      const x = startX + labelCol + col * square;

      ctx.fillStyle = paper;
      ctx.fillRect(x, y, square, square);

      if (!cell) {
        ctx.fillStyle = "#b0aea4";
        ctx.font = "800 64px Barlow Condensed, Arial Black, sans-serif";
        const num = String(index + 1);
        const numW = ctx.measureText(num).width;
        ctx.fillText(num, x + (square - numW) / 2, y + square / 2 + 22);
      } else {
        ctx.fillStyle = "#F0E3A8";
        ctx.fillRect(x + 10, y + 10, square - 20, square - 20);
        ctx.fillStyle = ink;
        const nameSize = cell.answer.length > 14 ? 26 : cell.answer.length > 10 ? 30 : 34;
        drawWrappedName(ctx, cell.answer, x + square / 2, y + square / 2 + 4, square - 28, {
          fontSize: nameSize,
          lineHeight: Math.round(nameSize * 1.12),
          maxLines: 3,
        });
      }
    }
  }

  // Spreadsheet-style grid lines so the board reads as a clear table.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(startX + 1.5, startY + 1.5, boardW - 3, headerH + square * 3 - 3);

  ctx.strokeStyle = gridLine;
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    const x = startX + labelCol + i * square;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + headerH + square * 3);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(startX + labelCol, startY);
  ctx.lineTo(startX + labelCol, startY + headerH + square * 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(startX, startY + headerH);
  ctx.lineTo(startX + boardW, startY + headerH);
  ctx.stroke();
  for (let i = 1; i < 3; i++) {
    const y = startY + headerH + i * square;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + boardW, y);
    ctx.stroke();
  }

  const boardBottom = startY + headerH + square * 3;
  const pool = (input.pool ?? []).slice(0, 9);
  if (pool.length > 0) {
    let poolY = boardBottom + 36;
    ctx.fillStyle = lime;
    ctx.font = "800 22px Barlow Condensed, Arial Black, sans-serif";
    ctx.fillText("TODAY'S 9 PLAYERS", 40, poolY);
    poolY += 18;
    ctx.font = "700 18px Inter, Arial, sans-serif";
    const names = pool.map((n) => n.toUpperCase()).join("  ·  ");
    const nameLines = wrapText(ctx, names, width - 80);
    ctx.fillStyle = "#d7dcd4";
    nameLines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, 40, poolY + 24 + i * 24);
    });
  }

  ctx.fillStyle = field;
  ctx.fillRect(0, height - 100, width, 100);
  ctx.fillStyle = lime;
  ctx.font = "800 30px Barlow Condensed, Arial Black, sans-serif";
  ctx.fillText("PLAY FREE · gridirongrid.org", 40, height - 42);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export image"));
    }, "image/png");
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

function buildShareHtml(text: string, imageDataUrl: string) {
  const lines = escapeHtml(text).replace(/\n/g, "<br>");
  return `<div style="font-family:system-ui,sans-serif;white-space:pre-wrap;line-height:1.45">${lines}</div><br><img src="${imageDataUrl}" alt="Gridiron Grid share card" />`;
}

/**
 * Write caption + image in one clipboard item.
 * Uses Promises (Safari user-gesture friendly) and several MIME fallbacks.
 */
async function writeCaptionAndImage(
  imagePromise: Promise<Blob>,
  text: string,
): Promise<"both" | "image" | "text"> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
    return "text";
  }

  const textPromise = Promise.resolve(new Blob([text], { type: "text/plain" }));
  const htmlPromise = imagePromise.then(async (blob) => {
    const dataUrl = await blobToDataUrl(blob);
    return new Blob([buildShareHtml(text, dataUrl)], { type: "text/html" });
  });

  const attempts: Record<string, Blob | Promise<Blob>>[] = [
    // Best: plain text + rich HTML (caption + image) + PNG
    {
      "text/plain": textPromise,
      "text/html": htmlPromise,
      "image/png": imagePromise,
    },
    // Common Chromium path: plain caption + PNG
    {
      "text/plain": textPromise,
      "image/png": imagePromise,
    },
    // Rich editors still get caption + embedded image
    {
      "text/plain": textPromise,
      "text/html": htmlPromise,
    },
  ];

  for (const payload of attempts) {
    try {
      await navigator.clipboard.write([new ClipboardItem(payload)]);
      return "both";
    } catch {
      // try next combination
    }
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": imagePromise,
      }),
    ]);
    return "image";
  } catch {
    // fall through
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
  return "text";
}

/** Build the share card and put caption + image on the clipboard in one click. */
export async function shareCardToClipboard(
  input: ShareInput,
  _filePrefix?: string,
): Promise<{ kind: "both" | "image" | "text"; blob: Blob; text: string; previewUrl: string }> {
  const safeInput: ShareInput =
    input.mode === "answers" ? { ...input, mode: "score" } : input;
  const text = buildShareText(safeInput);

  // Start image render as a Promise immediately so ClipboardItem can hold it
  // without awaiting first (keeps the user-gesture chain alive on Safari).
  const imagePromise = renderShareImage(safeInput);
  const kind = await writeCaptionAndImage(imagePromise, text);
  const blob = await imagePromise;
  const previewUrl = URL.createObjectURL(blob);

  // If only the image landed, try one more mixed write now that the blob is ready.
  if (kind === "image" && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html": new Blob([buildShareHtml(text, await blobToDataUrl(blob))], {
            type: "text/html",
          }),
          "image/png": blob,
        }),
      ]);
      return { kind: "both", blob, text, previewUrl };
    } catch {
      // Keep image-only result; UI still shows caption.
    }
  }

  return { kind, blob, text, previewUrl };
}

/** Filename for downloads / OS share — always brands https://gridirongrid.org/ (OS-safe). */
export function shareImageFilename(_siteUrl?: string) {
  return "gridiron-grid-https-gridirongrid.org.png";
}

/** Copy only the caption text (+ link already inside buildShareText). */
export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Copy only the share card image. */
export async function copyShareImage(blob: Blob): Promise<boolean> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);
    return true;
  } catch {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": Promise.resolve(blob),
        }),
      ]);
      return true;
    } catch {
      return false;
    }
  }
}

/** Try the OS share sheet with the card image attached (mobile / supported browsers). */
export async function shareCardNative(input: {
  blob: Blob;
  text: string;
  url: string;
  title?: string;
}): Promise<boolean> {
  const file = new File([input.blob], shareImageFilename(input.url), { type: "image/png" });
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
