"use client";

import { useState } from "react";
import {
  copyShareImage,
  copyShareText,
  shareCardNative,
  shareImageFilename,
  socialShareTargets,
} from "./share-card";

type ShareDonePanelProps = {
  siteUrl: string;
  shareText: string;
  previewUrl: string | null;
  clipboardKind: "both" | "image" | "text";
  onClose: () => void;
  onViewAnswers: () => void;
};

export function ShareDonePanel({
  siteUrl,
  shareText,
  previewUrl,
  clipboardKind,
  onClose,
  onViewAnswers,
}: ShareDonePanelProps) {
  const targets = socialShareTargets(shareText, siteUrl);
  const caption = shareText;
  const imageName = shareImageFilename(siteUrl.startsWith("http") ? siteUrl : "https://gridirongrid.org/");
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  async function copyCaption() {
    const ok = await copyShareText(caption);
    if (!ok) return;
    setCopiedCaption(true);
    window.setTimeout(() => setCopiedCaption(false), 1800);
  }

  async function copyImage() {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const ok = await copyShareImage(blob);
      if (!ok) return;
      setCopiedImage(true);
      window.setTimeout(() => setCopiedImage(false), 1800);
    } catch {
      // ignore
    }
  }

  function downloadImage() {
    if (!previewUrl) return;
    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.download = imageName;
    anchor.click();
  }

  async function nativeShare() {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      await shareCardNative({ blob, text: shareText, url: siteUrl });
    } catch {
      // User cancelled or unsupported.
    }
  }

  return (
    <div className="answer-overlay share-overlay" role="dialog" aria-modal="true" aria-label="Share complete">
      <button className="overlay-backdrop" onClick={onClose} aria-label="Close share panel" />
      <section className="answer-drawer share-drawer share-done-drawer">
        <div className="drawer-head">
          <div>
            <small>SHARE READY</small>
            <h2>Copy text or image</h2>
            <p>
              Tap <strong>Copy text</strong> or <strong>Copy image</strong> separately — paste whichever you need.
              {clipboardKind === "both"
                ? " Both were also written to the clipboard on Share."
                : clipboardKind === "image"
                  ? " Image was written on Share; copy text if you still need the caption."
                  : ""}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="share-actions dual share-copy-pair">
          <button type="button" className="primary" onClick={copyCaption}>
            {copiedCaption ? "Text copied ✓" : "Copy text"}
          </button>
          <button type="button" className="primary" onClick={copyImage} disabled={!previewUrl}>
            {copiedImage ? "Image copied ✓" : "Copy image"}
          </button>
        </div>

        <div className="share-caption-block">
          <div className="share-caption-head">
            <small>SHARE CAPTION</small>
          </div>
          <pre className="share-preview" tabIndex={0}>
            {caption}
          </pre>
        </div>

        {previewUrl && (
          <div className="share-image-preview">
            <img src={previewUrl} alt="Share card preview" />
            <small className="share-image-filename">{imageName}</small>
          </div>
        )}

        <div className="share-actions dual">
          <button type="button" onClick={downloadImage} disabled={!previewUrl}>
            Download image
          </button>
          <button type="button" onClick={nativeShare} disabled={!previewUrl}>
            System share
          </button>
        </div>

        <div className="social-share-grid" aria-label="Share to social media">
          {targets.map((target) => (
            <a
              key={target.id}
              className={`social-share-btn social-${target.id}`}
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="social-icon" aria-hidden>
                {target.id === "x" && "𝕏"}
                {target.id === "facebook" && "f"}
                {target.id === "linkedin" && "in"}
                {target.id === "whatsapp" && "W"}
                {target.id === "telegram" && "T"}
                {target.id === "reddit" && "r"}
              </span>
              {target.label}
            </a>
          ))}
        </div>

        <div className="share-actions single">
          <button type="button" className="primary" onClick={onViewAnswers}>
            View today&apos;s answers
          </button>
        </div>
      </section>
    </div>
  );
}
