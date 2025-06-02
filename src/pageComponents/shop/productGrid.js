// src/components/products/ProductGrid.jsx
import ReusableProductCard from "@/components/cards/ProductCardTwo";

const ProductGrid = ({ products = [] }) => {
  if (products.length === 0) {
    return <p className="text-gray-500">No products available.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map((product, index) => (
        <ReusableProductCard key={index} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;