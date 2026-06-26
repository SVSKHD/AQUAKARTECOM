import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
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
  Button,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import useEmblaCarousel from "embla-carousel-react";
import { useSelector } from "react-redux";
import useProduct from "@/utils/product";
import ProductServiceOperations from "@/services/products";
import { useRouter } from "next/navigation";
import AquaLayout from "@/components/Layout/Layout";
import AquaPreloader from "@/components/reusables/preloader";
import LazyImage from "@/components/image/LazyImage";
import ProductReviews from "@/components/reviews/ProductReviews";

const AquaRelatedProductCard = React.lazy(
  () => import("@/components/cards/RelatedProductCard"),
);

const DEFAULT_FALLBACK_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const resolveDisplayText = (input) => {
  if (input === null || input === undefined) return "";
  if (typeof input === "string") return input.trim();
  if (typeof input === "number" || typeof input === "boolean") return String(input);
  if (Array.isArray(input)) {
    return input
      .map((item) => resolveDisplayText(item))
      .filter((item) => item && item.length > 0)
      .join(", ");
  }
  if (typeof input === "object") {
    const candidateKeys = ["title", "name", "label", "value", "displayName", "slug", "text"];
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
        if (photo?.secure_url) return { id: photo._id || `photo-${index}`, url: photo.secure_url };
        if (typeof photo === "string") return { id: `photo-${index}`, url: photo };
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

const AccordionItem = ({ title, children, defaultOpen = false }) => (
  <Disclosure
    as="div"
    className="border-b border-white/40 last:border-0"
    defaultOpen={defaultOpen}
  >
    {({ open }) => (
      <>
        <DisclosureButton className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-slate-900 transition hover:text-emerald-600 focus:outline-none">
          <span>{title}</span>
          <ChevronDown
            className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </DisclosureButton>
        <DisclosurePanel className="pb-4 text-sm leading-relaxed text-slate-600">
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index) => {
      emblaApi?.scrollTo(index);
      setSelectedIndex(index);
    },
    [emblaApi],
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-white/70"
        ref={emblaRef}
      >
        <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-2">
          {images.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 overflow-hidden rounded-full bg-slate-900/15 backdrop-blur-sm"
            >
              <div
                className={`h-full rounded-full bg-emerald-500 transition-all duration-300 ${idx <= selectedIndex ? "w-full" : "w-0"}`}
              />
            </div>
          ))}
        </div>

        <div className="flex touch-pan-y">
          {images.map((img, idx) => (
            <div className="relative min-w-0 flex-[0_0_100%]" key={img.id}>
              <div className="relative flex aspect-square w-full items-center justify-center bg-white p-4 sm:p-6">
                <LazyImage
                  src={img.url}
                  alt={title}
                  className="h-full w-full"
                  imgClassName="max-h-full max-w-full object-contain"
                  fill
                  priority={idx === 0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden grid-cols-5 gap-3 lg:grid">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => scrollTo(idx)}
            className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-white/70 transition-all ${idx === selectedIndex ? "border-emerald-500 ring-4 ring-emerald-500/15" : "border-transparent hover:border-emerald-200"}`}
          >
            <img
              src={img.url}
              alt=""
              className="h-full w-full object-contain p-1.5"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const ProductInfo = ({ icon: Icon, title, desc }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="rounded-xl bg-gradient-to-br from-white to-emerald-50 p-2.5 text-emerald-600 shadow-inner">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-0.5 text-xs leading-snug text-slate-500">{desc}</p>
    </div>
  </div>
);

function AquaProductRevamp({
  product,
  related,
  stockCount = 0,
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!product?._id) return;
    setReviewsLoading(true);
    try {
      const res = await ProductServiceOperations.GetProductReviews(product._id);
      const payload = res?.data?.data || res?.data || {};
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.reviews)
          ? payload.reviews
          : [];
      setReviews(list);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, [product?._id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const reviewStats = useMemo(() => {
    const total = reviews.length;
    if (!total) return { avg: 0, total: 0 };
    const sum = reviews.reduce((acc, review) => acc + (review?.rating || 0), 0);
    return { avg: Math.round((sum / total) * 10) / 10, total };
  }, [reviews]);

  const router = useRouter();
  const images = useMemo(
    () => normalizeImages(product?.photos, fallbackImage),
    [product, fallbackImage],
  );
  const relatedProducts = useMemo(
    () => (Array.isArray(related) ? related.filter((item) => item.slug || item._id) : []),
    [related],
  );

  const { cartData, favData } = useSelector((state) => ({
    cartData: state.cartData,
    favData: state.favData,
  }));
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();

  useEffect(() => {
    if (!product?._id) return;
    setIsInCart(cartData.some((item) => item?._id === product?._id));
    setIsFavorite(favData.some((item) => item?._id === product?._id));
  }, [cartData, favData, product]);

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
    } catch (error) {
      console.log("Share failed", error);
    }
  };

  const handleRedirectToCheckout = () => {
    if (!isInCart) {
      AddAndRemoveCart(product, setIsInCart);
    }
    router.push("/checkout");
  };

  const price = product?.discountPriceStatus ? product?.discountPrice : product?.price;
  const originalPrice = product?.discountPriceStatus ? product?.price : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const categoryLabel = resolveDisplayText(product?.category) || "Product";

  const specs = useMemo(
    () =>
      [
        { label: "Brand", value: product?.brand },
        { label: "Model", value: product?.model },
        { label: "Warranty", value: product?.warranty },
        { label: "Capacity", value: product?.capacity },
      ].filter((item) => item.value),
    [product],
  );

  return (
    <>
      {isLoading && (
        <AquaPreloader
          message="Preparing product"
          subtext="Loading price, delivery and gallery details."
        />
      )}
      <AquaLayout>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 font-sans text-slate-900 selection:bg-emerald-100">
          <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7">
                <div className="lg:sticky lg:top-28">
                  <ImageGallery images={images} title={product?.title} />
                </div>
              </div>

              <div className="flex flex-col gap-6 lg:col-span-5 lg:pt-1">
                <div className="rounded-[2rem] border border-white/70 bg-white/72 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <span>Home</span>
                      <span>/</span>
                      <span className="max-w-[220px] truncate text-slate-900">
                        {categoryLabel}
                      </span>
                    </nav>
                    <div className="flex gap-2">
                      <button
                        onClick={handleShare}
                        aria-label="Share product"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Share2 size={20} />
                      </button>
                      <button
                        onClick={handleFav}
                        aria-label="Add product to favourites"
                        className={`rounded-full p-2 transition ${isFavorite ? "bg-red-50 text-red-500" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
                      >
                        <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>

                  <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl lg:text-[2.35rem]">
                    {product?.title}
                  </h1>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {reviewStats.total > 0 ? (
                      <a
                        href="#reviews"
                        className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <span>{reviewStats.avg.toFixed(1)}</span>
                        <Star size={14} fill="currentColor" />
                        <span className="text-emerald-700/60">
                          | {reviewStats.total} {reviewStats.total === 1 ? "Review" : "Reviews"}
                        </span>
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-500">
                        <Star size={14} />
                        No reviews yet
                      </span>
                    )}
                    {stockCount > 0 ? (
                      <span className="text-sm font-semibold text-emerald-600">In Stock</span>
                    ) : (
                      <span className="text-sm font-semibold text-red-600">Out of Stock</span>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-slate-950 sm:text-4xl">
                      ₹{formatIndianCurrency(price)}
                    </span>
                    {originalPrice && (
                      <>
                        <span className="text-base text-slate-500 line-through sm:text-lg">
                          ₹{formatIndianCurrency(originalPrice)}
                        </span>
                        <span className="text-base font-extrabold text-emerald-600 sm:text-lg">
                          {discount}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Inclusive of all taxes
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handleCart}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition-all active:scale-95 ${
                        isInCart
                          ? "bg-emerald-700 hover:bg-emerald-800"
                          : "border border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      }`}
                    >
                      <ShoppingCart size={20} />
                      {isInCart ? "Added to Cart" : "Add to Cart"}
                    </button>
                    <Button
                      onClick={handleRedirectToCheckout}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-transparent py-3.5 font-bold text-slate-900 transition-all hover:bg-slate-50 active:scale-95"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ProductInfo icon={Truck} title="Free Delivery" desc="Across India" />
                  <ProductInfo
                    icon={ShieldCheck}
                    title="Warranty"
                    desc={specs.find((item) => item.label === "Warranty")?.value || "1 Year Standard"}
                  />
                  <ProductInfo icon={RefreshCcw} title="Easy Return" desc="7 Days Policy" />
                  <ProductInfo icon={PhoneCall} title="Support" desc="24/7 Assistance" />
                </div>

                <div className="rounded-[1.75rem] border border-white/70 bg-white/72 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                  <h3 className="text-lg font-extrabold text-slate-950">Highlights</h3>
                  <div className="prose prose-sm prose-slate mt-4 max-w-none text-slate-600">
                    <div dangerouslySetInnerHTML={{ __html: product?.description }} />
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/72 shadow-sm backdrop-blur-xl">
                  <div className="px-6 py-2">
                    <AccordionItem title="Product Specifications" defaultOpen>
                      <div className="grid grid-cols-1 gap-y-3 pt-2">
                        {specs.map((spec) => (
                          <div
                            key={spec.label}
                            className="grid grid-cols-2 gap-4 border-b border-dashed border-slate-200 pb-3 last:border-0 last:pb-0"
                          >
                            <span className="text-slate-500">{spec.label}</span>
                            <span className="font-semibold text-slate-900">{spec.value}</span>
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

            <div id="reviews" className="mt-14">
              <ProductReviews
                productId={product?._id}
                reviews={reviews}
                loading={reviewsLoading}
                onReviewsChange={fetchReviews}
              />
            </div>

            {relatedProducts.length > 0 && (
              <div className="mt-20">
                <h2 className="mb-8 text-center text-2xl font-bold text-slate-900 lg:text-left">
                  Similar Products
                </h2>

                <div className="group relative">
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
                            className="min-w-[280px] flex-shrink-0 sm:min-w-[320px]"
                          >
                            <AquaRelatedProductCard product={item} />
                          </div>
                        ))}
                      </Suspense>
                    </div>
                  </div>

                  <button
                    onClick={scrollPrev}
                    className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-3 text-slate-600 opacity-0 shadow-lg transition-all hover:scale-110 hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={scrollNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full border border-slate-200 bg-white p-3 text-slate-600 opacity-0 shadow-lg transition-all hover:scale-110 hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AquaLayout>
    </>
  );
}

export default AquaProductRevamp;
