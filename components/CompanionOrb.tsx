"use client";

import React, { useRef } from "react";

export type OrbState = "idle" | "connecting" | "listening" | "speaking";

interface CompanionOrbProps {
  color?: string;
  state: OrbState;
  subject?: string;
  // Live caption for whatever is being said right now.
  caption?: { role: string; text: string } | null;
  // Exposed so the parent can drive `--level` (0-1 voice volume) without
  // re-rendering on every audio frame.
  ref?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}

const ORBIT_DOTS = [0, 1, 2];
const RINGS = [0, 1, 2];
const WAVE_BARS = Array.from({ length: 48 }, (_, index) => index);

// Floating symbols that give each subject its own backdrop.
const SUBJECT_GLYPHS: Record<string, string[]> = {
  maths: ["∑", "π", "√", "∫", "÷", "%", "∞", "Δ"],
  science: ["⚛", "H₂O", "E=mc²", "DNA", "λ", "℃", "Σ", "⚗"],
  language: ["Aa", "你好", "é", "ñ", "¿?", "ß", "あ", "Ω"],
  history: ["⌛", "♜", "1492", "⚔", "§", "Ⅻ", "❦", "1776"],
  coding: ["{ }", "</>", "=>", "&&", "01", "fn()", "#!", "[ ]"],
  economics: ["$", "%", "↗", "€", "¥", "₹", "Σ", "GDP"],
};

// Fixed spots around the edges so symbols never sit behind the avatar.
const GLYPH_SPOTS: Array<[number, number]> = [
  [8, 14],
  [86, 10],
  [14, 66],
  [90, 58],
  [30, 88],
  [72, 90],
  [48, 6],
  [4, 40],
];
// A layered, mouse-reactive "3D" stage for the companion avatar. Depth comes
// from CSS perspective + translateZ layers, so there is no WebGL dependency.
const CompanionOrb = ({
  color = "#E5D0FF",
  state,
  subject,
  caption,
  ref,
  children,
}: CompanionOrbProps) => {
  const localRef = useRef<HTMLDivElement>(null);

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = localRef.current;
    if (!element || event.pointerType === "touch") {
      return;
    }

    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    element.style.setProperty("--ry", `${(x * 22).toFixed(2)}deg`);
    element.style.setProperty("--rx", `${(-y * 22).toFixed(2)}deg`);
  };

  const handleLeave = () => {
    localRef.current?.style.setProperty("--rx", "0deg");
    localRef.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={setRefs}
      className="orb-stage"
      data-state={state}
      style={{ "--orb": color } as React.CSSProperties}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <span className="orb-blob orb-blob-a" aria-hidden="true" />
      <span className="orb-blob orb-blob-b" aria-hidden="true" />

      {(SUBJECT_GLYPHS[subject ?? ""] ?? []).map((glyph, index) => (
        <span
          key={`${glyph}-${index}`}
          className="orb-glyph"
          aria-hidden="true"
          style={
            {
              left: `${GLYPH_SPOTS[index][0]}%`,
              top: `${GLYPH_SPOTS[index][1]}%`,
              animationDelay: `${index * -1.3}s`,
              fontSize: `${18 + (index % 3) * 8}px`,
            } as React.CSSProperties
          }
        >
          {glyph}
        </span>
      ))}

      <div className="orb-scene">
        <div className="orb-wave" aria-hidden="true">
          {WAVE_BARS.map((index) => (
            <span
              key={index}
              className="orb-bar"
              style={
                {
                  "--i": index,
                  "--amp": (0.8 + (((index * 7) % 10) / 10) * 1.4).toFixed(2),
                } as React.CSSProperties
              }
            >
              <i />
            </span>
          ))}
        </div>

        {RINGS.map((index) => (
          <span
            key={index}
            className="orb-ring"
            style={{ animationDelay: `${index * 0.8}s` }}
            aria-hidden="true"
          />
        ))}

        <div className="orb-orbit" aria-hidden="true">
          {ORBIT_DOTS.map((index) => (
            <span key={index} className={`orb-dot orb-dot-${index}`} />
          ))}
        </div>

        <div className="orb-pulse">
          <div className="orb-core">{children}</div>
        </div>

        <span className="orb-shadow" aria-hidden="true" />
      </div>

      <p
        className={`orb-caption${caption ? " orb-caption-visible" : ""}`}
        data-role={caption?.role}
        aria-hidden="true"
      >
        {caption?.text}
      </p>
    </div>
  );
};

export default CompanionOrb;
