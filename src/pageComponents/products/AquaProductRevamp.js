import React, { useState, useEffect, useMemo, Suspense } from "react";
import {
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RefreshCcw,
  PhoneCall,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import useEmblaCarousel from "embla-carousel-react";
import { useSelector } from "react-redux";
import useProduct from "@/utils/product";
import AquaHeader from "@/components/Layout/Header";
import AquaFooter from "@/components/Layout/Footer";
import AquaCartDrawer from "@/components/common/commonDrawers/cartDrawer";
import AquafavDrawer from "@/components/common/commonDrawers/favDrawer";
import AquaUserDataDrawer from "@/components/common/commonDrawers/userDataDrawer";
import AquaUserAuthDialog from "@/components/common/commonDialogs/authDialog";
import AquaCartAddressDialog from "@/components/common/commonDialogs/cartAddress";
import AquaTailwindToast from "@/components/toast/TailwindToast";
import AquaToast from "@/components/reusables/toast";

// Lazy load related products to improve initial load
const AquaRelatedProductCard = React.lazy(
  () => import("@/components/cards/RelatedProductCard"),
);

const DEFAULT_FALLBACK_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

// --- Utility Functions ---
const resolveDisplayText = (input) => {
  if (input === null || input === undefined) return "";
  if (typeof input === "string") return input.trim();
  if (typeof input === "number" || typeof input === "boolean")
    return String(input);
  if (Array.isArray(input)) {
    return input
      .map((item) => resolveDisplayText(item))
      .filter((item) => item && item.length > 0)
      .join(", ");
  }
  if (typeof input === "object") {
    const candidateKeys = [
      "title",
      "name",
      "label",
      "value",
      "displayName",
      "slug",
      "text",
    ];
    for (const key of candidateKeys) {
      if (input[key]) return resolveDisplayText(input[key]);
    }
  }
  return "";
};

const normalizeImages = (photos, fallbackImage) => {
  if (Array.isArray(photos) && photos.length > 0) {
    return photos
      .map((photo, index) => {
        if (photo?.secure_url)
          return { id: photo._id || `photo-${index}`, url: photo.secure_url };
        if (typeof photo === "string")
          return { id: `photo-${index}`, url: photo };
        return null;
      })
      .filter(Boolean);
  }
  return [{ id: "fallback", url: fallbackImage || DEFAULT_FALLBACK_IMAGE }];
};

const formatIndianCurrency = (value) => {
  if (value === null || value === undefined) return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;
  return amount.toLocaleString("en-IN");
};

// --- Sub-components ---

const AccordionItem = ({ title, children, defaultOpen = false }) => (
  <Disclosure
    as="div"
    className="border-b border-white/40 last:border-0"
    defaultOpen={defaultOpen}
  >
    {({ open }) => (
      <>
        <DisclosureButton className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-slate-900 hover:text-emerald-600 focus:outline-none">
          <span>{title}</span>
          <ChevronDown
            className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </DisclosureButton>
        <DisclosurePanel className="pb-4 text-sm text-slate-600 leading-relaxed">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </DisclosurePanel>
      </>
    )}
  </Disclosure>
);

const ImageGallery = ({ images, title }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  const scrollTo = (index) => emblaApi && emblaApi.scrollTo(index);

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile/Main Carousel */}
      <div
        className="relative overflow-hidden bg-white lg:rounded-2xl lg:border lg:border-white/50 lg:bg-white/40 lg:shadow-glass lg:backdrop-blur-xl"
        ref={emblaRef}
      >
        <div className="flex touch-pan-y">
          {images.map((img) => (
            <div className="relative flex-[0_0_100%] min-w-0" key={img.id}>
              <div className="relative flex aspect-square w-full items-center justify-center bg-white">
                <img
                  src={img.url}
                  alt={title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 lg:hidden">
          {images.map((_, idx) => (
            <button
              key={idx}
              className={`h-2 w-2 rounded-full transition-all ${idx === selectedIndex ? "w-4 bg-emerald-600" : "bg-slate-300"}`}
              onClick={() => scrollTo(idx)}
            />
          ))}
        </div>
      </div>

      {/* Desktop Thumbnails */}
      <div className="hidden grid-cols-5 gap-3 lg:grid">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => scrollTo(idx)}
            className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${idx === selectedIndex ? "border-emerald-500 bg-white/80 ring-4 ring-emerald-500/20" : "border-transparent bg-white/30 hover:bg-white/50"}`}
          >
            <img
              src={img.url}
              alt=""
              className="h-full w-full object-contain p-1"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const ProductInfo = ({ icon: Icon, title, desc }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md">
    <div className="rounded-xl bg-gradient-to-br from-white to-emerald-50 p-2.5 text-emerald-600 shadow-inner">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-0.5 text-xs leading-snug text-slate-500">{desc}</p>
    </div>
  </div>
);

// --- Main Component ---

function AquaProductRevamp({
  product,
  related,
  stockCount = 0,
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  // Data Preparation
  const images = useMemo(
    () => normalizeImages(product?.photos, fallbackImage),
    [product, fallbackImage],
  );
  const relatedProducts = useMemo(
    () =>
      Array.isArray(related) ? related.filter((i) => i.slug || i._id) : [],
    [related],
  );

  // Redux & Hooks
  const { cartData = [], favData = [] } = useSelector((state) => ({
    cartData: state.cartData,
    favData: state.favData,
  }));
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();

  useEffect(() => {
    if (!product?._id) return;
    setIsInCart(cartData.some((item) => item?._id === product?._id));
    setIsFavorite(favData.some((item) => item?._id === product?._id));
  }, [cartData, favData, product]);

  // Carousel Logic for Related Products
  const [relatedProductRef, relatedProductApi] = useEmblaCarousel({
    align: "center",
    loop: true,
    slidesToScroll: 1,
  });

  const scrollPrev = () => relatedProductApi && relatedProductApi.scrollPrev();
  const scrollNext = () => relatedProductApi && relatedProductApi.scrollNext();

  const handleCart = () => AddAndRemoveCart(product, setIsInCart);
  const handleFav = () => AddAndRemoveFav(product, setIsFavorite);
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.title,
          text: `Check out ${product?.title} on Aquakart`,
          url: window.location.href,
        });
      }
    } catch (e) {
      console.log("Share failed", e);
    }
  };

  // Derived Values
  const price = product?.discountPriceStatus
    ? product?.discountPrice
    : product?.price;
  const originalPrice = product?.discountPriceStatus ? product?.price : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const ratingValue = Number(product?.rating?.value) || 0;
  const ratingCount = Number(product?.rating?.count) || 0;

  const specs = useMemo(
    () =>
      [
        { label: "Brand", value: product?.brand },
        { label: "Model", value: product?.model },
        { label: "Warranty", value: product?.warranty },
        { label: "Capacity", value: product?.capacity },
      ].filter((i) => i.value),
    [product],
  );

  return (
    <>
      <AquaHeader />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 font-sans text-slate-900 selection:bg-emerald-100 rounded-2xl m-3">
        <AquaCartAddressDialog />
        <AquaUserDataDrawer />
        <AquaUserAuthDialog />

        <AquaCartDrawer />
        <AquafavDrawer />
        <AquaTailwindToast />
        <AquaToast />

        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Images (Sticky on Desktop) */}
            <div className="lg:col-span-7">
              <div className="lg:sticky lg:top-24">
                <ImageGallery images={images} title={product?.title} />
              </div>
            </div>

            {/* Right Column: Product Details (Scrollable) */}
            <div className="flex flex-col gap-8 lg:col-span-5">
              {/* Header Section */}
              <div>
                <div className="flex items-center justify-between">
                  <nav className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Home</span>
                    <span>/</span>
                    <span className="font-medium text-slate-900 truncate max-w-[200px]">
                      {resolveDisplayText(product?.category) || "Product"}
                    </span>
                  </nav>
                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <Share2 size={20} />
                    </button>
                    <button
                      onClick={handleFav}
                      className={`rounded-full p-2 transition-colors ${isFavorite ? "text-red-500 bg-red-50" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                    >
                      <Heart
                        size={20}
                        fill={isFavorite ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </div>

                <h1 className="mt-4 text-3xl font-bold text-slate-900 leading-tight lg:text-4xl">
                  {product?.title}
                </h1>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    <span>{ratingValue.toFixed(1)}</span>
                    <Star size={14} fill="currentColor" />
                    <span className="text-emerald-700/60">
                      | {ratingCount} Ratings
                    </span>
                  </div>
                  {stockCount > 0 ? (
                    <span className="text-sm font-medium text-emerald-600">
                      In Stock
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-red-600">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Price Section */}
              <div className="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-md">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-slate-900">
                    ₹{formatIndianCurrency(price)}
                  </span>
                  {originalPrice && (
                    <>
                      <span className="text-lg text-slate-500 line-through">
                        ₹{formatIndianCurrency(originalPrice)}
                      </span>
                      <span className="text-lg font-bold text-emerald-600">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Inclusive of all taxes
                </p>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleCart}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition-all active:scale-95 ${
                      isInCart
                        ? "bg-emerald-700 hover:bg-emerald-800"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border border-transparent"
                    }`}
                  >
                    <ShoppingCart size={20} />
                    {isInCart ? "Go to Cart" : "Add to Cart"}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-transparent py-3.5 font-bold text-slate-900 transition-all hover:bg-slate-50 active:scale-95">
                    Buy Now
                  </button>
                </div>
              </div>

              {/* Info Tiles */}
              <div className="grid grid-cols-2 gap-3">
                <ProductInfo
                  icon={Truck}
                  title="Free Delivery"
                  desc="Across India"
                />
                <ProductInfo
                  icon={ShieldCheck}
                  title="Warranty"
                  desc={
                    specs.find((s) => s.label === "Warranty")?.value ||
                    "1 Year Standard"
                  }
                />
                <ProductInfo
                  icon={RefreshCcw}
                  title="Easy Return"
                  desc="7 Days Policy"
                />
                <ProductInfo
                  icon={PhoneCall}
                  title="Support"
                  desc="24/7 Assistance"
                />
              </div>

              {/* Product Highlights/Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Highlights</h3>
                <div className="prose prose-sm prose-slate max-w-none text-slate-600">
                  <div
                    dangerouslySetInnerHTML={{ __html: product?.description }}
                  />
                </div>
              </div>

              {/* Specifications Accordion */}
              <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-md">
                <div className="px-6 py-2">
                  <AccordionItem
                    title="Product Specifications"
                    defaultOpen={true}
                  >
                    <div className="grid grid-cols-1 gap-y-3 pt-2">
                      {specs.map((spec, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-2 gap-4 border-b border-dashed border-slate-200 pb-3 last:border-0 last:pb-0"
                        >
                          <span className="text-slate-500">{spec.label}</span>
                          <span className="font-medium text-slate-900">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                  <AccordionItem title="Manufacturing Details">
                    <p>Details about manufacturing and origin...</p>
                  </AccordionItem>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="mb-8 text-2xl font-bold text-slate-900 text-center lg:text-left">
                Similar Products
              </h2>

              {/* Similar Products Carousel */}
              <div className="relative group">
                <div className="overflow-hidden p-2" ref={relatedProductRef}>
                  <div className="flex gap-6">
                    <Suspense
                      fallback={
                        <div className="h-96 w-full flex-shrink-0 animate-pulse rounded-2xl bg-white/50" />
                      }
                    >
                      {relatedProducts.map((item) => (
                        <div
                          key={item._id}
                          className="min-w-[280px] sm:min-w-[320px] flex-shrink-0"
                        >
                          <AquaRelatedProductCard product={item} />
                        </div>
                      ))}
                    </Suspense>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <button
                  onClick={scrollPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-lg transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:scale-110 opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-lg transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:scale-110 opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed"
                  aria-label="Next slide"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <AquaFooter />
    </>
  );
}

export default AquaProductRevamp;
