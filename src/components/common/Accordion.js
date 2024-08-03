import React, { useState } from "react";

const AquaAccordion = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-md mb-2">
          <button
            onClick={() => handleToggle(index)}
            className="w-full flex justify-between items-center px-4 py-2 text-left text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring focus:ring-indigo-500"
          >
            <span>{item.title}</span>
            <svg
              className={`w-6 h-6 transition-transform transform ${
                activeIndex === index ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>
          {activeIndex === index && (
            <div className="px-4 py-2 text-gray-700 bg-white">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AquaAccordion;
