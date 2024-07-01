import React from 'react';

const AquaProductCard = ({ product}) => {
    const {title, photos, price, href, color } = product
  return (
    <div className="relative">
      <div className="relative h-72 w-full overflow-hidden rounded-lg">
        <img
          src={photos[0].secure_url}
          alt={title}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="relative mt-4">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{color}</p>
      </div>
      <div className="absolute inset-x-0 top-0 flex h-72 items-end justify-end overflow-hidden rounded-lg p-4">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black opacity-50"
        />
        <p className="relative text-lg font-semibold text-white">{price}</p>
      </div>
      <div className="mt-6">
        <a
          href={href}
          className="relative flex items-center justify-center rounded-md border border-transparent bg-gray-100 px-8 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
        >
          Add to bag<span className="sr-only">, {title}</span>
        </a>
      </div>
    </div>
  );
};

export default AquaProductCard;
