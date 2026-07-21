import ReusableProductCard from "@/components/cards/ProductCardTwo";
import { motion } from "framer-motion";

const ProductGrid = ({ products = [], viewMode = "grid" }) => {
  if (products.length === 0) {
    return <p className="text-gray-500">No products available.</p>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4"
          : "mx-auto flex max-w-6xl flex-col gap-5"
      }
    >
      {products.map((product, index) => (
        <motion.div
          key={product?._id || index}
          variants={itemVariants}
          className="min-w-0"
        >
          <ReusableProductCard product={product} viewMode={viewMode} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProductGrid;
