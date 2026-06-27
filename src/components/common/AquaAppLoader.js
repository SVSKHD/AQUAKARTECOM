import PropTypes from "prop-types";

export const AQUAKART_LOADER_LOGO =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const sizeMap = {
  sm: {
    wrap: "h-14 w-14",
    logo: "h-8 w-8",
    ring: "h-14 w-14",
    text: "text-xs",
  },
  md: {
    wrap: "h-20 w-20",
    logo: "h-11 w-11",
    ring: "h-20 w-20",
    text: "text-sm",
  },
  lg: {
    wrap: "h-24 w-24",
    logo: "h-14 w-14",
    ring: "h-24 w-24",
    text: "text-sm",
  },
};

const fullScreenShell =
  "fixed inset-0 z-[9999] flex h-[100dvh] min-h-[100svh] w-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-slate-50 to-emerald-50 px-4";

const variantShell = {
  screen: fullScreenShell,
  route: fullScreenShell,
  section:
    "flex min-h-[260px] w-full items-center justify-center rounded-[2rem] border border-white/70 bg-white px-4 py-10 shadow-sm",
  inline: "inline-flex items-center justify-center",
};

const AquaAppLoader = ({
  message = "Loading Aquakart",
  subtext = "Preparing a smooth water-solutions experience",
  variant = "section",
  size = "lg",
  className = "",
  showText = true,
}) => {
  const sizeClasses = sizeMap[size] || sizeMap.lg;
  const isInline = variant === "inline";

  return (
    <div
      className={`${variantShell[variant] || variantShell.section} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
    >
      <div
        className={`aqua-loader-card relative flex flex-col items-center justify-center ${
          isInline
            ? "gap-0 bg-transparent p-0 shadow-none"
            : "gap-4 rounded-[2rem] border border-white bg-white px-8 py-7 text-center shadow-2xl shadow-emerald-900/10"
        }`}
      >
        <div className={`relative ${sizeClasses.wrap}`}>
          <span
            className={`aqua-loader-ring absolute inset-0 ${sizeClasses.ring} rounded-full border border-emerald-200`}
          />
          <span
            className={`aqua-loader-ring aqua-loader-ring-delay absolute inset-0 ${sizeClasses.ring} rounded-full border border-teal-200`}
          />
          <span className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-100 via-white to-teal-50 shadow-inner" />
          <span className="aqua-loader-logo absolute inset-0 flex items-center justify-center rounded-full">
            <img
              src={AQUAKART_LOADER_LOGO}
              alt="Aquakart"
              className={`${sizeClasses.logo} rounded-2xl object-contain drop-shadow-sm`}
              loading="eager"
              decoding="async"
            />
          </span>
        </div>

        {!isInline && showText ? (
          <div className="w-full min-w-[220px] max-w-[280px]">
            <p className={`font-bold text-slate-950 ${sizeClasses.text}`}>
              {message}
            </p>
            {subtext ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">{subtext}</p>
            ) : null}
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-emerald-100">
              <span className="aqua-loader-progress block h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
            </div>
          </div>
        ) : null}

        <span className="sr-only">{message}</span>
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
