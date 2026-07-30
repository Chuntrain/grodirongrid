"use client";

import { socialShareTargets } from "./share-card";

type ShareDonePanelProps = {
  siteUrl: string;
  shareText: string;
  onClose: () => void;
  onViewAnswers: () => void;
};

export function ShareDonePanel({ siteUrl, shareText, onClose, onViewAnswers }: ShareDonePanelProps) {
  const targets = socialShareTargets(shareText, siteUrl);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${siteUrl}`);
    } catch {
      // ignore — card was already copied
    }
  }

  return (
    <div className="answer-overlay share-overlay" role="dialog" aria-modal="true" aria-label="Share complete">
      <button className="overlay-backdrop" onClick={onClose} aria-label="Close share panel" />
      <section className="answer-drawer share-drawer share-done-drawer">
        <div className="drawer-head">
          <div>
            <small>CLIPBOARD</small>
            <h2>Added to clipboard</h2>
            <p>Card image + link are ready. Paste into any app, or open a social network below.</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="clipboard-banner" role="status">
          <span aria-hidden>✓</span>
          <strong>Copied to clipboard</strong>
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
