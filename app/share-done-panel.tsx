"use client";

import { useEffect } from "react";
import { shareCardNative, socialShareTargets } from "./share-card";

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
  const imageOnClipboard = clipboardKind === "both" || clipboardKind === "image";

  useEffect(() => {
    return () => {
      // Parent owns the object URL lifetime; no revoke here.
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${siteUrl}`);
    } catch {
      // ignore
    }
  }

  function downloadImage() {
    if (!previewUrl) return;
    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.download = "gridiron-grid-share.png";
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
            <small>CLIPBOARD</small>
            <h2>{imageOnClipboard ? "Image copied" : "Ready to share"}</h2>
            <p>
              {imageOnClipboard
                ? "Share card image is on your clipboard — paste into X, Instagram, Facebook, or Messages."
                : "Preview the card below. Download it or use a social button — this browser blocked image clipboard."}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="clipboard-banner" role="status">
          <span aria-hidden>✓</span>
          <strong>{imageOnClipboard ? "Added to clipboard" : "Card ready — download to share"}</strong>
        </div>

        {previewUrl && (
          <div className="share-image-preview">
            <img src={previewUrl} alt="Share card preview" />
          </div>
        )}

        <div className="share-actions dual">
          <button type="button" className="primary" onClick={downloadImage} disabled={!previewUrl}>
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
          <button type="button" className="social-share-btn social-link" onClick={copyLink}>
            <span className="social-icon" aria-hidden>
              ↗
            </span>
            Copy link
          </button>
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
