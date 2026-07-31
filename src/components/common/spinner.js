import PropTypes from "prop-types";
import AquaAppLoader from "./AquaAppLoader";

const Spinner = ({ color, size, message, variant }) => {
  const resolvedVariant = variant || (size === "sm" ? "inline" : "section");

  return (
    <AquaAppLoader
      variant={resolvedVariant}
      size={size}
      message={message || "Loading Aquakart"}
      subtext="Please wait while we prepare the latest details."
      showText={resolvedVariant !== "inline"}
      className={color ? "" : ""}
    />
  );
};

Spinner.propTypes = {
  color: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  message: PropTypes.string,
  variant: PropTypes.oneOf(["screen", "route", "section", "inline"]),
};

Spinner.defaultProps = {
  color: "emerald",
  size: "lg",
  message: "Loading Aquakart",
  variant: undefined,
};

export default Spinner;
