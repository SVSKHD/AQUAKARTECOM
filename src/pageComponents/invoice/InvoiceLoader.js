import { useEffect, useState } from "react";
import LiquidLogo from "@/pageComponents/invoice/LiquidLogo";
import styles from "@/styles/invoice-motion.module.css";

/** How long the logo takes to fill to 75% (keep in step with waterFill). */
export const LOADER_FILL_MS = 1600;

/**
 * True once the fill animation has finished. Routes show the loader until
 * this is true AND the document has loaded, so on every refresh the logo
 * fills to 75% before the invoice appears. With reduced motion there is no
 * animation to wait for.
 */
export const useLoaderFilled = () => {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(
      () => setFilled(true),
      reduce ? 0 : LOADER_FILL_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);
  return filled;
};

/**
 * Shown while an invoice or quotation loads: the liquid logo fills to 75%
 * while the steps tick off. If the document is still on its way after
 * that, the water keeps moving at 75% and the last step keeps spinning.
 */
const InvoiceLoader = ({ documentName = "invoice" }) => {
  const steps = [
    `Finding your ${documentName}`,
    "Checking secure access",
    "Matching your products",
    "Adding up GST and totals",
  ];

  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <div className={styles.loaderCard}>
        <LiquidLogo size={112} level={0.75} filling />
        <p className={styles.loaderTitle}>Preparing your {documentName}</p>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step} style={{ "--i": index }}>
              <span className={styles.stepIcon} aria-hidden="true" />
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default InvoiceLoader;
