import React, { useState, useEffect, Suspense, useCallback } from "react";
import { ShoppingCart, Heart, BookHeart } from "lucide-react";
import EmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import AquaHeader from "@/components/Layout/Header";
import AquaFooter from "@/components/Layout/Footer";
import useProduct from "@/utils/product";
import { useSelector } from "react-redux";
import AquafavDrawer from "@/components/common/commonDrawers/favDrawer";
import AquaCartDrawer from "@/components/common/commonDrawers/cartDrawer";

const AquaRelatedProductCard = React.lazy(
  () => import("@/components/cards/RelatedProductCard"),
);

function AquaServerDynamicProduct({ product, related }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [emblaRef, emblaApi] = EmblaCarousel({ loop: true });
  const [progress, setProgress] = useState(0);
  const [cart, setCart] = useState(false);

  const { cartData, favData } = useSelector((state) => ({ ...state }));

  // store
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();

  const calculateDiscount = () => {
    if (product.discountPriceStatus && product.discountPrice) {
      const discount =
        ((product.price - product.discountPrice) / product.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const handleAddToCart = () => {
    AddAndRemoveCart(product, setCart);
  };

  const handleAddToFav = () => {
    AddAndRemoveFav(product, setIsFavorite);
  };

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentImageIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!product) return;

    // Reset cart and favorite states for the current product
    const isProductInCart = cartData?.some((item) => item._id === product?._id);
    const isProductInFav = favData?.some((item) => item._id === product?._id);

    setCart(isProductInCart);
    setIsFavorite(isProductInFav);
  }, [cartData, favData, product]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);

    const interval = setInterval(() => {
      if (progress >= 100) {
        emblaApi.scrollNext();
        setProgress(0);
      } else {
        setProgress((prev) => prev + 1);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [emblaApi, progress, onSelect]);




  return (
    <div>
      <AquaHeader />
 
      <AquaCartDrawer />
      <AquafavDrawer />
      <div className="bg-white">
        <div className="mx-auto max-w-7xl sm:px-6 sm:pt-16 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="md:sticky md:top-8 p-8">
              <div className="relative space-y-4">
                {/* Main Image */}
                <div className="relative rounded-lg overflow-hidden">
                  <motion.img
                    key={product?.photos[currentImageIndex]?.secure_url}
                    src={product?.photos[currentImageIndex]?.secure_url}
                    alt={product?.title}
                    className="w-full h-full object-contain bg-white"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                  <button
                    onClick={handleAddToFav}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
                  >
                    <Heart
                      className={`w-6 h-6 ${isFavorite ? "text-red-500" : "text-gray-600"}`}
                    />
                  </button>
                </div>

                {/* Timeline Progress Bars */}
                <div className="flex gap-2 mt-4">
                  {product?.photos?.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-1 rounded ${
                        index === currentImageIndex
                          ? "bg-blue-600"
                          : "bg-gray-200"
                      }`}
                      initial={{ width: "0%" }}
                      animate={{
                        width: index === currentImageIndex ? "100%" : "100%",
                      }}
                      transition={{
                        duration: 3,
                        ease: "easeInOut",
                      }}
                      style={{ flexGrow: 1 }}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
                  {product?.photos?.map((photo, index) => (
                    <button
                      key={photo._id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                        index === currentImageIndex
                          ? "ring-2 ring-blue-500"
                          : "hover:ring-2 hover:ring-blue-200"
                      }`}
                    >
                      <motion.img
                        src={photo.secure_url}
                        alt={`Thumbnail ${index} - ${product?.title}`}
                        className="w-full h-full object-contain bg-white"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      />
                    </button>
                  ))}
                </div>

                {/* Add to Cart Button */}
                <div className="pt-4">
                  <motion.button
                    onClick={handleAddToCart}
                    className={`w-full ${cart ? "bg-green-600" : "bg-blue-600"} text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{cart ? "Added to Cart" : "Add to Cart"}</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="h-[calc(100vh-6rem)] p-8 overflow-y-scroll hide-scrollbar">
              <h1 className="text-3xl font-bold text-gray-900">
                {product?.title}
              </h1>
              <p className="text-lg text-gray-500 mt-2">{product?.brand}</p>
              <div className="mt-4 flex items-baseline space-x-3">
                {product?.discountPriceStatus && product?.discountPrice ? (
                  <>
                    <div className="text-3xl font-bold text-gray-900">
                      ₹{product.discountPrice.toLocaleString()}
                    </div>
                    <div className="text-xl text-gray-500 line-through">
                      ₹{product?.price?.toLocaleString()}
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {calculateDiscount()}% off
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{product?.price?.toLocaleString()}
                  </div>
                )}
              </div>
              <div
                className="prose prose-lg max-w-none mt-6"
                dangerouslySetInnerHTML={{ __html: product?.description }}
              />
            </div>
          </div>

          {/* Related Products */}
          <div className="p-3">
            <h2 className="text-3xl text-gray-800">Related Products</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Suspense fallback={<div>Loading Related Products...</div>}>
              {related?.map((product) => (
                <AquaRelatedProductCard key={product._id} product={product} />
              ))}
            </Suspense>
          </div>
        </div>
      </div>
      <AquaFooter />
    </div>
  );
}

export default AquaServerDynamicProduct;
