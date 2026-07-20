import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Gauge,
  Heart,
  PhoneCall,
  RefreshCcw,
  Rotate3d,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  Waves,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";

import AquaLayout from "@/components/Layout/Layout";
import LazyImage from "@/components/image/LazyImage";
import AquaPreloader from "@/components/reusables/preloader";
import ProductReviews from "@/components/reviews/ProductReviews";
import ProductServiceOperations from "@/services/products";
import useProduct from "@/utils/product";

const AquaRelatedProductCard = React.lazy(
  () => import("@/components/cards/RelatedProductCard"),
);

const DEFAULT_FALLBACK_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const ignoreStateUpdate = () => undefined;

const stripHtml = (value) => {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
};

const resolveDisplayText = (input) => {
  if (input === null || input === undefined) return "";
  if (typeof input === "string") return stripHtml(input).trim();
  if (typeof input === "number" || typeof input === "boolean") {
    return String(input);
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => resolveDisplayText(item))
      .filter(Boolean)
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
      "description",
    ];

    for (const key of candidateKeys) {
      if (input[key] !== null && input[key] !== undefined) {
        const resolved = resolveDisplayText(input[key]);
        if (resolved) return resolved;
      }
    }
  }

  return "";
};

const normalizeImages = (photos, fallbackImage) => {
  if (Array.isArray(photos) && photos.length > 0) {
    const normalized = photos
      .map((photo, index) => {
        if (photo?.secure_url) {
          return {
            id: photo._id || photo.id || `photo-${index}`,
            url: photo.secure_url,
          };
        }
        if (typeof photo === "string") {
          return { id: `photo-${index}`, url: photo };
        }
        return null;
      })
      .filter(Boolean);

    if (normalized.length > 0) return normalized;
  }

  return [{ id: "fallback", url: fallbackImage || DEFAULT_FALLBACK_IMAGE }];
};

const formatIndianCurrency = (value) => {
  if (value === null || value === undefined) return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;
  return amount.toLocaleString("en-IN");
};

const normalizeSpecificationSource = (source) => {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source
      .map((item, index) => {
        if (typeof item === "string") {
          const [label, ...valueParts] = item.split(":");
          return valueParts.length > 0
            ? { label: label.trim(), value: valueParts.join(":").trim() }
            : { label: `Detail ${index + 1}`, value: item.trim() };
        }

        if (item && typeof item === "object") {
          return {
            label: resolveDisplayText(
              item.label || item.title || item.name || item.key,
            ),
            value: resolveDisplayText(
              item.value || item.description || item.text || item.detail,
            ),
          };
        }

        return null;
      })
      .filter((item) => item?.label && item?.value);
  }

  if (typeof source === "object") {
    return Object.entries(source)
      .map(([label, value]) => ({
        label: label.replace(/([a-z])([A-Z])/g, "$1 $2"),
        value: resolveDisplayText(value),
      }))
      .filter((item) => item.value);
  }

  return [];
};

const buildSpecifications = (product) => {
  const primary = [
    { label: "Brand", value: resolveDisplayText(product?.brand) },
    { label: "Model", value: resolveDisplayText(product?.model) },
    { label: "SKU", value: resolveDisplayText(product?.sku) },
    { label: "Capacity", value: resolveDisplayText(product?.capacity) },
    { label: "Coverage", value: resolveDisplayText(product?.coverage) },
    { label: "Warranty", value: resolveDisplayText(product?.warranty) },
    { label: "Manufacturer", value: resolveDisplayText(product?.manufacturer) },
    { label: "Category", value: resolveDisplayText(product?.category) },
  ].filter((item) => item.value);

  const extended = [
    product?.specifications,
    product?.technicalSpecifications,
    product?.specs,
  ].flatMap((source) => normalizeSpecificationSource(source));

  const seen = new Set();
  return [...primary, ...extended]
    .filter((item) => {
      const key = item.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
};

const buildHighlights = (product) => {
  if (Array.isArray(product?.keyHighlights)) {
    const highlights = product.keyHighlights
      .map((item) => resolveDisplayText(item))
      .filter(Boolean)
      .slice(0, 6);
    if (highlights.length > 0) return highlights;
  }

  const description = stripHtml(
    product?.description || product?.shortDescription,
  );
  return description
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 18)
    .slice(0, 4);
};

const normalizeProcessSteps = (source) => {
  if (!Array.isArray(source)) return [];

  return source
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          title: `Step ${index + 1}`,
          description: stripHtml(item),
        };
      }

      if (item && typeof item === "object") {
        return {
          title:
            resolveDisplayText(item.title || item.label || item.name) ||
            `Step ${index + 1}`,
          description: resolveDisplayText(
            item.description || item.text || item.value || item.detail,
          ),
        };
      }

      return null;
    })
    .filter((step) => step?.description)
    .slice(0, 6);
};

