"use client";

import { useEffect, useRef, useState } from "react";
import { INR } from "./catalogue";
import { useReducedMotion } from "./hooks";

const DURATION = 450;

// A rupee amount that counts to its new value instead of jumping, with a
// brief tint showing which way it moved. Shows the value as-is on first
// render (and always, with reduced motion).
export default function AnimatedAmount({
  value,
  prefix = "",
}: {
  value: number;
  prefix?: string;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const start = shownRef.current;
    if (start === value) return;
    setDir(value > start ? "up" : "down");
    const untint = setTimeout(() => setDir(null), 900);
    if (reduced) {
      shownRef.current = value;
      setShown(value);
      return () => clearTimeout(untint);
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / DURATION);
      const eased = 1 - Math.pow(1 - k, 3);
      const n = Math.round(start + (value - start) * eased);
      shownRef.current = n;
      setShown(n);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(untint);
    };
  }, [value, reduced]);

  return (
    <span className="aq-amt" data-dir={dir ?? undefined}>
      {prefix}
      {INR(shown)}
    </span>
  );
}
