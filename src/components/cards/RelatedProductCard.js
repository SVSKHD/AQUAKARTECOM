import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Check } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import useProduct from "@/utils/product";

const AquaRelatedProductCard = ({ product }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const { cartData, favData } = useSelector((state) => ({ ...state }));

  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
      emblaApi.on("select", onSelect);
      return () => emblaApi.off("select", onSelect);
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!product) return;

    const isProductInCart = cartData?.some((item) => item._id === product?._id);
    const isProductInFav = favData?.some((item) => item._id === product?._id);

    setIsFavorite(isProductInFav);
    setIsInCart(isProductInCart);
  }, [cartData, favData, product]);

  const handleAddToCart = () => {
    AddAndRemoveCart(product, setIsInCart);
  };

  const handleAddToFav = () => {
    AddAndRemoveFav(product, setIsFavorite);
  };

  return (
    <div className="max-w-sm rounded-md overflow-hidden shadow-lg bg-white border border-gray-200 m-2">
      <div className="relative">
        {/* Embla Carousel */}
        <div className="overflow-hidden rounded-t-md" ref={emblaRef}>
          <div className="flex">
            {product?.photos.map((photo, index) => (
              <motion.div
                key={index}
                className="flex-shrink-0 w-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0.5,
                  scale: activeIndex === index ? 1 : 0.9,
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
              >
                <img
                  className="w-full object-cover"
                  src={photo?.secure_url}
                  alt={product.name}
                  style={{ height: "auto", maxHeight: "370px" }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Favorite Button */}
        <motion.div
          className="absolute top-2 right-2"
          whileTap={{ scale: 0.8 }}
          onClick={handleAddToFav}
        >
          <button
            className={`p-2 rounded-full shadow ${
              isFavorite ? "bg-red-100" : "bg-white"
            } hover:bg-gray-100`}
          >
            <motion.div
              animate={{
                scale: isFavorite ? 1.3 : 1,
                color: isFavorite ? "#ef4444" : "#4b5563",
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 20,
              }}
            >
              <Heart className="w-6 h-6" />
            </motion.div>
          </button>
        </motion.div>

        {/* Timeline Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {product?.photos.map((_, index) => (
            <div
              key={index}
              className={`relative w-10 h-1 ${
                activeIndex === index ? "bg-blue-500" : "bg-gray-300"
              } overflow-hidden rounded-full cursor-pointer`}
              onClick={() => emblaApi && emblaApi.scrollTo(index)}
            ></div>
          ))}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          <Link href={`/product/${product?.slug}`}>{product?.title}</Link>
        </h2>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">
            ₹{product.price}
          </span>
          <motion.button
            className={`relative ${
              isInCart ? "bg-green-500" : "bg-blue-500"
            } text-white px-4 py-2 rounded-xl hover:opacity-80 transition flex items-center`}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
          >
            {isInCart ? (
              <>
                <Check className="w-6 h-6 mr-2" />
                <span>In Cart</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-6 h-6 mr-2" />
                <span>Add to Cart</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AquaRelatedProductCard;