const buildProcessStory = (product) => {
  const suppliedSteps = [
    product?.regenerationProcess,
    product?.regenerationSteps,
    product?.processSteps,
    product?.workingProcess,
  ]
    .map((source) => normalizeProcessSteps(source))
    .find((steps) => steps.length > 0);

  const productFingerprint = [
    resolveDisplayText(product?.title),
    resolveDisplayText(product?.category),
    resolveDisplayText(product?.subcategory),
    stripHtml(product?.description),
  ]
    .join(" ")
    .toLowerCase();

  const isSoftener =
    /soften|hard water|resin|brine|regenerat/.test(productFingerprint) ||
    suppliedSteps?.some((step) =>
      /regenerat|brine|backwash|resin/i.test(
        `${step.title} ${step.description}`,
      ),
    );

  if (suppliedSteps) {
    return {
      eyebrow: isSoftener ? "Regeneration cycle" : "Treatment journey",
      title: isSoftener
        ? "How the system renews itself"
        : "How water moves through the system",
      description: isSoftener
        ? "A clear look at the complete regeneration sequence."
        : "A simple step-by-step view of the product's working process.",
      steps: suppliedSteps,
    };
  }

  if (isSoftener) {
    return {
      eyebrow: "Regeneration cycle",
      title: "How the resin gets ready again",
      description:
        "The standard softener cycle restores the resin so it can continue removing hardness from incoming water.",
      steps: [
        {
          title: "Service",
          description:
            "During normal use, the resin holds hardness minerals while softened water moves to the outlet.",
        },
        {
          title: "Backwash",
          description:
            "Water reverses through the vessel, loosening the resin bed and flushing trapped particles.",
        },
        {
          title: "Brine draw",
          description:
            "The salt solution passes through the resin and restores its ion-exchange capacity.",
        },
        {
          title: "Rinse and refill",
          description:
            "Excess brine is rinsed away and the brine tank refills for the next regeneration.",
        },
      ],
    };
  }

  return {
    eyebrow: "Treatment journey",
    title: "From inlet to ready water",
    description:
      "The page adapts this explanation when product-specific process information is available.",
    steps: [
      {
        title: "Water enters",
        description:
          "Incoming water reaches the product through the configured inlet connection.",
      },
      {
        title: "Core treatment",
        description:
          "The product's main treatment stage performs the function defined for this model.",
      },
      {
        title: "Controlled flow",
        description:
          "Internal components manage the movement of water through the system.",
      },
      {
        title: "Ready for use",
        description:
          "Treated water reaches the outlet for the connected household application.",
      },
    ],
  };
};

const ProductInfo = ({ icon: Icon, title, description }) => (
  <div className="group rounded-[1.5rem] border border-white/70 bg-white/72 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition group-hover:rotate-6 group-hover:scale-105">
      <Icon size={21} />
    </div>
    <p className="font-bold text-slate-950">{title}</p>
    <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
  </div>
);

const StoryPanel = ({ number, eyebrow, title, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 42 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.25 }}
    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    className="flex min-h-[72vh] items-center py-8 lg:min-h-[88vh] lg:py-16"
  >
    <div className="w-full rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-7 lg:rounded-[2.5rem] lg:p-9">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
          {number}
        </span>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-6 text-3xl font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <div className="mt-7">{children}</div>
    </div>
  </motion.section>
);

