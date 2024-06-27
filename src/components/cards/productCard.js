const ProductCard = ({ product }) => {
    return (
      <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="relative h-72 w-full overflow-hidden rounded-lg">
          <img
            src={product.imageSrc}
            alt={product.imageAlt}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 top-0 flex h-72 items-end justify-end overflow-hidden rounded-lg p-4">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black opacity-50"
            />
            <p className="relative text-lg font-semibold text-white">{product.price}</p>
          </div>
        </div>
        <div className="relative mt-4 px-4">
          <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{product.options}</p>
        </div>
        <div className="mt-6 px-4 pb-4">
          <a
            href={product.href}
            className="relative flex items-center justify-center rounded-md border border-transparent bg-gray-100 px-8 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
          >
            Add to bag<span className="sr-only">, {product.name}</span>
          </a>
        </div>
      </div>
    );
  };
  
  export default ProductCard;
  