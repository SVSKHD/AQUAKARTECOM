import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import { useSelector } from "react-redux";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import AquaImage from "../images/AquaImage";

const ReusableProductCard = ({ product }) => {
  const [fav, setAddFav] = useState(false);
  const [cart, setAddCart] = useState(false);
  const { formatCurrencyINR } = useCurrency;
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const { cartData, favData } = useSelector((state) => ({ ...state }));
  const { title, photos, price, slug, discountPrice, discountPriceStatus } = product;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const isProductInCart = cartData.some((item) => item._id === product?._id);
    const isProductInFav = favData.some((item) => item._id === product?._id);
    setAddCart(isProductInCart);
    setAddFav(isProductInFav);
  }, [cartData, product?._id, favData]);

  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
      emblaApi.on("select", onSelect);
      return () => emblaApi.off("select", onSelect);
    }
  }, [emblaApi]);

  return (
    <div className="bg-white relative mb-5 shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-xl">
      {/* Full-Width Image Carousel */}
      <div className="relative w-full overflow-hidden rounded-t-xl">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                className="flex-shrink-0 w-full h-80"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0.5,
                  scale: activeIndex === index ? 1 : 0.9,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <AquaImage
                  src={photo?.secure_url}
                  alt={title}
                  customClass="h-full w-full object-cover object-center"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => AddAndRemoveFav(product, setAddFav)}
          className={`absolute top-4 right-4 z-10 p-3 rounded-full transition-all duration-300 shadow-lg ${
            fav
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-600"
          }`}
        >
          <FaHeart size={20} />
        </button>

        {/* Timeline Indicators */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {photos.map((_, index) => (
            <div
              key={index}
              className={`w-4 h-1 rounded-full cursor-pointer transition-all duration-300 ${
                activeIndex === index ? "bg-blue-500 scale-125" : "bg-gray-300"
              }`}
              onClick={() => emblaApi && emblaApi.scrollTo(index)}
            ></div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          <a href={`/product/${slug}`}>{title}</a>
        </h3>
        <p className="text-lg font-bold text-gray-800">
  {discountPriceStatus ? (
    <>
      <span className="text-red-600">{formatCurrencyINR(discountPrice)}</span>
      <span className="text-sm text-gray-500 line-through ml-2">
        {formatCurrencyINR(price)}
      </span>
    </>
  ) : (
    formatCurrencyINR(price)
  )}
</p>
        <div className="flex mt-4 space-x-4">
          <button
            onClick={() => AddAndRemoveCart(product, setAddCart)}
            className={`flex-1 py-3 rounded-lg text-white font-medium shadow-md transition-all duration-300 ${
              cart
                ? "bg-green-500 hover:bg-green-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {cart ? "In Cart" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReusableProductCard;