const ScrollProductStage = ({
  images,
  title,
  price,
  originalPrice,
  discount,
  storyRef,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const rotateY = useTransform(
    scrollYProgress,
    [0, 0.2, 0.45, 0.7, 1],
    [-12, 14, -10, 12, 0],
  );
  const rotateX = useTransform(
    scrollYProgress,
    [0, 0.35, 0.65, 1],
    [7, -4, 5, 0],
  );
  const imageY = useTransform(scrollYProgress, [0, 0.5, 1], [18, -12, 8]);
  const imageScale = useTransform(
    scrollYProgress,
    [0, 0.45, 0.8, 1],
    [0.9, 1.04, 0.96, 1],
  );
  const priceX = useTransform(
    scrollYProgress,
    [0, 0.07, 0.88, 1],
    [-70, 0, 0, -45],
  );
  const priceOpacity = useTransform(
    scrollYProgress,
    [0, 0.07, 0.92, 1],
    [0, 1, 1, 0.4],
  );

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (shouldReduceMotion || images.length <= 1) return;
    const frameCount = Math.min(images.length, 5);
    const nextIndex = Math.min(frameCount - 1, Math.floor(latest * frameCount));
    setActiveImageIndex((current) =>
      current === nextIndex ? current : nextIndex,
    );
  });

  const activeImage = images[activeImageIndex] || images[0];

  return (
    <div className="relative isolate h-[48vh] min-h-[390px] overflow-hidden rounded-[2.25rem] border border-white/70 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,1),rgba(224,242,254,0.78)_44%,rgba(209,250,229,0.72)_100%)] shadow-[0_36px_120px_rgba(15,23,42,0.15)] lg:h-[calc(100vh-7.5rem)] lg:min-h-[650px] lg:rounded-[3rem]">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />

      <div className="absolute left-5 right-5 top-5 z-30 flex items-center justify-between lg:left-8 lg:right-8 lg:top-8">
        <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 shadow-sm backdrop-blur-xl sm:text-xs">
          <Rotate3d size={15} className="text-emerald-600" />
          Scroll view
        </div>
        <p className="max-w-[45%] truncate text-right text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
          {title}
        </p>
      </div>

      <motion.div
        style={{
          x: shouldReduceMotion ? 0 : priceX,
          opacity: shouldReduceMotion ? 1 : priceOpacity,
        }}
        className="absolute left-4 top-[27%] z-40 rounded-[1.4rem] border border-slate-900/10 bg-slate-950 px-4 py-4 text-white shadow-[0_22px_60px_rgba(15,23,42,0.35)] sm:left-6 sm:px-5 lg:-left-3 lg:top-[25%] lg:rounded-[1.75rem] lg:px-6 lg:py-5"
      >
        <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-slate-950" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300 sm:text-[10px]">
          Price
        </p>
        <p className="mt-1 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">
          ₹{formatIndianCurrency(price) || "—"}
        </p>
        {originalPrice && (
          <div className="mt-1.5 flex items-center gap-2 text-[10px] sm:text-xs">
            <span className="text-white/45 line-through">
              ₹{formatIndianCurrency(originalPrice)}
            </span>
            <span className="font-black text-emerald-300">{discount}% OFF</span>
          </div>
        )}
      </motion.div>

      <div className="absolute inset-x-8 bottom-12 top-20 z-20 flex items-center justify-center lg:inset-x-16 lg:bottom-20 lg:top-24">
        <motion.div
          style={{
            rotateY: shouldReduceMotion ? 0 : rotateY,
            rotateX: shouldReduceMotion ? 0 : rotateX,
            y: shouldReduceMotion ? 0 : imageY,
            scale: shouldReduceMotion ? 1 : imageScale,
            transformPerspective: 1400,
            transformStyle: "preserve-3d",
          }}
          className="relative h-full w-full"
        >
          <div className="absolute bottom-[8%] left-1/2 h-[12%] w-[58%] -translate-x-1/2 rounded-[50%] bg-slate-900/18 blur-2xl" />
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImage.id}
              src={activeImage.url}
              alt={title}
              initial={{ opacity: 0, scale: 0.92, rotateY: -8 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 1.04, rotateY: 8 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_28px_26px_rgba(15,23,42,0.2)]"
              loading={activeImageIndex === 0 ? "eager" : "lazy"}
            />
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 z-30 flex items-end justify-between lg:bottom-8 lg:left-8 lg:right-8">
        <div className="flex gap-1.5">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`View product image ${index + 1}`}
              onClick={() => setActiveImageIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeImageIndex === index
                  ? "w-8 bg-slate-950"
                  : "w-2 bg-slate-900/25 hover:bg-slate-900/50"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          <ArrowDown size={14} className="animate-bounce" />
          Explore
        </div>
      </div>

      <motion.div
        style={{ scaleX: scrollYProgress, transformOrigin: "0% 50%" }}
        className="absolute inset-x-0 bottom-0 z-40 h-1.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500"
      />
    </div>
  );
};

