import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';

const AquaRelatedProductCard = ({ product }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
      emblaApi.on('select', onSelect);
      return () => emblaApi.off('select', onSelect);
    }
  }, [emblaApi]);

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000); // Reset the animation state after 1 second
  };

  return (
    <div className="max-w-sm rounded-md overflow-hidden shadow-lg bg-white border border-gray-200 m-2">
      <div className="relative">
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
                  ease: 'easeInOut',
                }}
              >
                <img
                  className="w-full object-cover"
                  src={photo?.secure_url}
                  alt={product.name}
                  style={{ height: 'auto', maxHeight: '370px' }}
                />
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div
          className="absolute top-2 right-2"
          whileTap={{ scale: 0.8 }}
          onClick={() => setIsFavorite(!isFavorite)}
        >
          <button
            className={`p-2 rounded-full shadow ${
              isFavorite ? 'bg-red-100' : 'bg-white'
            } hover:bg-gray-100`}
          >
            <motion.div
              animate={{
                scale: isFavorite ? 1.3 : 1,
                color: isFavorite ? '#ef4444' : '#4b5563',
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 20,
              }}
            >
              <Heart className="w-6 h-6" />
            </motion.div>
          </button>
        </motion.div>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {product?.photos.map((_, index) => (
            <div
              key={index}
              className={`relative w-10 h-1 ${
                activeIndex === index ? 'bg-blue-500' : 'bg-gray-300'
              } overflow-hidden rounded-full cursor-pointer`}
              onClick={() => emblaApi && emblaApi.scrollTo(index)}
            ></div>
          ))}
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">{product?.title}</h2>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
          <motion.button
            className="bg-white text-gray-900 px-4 py-2 rounded-xl hover:bg-green-800 hover:text-white transition flex items-center"
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-6 h-6 mr-3" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: isAddingToCart ? 1 : 0 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 20,
              }}
              className="absolute top-[-10px] right-[-10px] bg-green-500 text-white rounded-full text-xs px-2 py-1"
            >
              Added!
            </motion.span>
            Add to Cart
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AquaRelatedProductCard;

// Usage example:
// const product = {
//   title: 'Modern Desk Lamp',
//   price: 7469,
//   photos: [
//     { secure_url: 'https://via.placeholder.com/300x200' },
//     { secure_url: 'https://via.placeholder.com/300x200' },
//   ],
// };

// <AquaRelatedProductCard product={product} />