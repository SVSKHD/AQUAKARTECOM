import React from 'react';
import {FaShare} from "react-icons/fa"

const AquaCategoryCard = ({ category }) => {
    const {title, photos, price, href, color , _id } = category
  return (
    <div className="group relative">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
        <img
          src={photos[0].secure_url}
          alt={title}
          className="h-full w-full object-cover object-center lg:h-full lg:w-full"
        />
      </div>
      <div className="mt-4 flex justify-between">
        <div>
          <h3 className="text-md font-bold text-gray-700">
            <a href={`/category/${_id}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {title}
            </a>
          </h3>
        </div>
        <button className="text-sm font-medium text-gray-900"><FaShare/></button>
      </div>
    </div>
  );
};

export default AquaCategoryCard;
