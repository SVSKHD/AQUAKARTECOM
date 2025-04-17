import React, { useState } from 'react';
import { Heart, ShoppingCart, Share2, Bookmark, MoreHorizontal, Play, Star } from 'lucide-react';
import AQ from "@/assests/logo-white.png";
import Image from 'next/image';

const DashboardProductCard =({ product })=> {
  const [currentImage, setCurrentImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const {
    title: productName,
    brand,
    brandLogo,
    photos = [],
    price,
    rating,
    reviews,
    description,
    inStock,
    likes,
    views,
    caption,
    timestamp,
    user = {} // fallback if it's a user-generated post
  } = product;

  const images = photos.map((photo) => photo.secure_url);
  const brandName = brand;
  const username = user.username || "aquakart";
  const userAvatar = user.avatar || "/avatar.jpg";

  const isProduct = Boolean(productName && brandName);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      className="relative bg-black rounded-xl shadow-lg overflow-hidden max-w-md group"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3">
          {isProduct ? (
            <>
              <Image src={AQ} alt={brandName} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/50" />
              <span className="font-medium text-white">{brandName}</span>
            </>
          ) : (
            <>
              <Image src={AQ} alt={username} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/50" />
              <span className="font-medium text-white">{username}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isProduct && typeof inStock === 'boolean' && (
            <span className={`text-xs ${inStock ? 'bg-green-500' : 'bg-red-500'} text-white px-2 py-1 rounded-full`}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          )}
          <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Image & Navigation */}
      <div className="relative aspect-[9/16]">
        <img
          src={images[currentImage]}
          alt={`Image ${currentImage + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Play Icon on Hover */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0'}`}>
          <Play className="w-16 h-16 text-white/80 fill-white/20" />
        </div>

        {/* Navigation Click Zones */}
        {images.length > 1 && (
          <>
            <button onClick={previousImage} className="absolute left-0 top-0 w-1/2 h-full opacity-0 z-10" />
            <button onClick={nextImage} className="absolute right-0 top-0 w-1/2 h-full opacity-0 z-10" />
          </>
        )}

        {/* Timeline Bars */}
        {images.length > 1 && (
          <div className="absolute top-16 left-4 right-4 flex gap-1 z-20">
            {images.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30">
                <div className={`h-full bg-white transition-all duration-300 ease-out ${currentImage === index ? 'w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>
        )}

        {/* Content Overlay */}
        <div className={`absolute inset-0 bg-black/50 flex flex-col justify-end p-4 transition-opacity duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0'}`}>
          {isProduct ? (
            <>
              <div className="mb-4">
                <h3 className="text-white text-xl font-semibold mb-2">{productName}</h3>
                <p className="text-2xl font-bold text-white">
                  {typeof price === 'number' ? `₹${price.toLocaleString()}` : 'Price unavailable'}
                </p>
              </div>

              {typeof rating === 'number' && typeof reviews === 'number' && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
                      />
                    ))}
                  </div>
                  <span className="text-white text-sm">({reviews} reviews)</span>
                </div>
              )}

              {/* {description && (
                <p className="text-white text-sm mb-4 line-clamp-2">{description}</p>
              )} */}
            </>
          ) : (
            <>
              {(typeof likes === 'number' || typeof views === 'number') && (
                <div className="flex items-center gap-4 mb-4">
                  {typeof likes === 'number' && <span className="text-white text-sm">{likes.toLocaleString()} likes</span>}
                  {typeof views === 'number' && <span className="text-white text-sm">{views.toLocaleString()} views</span>}
                </div>
              )}

              {caption && <p className="text-white text-sm mb-4 line-clamp-2">{caption}</p>}
              {timestamp && <p className="text-white/70 text-xs mb-4">{timestamp}</p>}
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between text-white mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsWishlisted(!isWishlisted)} className="group flex items-center gap-2">
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-white group-hover:scale-110'} transition-transform`} />
                <span className="text-sm">Wishlist</span>
              </button>
              <button className="group flex items-center gap-2">
                <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Share</span>
              </button>
            </div>
            <button onClick={() => setIsSaved(!isSaved)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
            </button>
          </div>

          {/* Add to Cart */}
          {isProduct && (
            <button
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${inStock ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-500 text-white cursor-not-allowed'}`}
              disabled={!inStock}
            >
              <div className="flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardProductCard;