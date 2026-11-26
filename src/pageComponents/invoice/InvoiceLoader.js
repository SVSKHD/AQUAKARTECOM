import LiquidLogo from "@/pageComponents/invoice/LiquidLogo";
import styles from "@/styles/invoice-motion.module.css";

/**
 * Shown while an invoice or quotation loads: the liquid logo fills up while
 * the steps tick off. The last step keeps spinning until the page arrives.
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
        <LiquidLogo size={112} level={0.62} filling />
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
