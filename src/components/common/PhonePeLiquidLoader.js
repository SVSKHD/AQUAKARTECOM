import { AQUAKART_LOADER_LOGO } from "@/components/common/AquaAppLoader";
import styles from "./PhonePeLiquidLoader.module.css";

// A minimal payment handoff screen: the AquaKart mark fills like a water tank.
// This is an indeterminate animation, not a representation of payment progress.
export default function PhonePeLiquidLoader() {
  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label="Connecting securely to PhonePe">
      <div className={styles.logo} aria-hidden="true">
        <img src={AQUAKART_LOADER_LOGO} alt="" className={styles.base} />
        <div className={styles.liquid}>
          <img src={AQUAKART_LOADER_LOGO} alt="" className={styles.filled} />
        </div>
      </div>
      <span className="sr-only">Connecting securely to PhonePe. Please wait.</span>
    </div>
  );
}
