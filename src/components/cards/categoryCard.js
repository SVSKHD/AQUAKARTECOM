import React, { useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";

// Component to display each category
const AquaCategoryCard = ({ category }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleReadMore = () => {
    router.push(`/category/${category.title}`);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={category.photos[0].secure_url}
          alt={category.title}
          className="object-cover object-center"
        />
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-900">
          {category.title.toUpperCase()}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {isExpanded
            ? category.description
            : `${category.description.substring(0, 100)}...`}
        </p>
        <button
          onClick={handleReadMore}
          className="text-indigo-600 hover:text-indigo-500 text-sm"
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      </div>
    </div>
  );
};

AquaCategoryCard.propTypes = {
  category: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        secure_url: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
};

export default AquaCategoryCard;
