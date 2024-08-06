import React from "react";
import PropTypes from "prop-types";

const AquaSpinner = ({ color }) => {
  const colorClasses = {
    blue: "border-t-2 border-b-2 border-blue-500",
    red: "border-t-2 border-b-2 border-red-500",
    green: "border-t-2 border-b-2 border-green-500",
    yellow: "border-t-2 border-b-2 border-yellow-500",
    // Add more colors as needed
  };

  const colorClass = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full h-8 w-8 ${colorClass}`}></div>
    </div>
  );
};

AquaSpinner.propTypes = {
  color: PropTypes.oneOf(["blue", "red", "green", "yellow"]), // Add more colors as needed
};

AquaSpinner.defaultProps = {
  color: "blue",
};

export default AquaSpinner;