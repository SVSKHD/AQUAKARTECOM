import React from "react";
import PropTypes from "prop-types";

const Spinner = ({ color, size }) => {
  const sizeClass = size === "sm" ? "loading-sm" : size === "md" ? "loading-md" : "loading-lg";
  const style = {
    color: color,
  };

  return <span className={`loading loading-infinity ${sizeClass}`} style={style}></span>;
};

Spinner.propTypes = {
  color: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
};

Spinner.defaultProps = {
  color: "#000", // Default color is black
  size: "lg",    // Default size is large
};

export default Spinner;
