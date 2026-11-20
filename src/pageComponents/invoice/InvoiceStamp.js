import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import logo from "@/assests/logo.png";
import { DOCUMENT_STATUSES } from "@/utils/invoice/documentKind";
import styles from "@/styles/invoice.module.css";

const toneClass = (key) => styles[`tone_${key}`] || styles.tone_unpaid;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The Aquakart logo inside a rubber-stamp ring that reads the bill's status
 * ("PAID · AQUAKART · …") in that status's colour. The ring turns slowly and
 * the status badge stamps down on load; tapping it stamps it again.
 */
export const InvoiceStamp = ({ status, documentLabel }) => {
  const rawId = useId();
  const pathId = `stamp-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [takes, setTakes] = useState(0);
  const word = status.label.toUpperCase();
  const ring = `${word} ✦ AQUAKART ✦ ${word} ✦ AQUAKART ✦ `;

  return (
    <button
      type="button"
      className={`${styles.stamp} ${toneClass(status.key)}`}
      onClick={() => setTakes((count) => count + 1)}
      aria-label={`${documentLabel} status: ${status.label}. ${status.hint}`}
      title={status.hint}
      data-status={status.key}
    >
      <svg
        className={styles.stampRing}
        viewBox="0 0 140 140"
        aria-hidden="true"
      >
        <defs>
          <path
            id={pathId}
            d="M70,70 m-54,0 a54,54 0 1,1 108,0 a54,54 0 1,1 -108,0"
          />
        </defs>
        <circle className={styles.stampOuter} cx="70" cy="70" r="66" />
        <circle className={styles.stampInner} cx="70" cy="70" r="43" />
        <text className={styles.stampText}>
          <textPath href={`#${pathId}`} textLength="336" lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
      </svg>
      <span className={styles.stampLogo} aria-hidden="true">
        <Image src={logo} alt="" width={56} height={56} priority />
      </span>
      <span key={takes} className={styles.stampBadge} aria-hidden="true">
        {word}
      </span>
    </button>
  );
};

/** Coloured status chip, matching the stamp. */
export const StatusPill = ({ status }) => (
  <span className={`${styles.statusPill} ${toneClass(status.key)}`}>
    <span className={styles.statusDot} />
    {status.label}
  </span>
);

/**
 * Every status the page can show, in its colour. The bill's own status is
 * lit; tapping any chip explains what it means.
 */
export const StatusLegend = ({ status, documentName }) => {
  const [selected, setSelected] = useState(status.key);
  const active =
    DOCUMENT_STATUSES.find((entry) => entry.key === selected) || status;

  return (
    <section className={styles.statusLegend} aria-label="Status colour guide">
      <div className={styles.statusLegendChips} role="group">
        {DOCUMENT_STATUSES.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={`${styles.legendChip} ${toneClass(entry.key)} ${
              entry.key === status.key ? styles.legendChipCurrent : ""
            } ${entry.key === selected ? styles.legendChipSelected : ""}`}
            onClick={() => setSelected(entry.key)}
            onMouseEnter={() => setSelected(entry.key)}
            onFocus={() => setSelected(entry.key)}
            onMouseLeave={() => setSelected(status.key)}
            aria-pressed={entry.key === selected}
          >
            <span className={styles.statusDot} />
            {entry.label}
          </button>
        ))}
      </div>
      <p className={`${styles.statusLegendHint} ${toneClass(active.key)}`}>
        <strong>
          {active.key === status.key
            ? `This ${documentName.toLowerCase()} is ${active.label.toLowerCase()}.`
            : `${active.label}:`}
        </strong>{" "}
        {active.hint}
      </p>
    </section>
  );
};

/** Counts a number up from zero once, then shows it formatted. */
export const CountUp = ({ value, format, duration = 900 }) => {
  // The route renders on the client only, so starting at zero is safe.
  const [shown, setShown] = useState(() =>
    prefersReducedMotion() ? value : 0,
  );
  const frame = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion() || !value) return undefined;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setShown(progress < 1 ? value * eased : value);
      if (progress < 1) frame.current = window.requestAnimationFrame(tick);
    };
    frame.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame.current);
  }, [value, duration]);

  return <>{format(shown)}</>;
};

export default InvoiceStamp;
