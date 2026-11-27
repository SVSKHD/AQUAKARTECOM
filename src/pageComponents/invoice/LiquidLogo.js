import Image from "next/image";
import logo from "@/assests/logo-white.png";
import styles from "@/styles/invoice-motion.module.css";

// One wave period is 120 units; the path repeats it twice so sliding the
// 200%-wide svg by -50% loops without a seam.
const WAVE = "M0 12 Q30 2 60 12 T120 12 T180 12 T240 12 V24 H0Z";

/**
 * The white Aquakart mark inside a glass sphere of moving water. Hovering
 * the sphere (or the link/button around it) fills it up. Pure CSS/SVG:
 * only transform animates, and it stops with reduced motion.
 */
const LiquidLogo = ({
  size = 112,
  level = 0.78,
  filling = false,
  className = "",
}) => (
  <span
    className={`${styles.liquid} ${filling ? styles.liquidFilling : ""} ${className}`}
    style={{ "--size": `${size}px`, "--level": level }}
    aria-hidden="true"
  >
    <span className={styles.liquidTide}>
      <span className={styles.liquidWater}>
        <svg
          className={`${styles.wave} ${styles.waveBack}`}
          viewBox="0 0 240 24"
          preserveAspectRatio="none"
        >
          <path d={WAVE} />
        </svg>
        <svg
          className={styles.wave}
          viewBox="0 0 240 24"
          preserveAspectRatio="none"
        >
          <path d={WAVE} />
        </svg>
      </span>
    </span>
    <span className={styles.liquidLogo}>
      <Image
        src={logo}
        alt=""
        width={Math.round(size / 2)}
        height={Math.round(size / 2)}
        priority
      />
    </span>
    <span className={styles.liquidShine} />
  </span>
);

export default LiquidLogo;
