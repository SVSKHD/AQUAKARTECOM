import React from "react";
import PropTypes from "prop-types";

const AquaSpinner = ({ color }) => {
  const colorClass = `border-t-2 border-b-2 border-${color}-500`;

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full h-8 w-8 ${colorClass}`}></div>
    </div>
  );
};

AquaSpinner.propTypes = {
  color: PropTypes.string,
};

AquaSpinner.defaultProps = {
  color: "blue",
};

export default AquaSpinner;
