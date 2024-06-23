import React from "react";

const AquaSkeletonCategoryCard = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 animate-pulse">
      <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-lg bg-gray-200">
        <div className="w-full h-full bg-gray-300"></div>
      </div>
      <div className="mt-4">
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        <div className="mt-2 h-4 bg-gray-300 rounded w-full"></div>
      </div>
    </div>
  );
};

export default AquaSkeletonCategoryCard;
