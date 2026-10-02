"use client";

import React, { useRef } from "react";

export type OrbState = "idle" | "connecting" | "listening" | "speaking";

interface CompanionOrbProps {
  color?: string;
  state: OrbState;
  // Exposed so the parent can drive `--level` (0-1 voice volume) without
  // re-rendering on every audio frame.
  ref?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}

const ORBIT_DOTS = [0, 1, 2];
const RINGS = [0, 1, 2];

// A layered, mouse-reactive "3D" stage for the companion avatar. Depth comes
// from CSS perspective + translateZ layers, so there is no WebGL dependency.
const CompanionOrb = ({
  color = "#E5D0FF",
  state,
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

      <div className="orb-scene">
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
    </div>
  );
};

export default CompanionOrb;
