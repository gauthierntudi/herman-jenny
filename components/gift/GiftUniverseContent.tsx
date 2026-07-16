import type { CSSProperties } from "react";
import { gifts } from "@/lib/gifts";

type Props = {
  /** Full page vs home embed in place of the shop banner */
  variant?: "page" | "section";
};

const WEDDING_WORDS = [
  { word: "Love", color: "#c9a227" },
  { word: "Forever", color: "#a47864" },
  { word: "Faith", color: "#6b8f71" },
  { word: "Joy", color: "#b85c38" },
  { word: "Unity", color: "#5c6b8a" },
] as const;

export default function GiftUniverseContent({ variant = "page" }: Props) {
  const Root = variant === "page" ? "main" : "section";
  const Title = variant === "page" ? "h1" : "h2";
  const giftCount = gifts.length;
  const wordCount = WEDDING_WORDS.length;

  return (
    <Root
      id="gift-universe"
      className={`gift-universe${variant === "section" ? " gift-universe--section" : ""}`}
      aria-labelledby="gift-universe-title"
    >
      <header className="gift-universe__hero">
        <p className="gift-universe__eyebrow">Herman &amp; Jennifer</p>
        <Title id="gift-universe-title" className="gift-universe__title">
          Gift Universe
        </Title>
        <p className="gift-universe__lede">
          A few pieces we love for our home. Choose one that speaks to you — each opens on Amazon.
        </p>
      </header>

      <div className="gift-universe__orbit-stage">
        <div className="gift-universe__orbit-ring" aria-hidden="true" />

        <div className="gift-universe__orbit-core">
          <img src="/img/icon.png" alt="Herman & Jennifer" />
        </div>

        <div className="gift-universe__orbit gift-universe__orbit--words" aria-hidden="true">
          {WEDDING_WORDS.map((item, index) => (
            <div
              key={item.word}
              className="gift-universe__moon"
              style={
                {
                  "--i": index,
                  "--count": wordCount,
                  "--moon-color": item.color,
                } as CSSProperties
              }
            >
              <div className="gift-universe__moon-face">
                <span className="gift-universe__moon-word">{item.word}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="gift-universe__orbit gift-universe__orbit--gifts" role="list" aria-label="Gift registry">
          {gifts.map((gift, index) => (
            <div
              key={gift.id}
              className="gift-universe__planet"
              style={
                {
                  "--i": index,
                  "--count": giftCount,
                } as CSSProperties
              }
              role="listitem"
            >
              <div className="gift-universe__planet-face">
                <a
                  href={gift.href}
                  className="gift-universe__item"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${gift.title} — shop on Amazon`}
                  style={{ ["--gift-image" as string]: `url("${gift.image}")` }}
                >
                  <span className="gift-universe__fill" aria-hidden="true" />
                  <span className="gift-universe__meta">
                    <span className="gift-universe__name">{gift.title}</span>
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Root>
  );
}