const StickyPurchaseBar = ({
  image,
  title,
  price,
  isInCart,
  onCart,
  onBuyNow,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="pointer-events-none fixed inset-x-0 bottom-[calc(4.7rem+env(safe-area-inset-bottom))] z-[60] px-3 sm:bottom-4 sm:px-5"
  >
    <div className="pointer-events-auto mx-auto grid max-w-4xl grid-cols-[auto_1fr_1fr] items-center gap-2 rounded-[1.35rem] border border-white/75 bg-white/86 p-2 shadow-[0_20px_70px_rgba(15,23,42,0.2)] backdrop-blur-2xl sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-3 sm:rounded-[1.75rem] sm:p-3">
      <div className="flex min-w-0 items-center gap-3 px-1 sm:px-2">
        <div className="relative hidden h-12 w-12 flex-none overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200 sm:block">
          <LazyImage
            src={image}
            alt=""
            fill
            className="h-full w-full"
            imgClassName="object-contain p-1"
          />
        </div>
        <div className="min-w-0">
          <p className="hidden truncate text-xs font-bold text-slate-500 sm:block">
            {title}
          </p>
          <p className="text-sm font-black text-slate-950 sm:mt-0.5 sm:text-lg">
            ₹{formatIndianCurrency(price) || "—"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCart}
        className={`flex min-h-12 items-center justify-center gap-1.5 rounded-2xl px-3 text-xs font-black text-white transition active:scale-[0.97] sm:min-w-44 sm:px-5 sm:text-sm ${
          isInCart
            ? "bg-emerald-700 hover:bg-emerald-800"
            : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600"
        }`}
      >
        {isInCart ? <Check size={17} /> : <ShoppingCart size={17} />}
        <span className="hidden sm:inline">
          {isInCart ? "Added" : "Add to Cart"}
        </span>
        <span className="sm:hidden">{isInCart ? "Added" : "Cart"}</span>
      </button>

      <button
        type="button"
        onClick={onBuyNow}
        className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-slate-800 active:scale-[0.97] sm:min-w-36 sm:px-6 sm:text-sm"
      >
        Buy Now
      </button>
    </div>
  </motion.div>
);

function AquaProductRevamp({
  product,
  related,
  stockCount = 0,
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const storyRef = useRef(null);
  const router = useRouter();
  const productId = product?._id;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setReviewsLoading(true);
    try {
      const response =
        await ProductServiceOperations.GetProductReviews(productId);
      const payload = response?.data?.data || response?.data || {};
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.reviews)
          ? payload.reviews
          : [];
      setReviews(list);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchReviews();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fetchReviews]);

  const reviewStats = useMemo(() => {
    const total = reviews.length;
    if (!total) return { avg: 0, total: 0 };
    const sum = reviews.reduce(
      (accumulator, review) => accumulator + (review?.rating || 0),
      0,
    );
    return {
      avg: Math.round((sum / total) * 10) / 10,
      total,
    };
  }, [reviews]);

  const images = useMemo(
    () => normalizeImages(product?.photos, fallbackImage),
    [product?.photos, fallbackImage],
  );
  const relatedProducts = useMemo(
    () =>
      Array.isArray(related)
        ? related.filter((item) => item?.slug || item?._id)
        : [],
    [related],
  );
  const specifications = useMemo(() => buildSpecifications(product), [product]);
  const highlights = useMemo(() => buildHighlights(product), [product]);
  const processStory = useMemo(() => buildProcessStory(product), [product]);

  const { cartData = [], favData = [] } = useSelector((state) => ({
    cartData: state.cartData || [],
    favData: state.favData || [],
  }));
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const isInCart = cartData.some((item) => item?._id === productId);
  const isFavorite = favData.some((item) => item?._id === productId);

  const [relatedProductRef, relatedProductApi] = useEmblaCarousel({
    align: "center",
    loop: true,
    slidesToScroll: 1,
  });

  const scrollPrev = () => relatedProductApi?.scrollPrev();
  const scrollNext = () => relatedProductApi?.scrollNext();
  const handleCart = () => AddAndRemoveCart(product, ignoreStateUpdate);
  const handleFavorite = () => AddAndRemoveFav(product, ignoreStateUpdate);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.title,
          text: `Check out ${product?.title} on Aquakart`,
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard?.writeText(window.location.href);
    } catch (error) {
      console.log("Share failed", error);
    }
  };

  const handleRedirectToCheckout = () => {
    if (!isInCart) AddAndRemoveCart(product, ignoreStateUpdate);
    router.push("/checkout");
  };

  const price = product?.discountPriceStatus
    ? product?.discountPrice
    : product?.price;
  const originalPrice = product?.discountPriceStatus ? product?.price : null;
  const priceNumber = Number(price);
  const originalPriceNumber = Number(originalPrice);
  const discount =
    originalPriceNumber > 0 && Number.isFinite(priceNumber)
      ? Math.max(
          0,
          Math.round(
            ((originalPriceNumber - priceNumber) / originalPriceNumber) * 100,
          ),
        )
      : 0;
  const categoryLabel = resolveDisplayText(product?.category) || "Water care";
  const summary = stripHtml(
    product?.shortDescription || product?.description,
  ).slice(0, 520);

  const ownershipBenefits = [
    {
      icon: Truck,
      title: "Delivery support",
      description: "Coordinated delivery with Aquakart order assistance.",
    },
    {
      icon: ShieldCheck,
      title: "Warranty",
      description:
        resolveDisplayText(product?.warranty) ||
        "Manufacturer warranty with Aquakart support.",
    },
    {
      icon: RefreshCcw,
      title: "Service guidance",
      description: "Help with maintenance, consumables and service planning.",
    },
    {
      icon: PhoneCall,
      title: "Water experts",
      description: "Talk to the team before selecting or installing the model.",
    },
  ];

  return (
    <>
      {isLoading && (
        <AquaPreloader
          message="Preparing product experience"
          subtext="Loading visuals, specifications and price."
        />
      )}

      <AquaLayout>
        <main className="min-h-screen overflow-clip bg-[linear-gradient(135deg,#eefcf8_0%,#f8fbff_42%,#eef4ff_100%)] pb-44 font-sans text-slate-900 selection:bg-emerald-100 sm:pb-36">
          <div
            ref={storyRef}
            className="relative mx-auto max-w-[92rem] px-3 pt-5 sm:px-5 sm:pt-7 lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.82fr)] lg:items-start lg:gap-10 lg:px-8"
          >
            <div className="sticky top-20 z-10 self-start lg:top-24">
              <ScrollProductStage
                images={images}
                title={product?.title}
                price={price}
                originalPrice={originalPrice}
                discount={discount}
                storyRef={storyRef}
              />
            </div>

            <div className="relative z-20 mt-5 lg:mt-0">
              <StoryPanel
                number="01"
                eyebrow={categoryLabel}
                title={product?.title}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  {reviewStats.total > 0 ? (
                    <a
                      href="#reviews"
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-200"
                    >
                      {reviewStats.avg.toFixed(1)}
                      <Star size={14} fill="currentColor" />
                      <span className="text-amber-700/60">
                        {reviewStats.total} reviews
                      </span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                      <Star size={14} /> New to Aquakart
                    </span>
                  )}

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-black ${
                      stockCount > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {stockCount > 0 ? "In stock" : "Out of stock"}
                  </span>

                  {discount > 0 && (
                    <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
                      Save {discount}%
                    </span>
                  )}
                </div>

                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                  {summary ||
                    "A carefully selected water-care product supported by Aquakart's product and service team."}
                </p>

                <div className="mt-7 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Share2 size={17} /> Share
                  </button>
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${
                      isFavorite
                        ? "border-rose-200 bg-rose-50 text-rose-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:text-rose-600"
                    }`}
                  >
                    <Heart
                      size={17}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                    {isFavorite ? "Saved" : "Save"}
                  </button>
                </div>
              </StoryPanel>

              <StoryPanel
                number="02"
                eyebrow="Specifications"
                title="The important numbers, without the clutter"
              >
                {specifications.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {specifications.map((spec, index) => (
                      <motion.div
                        key={`${spec.label}-${spec.value}`}
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(index * 0.05, 0.3) }}
                        className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 p-4"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {spec.label}
                        </p>
                        <p className="mt-2 break-words text-base font-black text-slate-900">
                          {spec.value}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] bg-slate-50 p-6 text-sm leading-7 text-slate-600">
                    Detailed technical specifications will appear here as soon
                    as they are added to this product.
                  </div>
                )}
              </StoryPanel>

              <StoryPanel
                number="03"
                eyebrow={processStory.eyebrow}
                title={processStory.title}
              >
                <p className="text-base leading-7 text-slate-600">
                  {processStory.description}
                </p>

                <div className="relative mt-8 space-y-3 before:absolute before:bottom-5 before:left-[1.35rem] before:top-5 before:w-px before:bg-gradient-to-b before:from-cyan-400 before:via-emerald-400 before:to-teal-500">
                  {processStory.steps.map((step, index) => (
                    <motion.div
                      key={`${step.title}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.55 }}
                      transition={{ delay: Math.min(index * 0.08, 0.32) }}
                      className="relative grid grid-cols-[2.75rem_1fr] gap-3 rounded-[1.35rem] border border-slate-200/70 bg-white/85 p-3 shadow-sm"
                    >
                      <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-500/20">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="py-1 pr-2">
                        <p className="font-black text-slate-950">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </StoryPanel>

              <StoryPanel
                number="04"
                eyebrow="Ownership"
                title="What happens after you choose it"
              >
                {highlights.length > 0 && (
                  <div className="mb-7 rounded-[1.5rem] bg-slate-950 p-5 text-white sm:p-6">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Sparkles size={18} />
                      <p className="text-xs font-black uppercase tracking-[0.18em]">
                        Product highlights
                      </p>
                    </div>
                    <ul className="mt-5 space-y-3">
                      {highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex gap-3 text-sm leading-6 text-white/75"
                        >
                          <Check
                            size={17}
                            className="mt-1 flex-none text-emerald-300"
                          />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ownershipBenefits.map((benefit) => (
                    <ProductInfo
                      key={benefit.title}
                      icon={benefit.icon}
                      title={benefit.title}
                      description={benefit.description}
                    />
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/80 p-3 text-center">
                  {[
                    { icon: Droplets, label: "Water care" },
                    { icon: Gauge, label: "Right sizing" },
                    { icon: Waves, label: "Service help" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/80 px-2 py-4 text-xs font-black text-slate-700"
                    >
                      <Icon className="mx-auto mb-2 text-cyan-600" size={20} />
                      {label}
                    </div>
                  ))}
                </div>
              </StoryPanel>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <section id="reviews" className="scroll-mt-28 pt-12 lg:pt-20">
              <ProductReviews
                productId={product?._id}
                reviews={reviews}
                loading={reviewsLoading}
                onReviewsChange={fetchReviews}
              />
            </section>

            {relatedProducts.length > 0 && (
              <section className="pt-16 lg:pt-24">
                <div className="mb-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                      Keep exploring
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                      Similar products
                    </h2>
                  </div>
                  <div className="hidden gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={scrollPrev}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                      aria-label="Previous product"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={scrollNext}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                      aria-label="Next product"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden p-1" ref={relatedProductRef}>
                  <div className="flex gap-5">
                    <Suspense
                      fallback={
                        <div className="h-96 min-w-[280px] animate-pulse rounded-[2rem] bg-white/60" />
                      }
                    >
                      {relatedProducts.map((item) => (
                        <div
                          key={item._id}
                          className="min-w-[280px] flex-[0_0_84%] sm:flex-[0_0_48%] lg:flex-[0_0_31%]"
                        >
                          <AquaRelatedProductCard product={item} />
                        </div>
                      ))}
                    </Suspense>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>

        <StickyPurchaseBar
          image={images[0]?.url || fallbackImage}
          title={product?.title}
          price={price}
          isInCart={isInCart}
          onCart={handleCart}
          onBuyNow={handleRedirectToCheckout}
        />
      </AquaLayout>
    </>
  );
}

export default AquaProductRevamp;
