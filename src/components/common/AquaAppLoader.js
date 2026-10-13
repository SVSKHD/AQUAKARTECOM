import PropTypes from "prop-types";
import styles from "./AquaAppLoader.module.css";

export const AQUAKART_LOADER_LOGO =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const AquaAppLoader = ({
  message = "Loading AquaKart",
  subtext = "",
  variant = "section",
  size = "lg",
  className = "",
  showText = true,
}) => {
  const isFullScreen = variant === "screen" || variant === "route";
  return (
    <div
      className={`${styles.shell} ${isFullScreen ? styles.full : variant === "inline" ? styles.inline : styles.section} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className={styles.content}>
        <div className={`${styles.mark} ${styles[size] || styles.lg}`} aria-hidden="true">
          <img src={AQUAKART_LOADER_LOGO} alt="" className={styles.ghost} />
          <div className={styles.fill}>
            <img src={AQUAKART_LOADER_LOGO} alt="" className={styles.color} />
          </div>
        </div>
        {showText && variant !== "inline" && (
          <div className={styles.copy}>
            <strong className={styles.title}>{message}</strong>
            {subtext ? <span className={styles.subtitle}>{subtext}</span> : null}
          </div>
        )}
      </div>
    </div>
  );
};

AquaAppLoader.propTypes = {
  message: PropTypes.string,
  subtext: PropTypes.string,
  variant: PropTypes.oneOf(["screen", "route", "section", "inline"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  showText: PropTypes.bool,
};

export default AquaAppLoader;
