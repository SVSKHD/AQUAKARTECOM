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
import { createPortal } from "react-dom";

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

const ProductInfo = ({ icon: Icon, title, description, className = "" }) => (
  <div
    className={`group rounded-[1.5rem] border border-white/70 bg-white/72 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)] sm:p-5 ${className}`}
  >
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition group-hover:rotate-6 group-hover:scale-105">
      <Icon size={21} />
    </div>
    <p className="font-bold text-slate-950">{title}</p>
    <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
  </div>
);

const StoryPanel = ({ id, number, eyebrow, title, children }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 42 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.25 }}
    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    className="scroll-mt-36 py-2 sm:py-4 lg:flex lg:min-h-[78svh] lg:items-center lg:py-10"
  >
    <div className="relative w-full overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/82 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-7 lg:rounded-[2.5rem] lg:p-9">
      <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-gradient-to-br from-cyan-200/35 to-emerald-200/25 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white sm:h-9 sm:w-9 sm:text-xs">
          {number}
        </span>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
          {eyebrow}
        </p>
      </div>
      <h2 className="relative mt-4 text-[1.75rem] font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:mt-6 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <div className="relative mt-5 sm:mt-7">{children}</div>
    </div>
  </motion.section>
);

const MOBILE_CHAPTERS = [
  { id: "product-overview", number: "01", label: "Overview" },
  { id: "product-specifications", number: "02", label: "Specs" },
  { id: "product-process", number: "03", label: "Process" },
  { id: "product-ownership", number: "04", label: "Support" },
];

const MobileStoryNav = () => {
  const [activeChapter, setActiveChapter] = useState(MOBILE_CHAPTERS[0].id);

  useEffect(() => {
    const sections = MOBILE_CHAPTERS.map(({ id }) =>
      document.getElementById(id),
    ).filter(Boolean);

    if (!sections.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio - first.intersectionRatio,
          )[0];
        if (visible?.target?.id) setActiveChapter(visible.target.id);
      },
      { rootMargin: "-28% 0px -56%", threshold: [0.05, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Product story chapters"
      className="sticky top-[5.35rem] z-50 -mx-1 mb-2 lg:hidden"
    >
      <div className="no-scrollbar flex snap-x gap-1.5 overflow-x-auto rounded-2xl border border-white/80 bg-white/88 p-1.5 shadow-[0_14px_45px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
        {MOBILE_CHAPTERS.map((chapter) => {
          const isActive = activeChapter === chapter.id;
          return (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              aria-current={isActive ? "location" : undefined}
              className={`flex min-w-max snap-start items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition ${
                isActive
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                  : "text-slate-500"
              }`}
            >
              <span
                className={isActive ? "text-emerald-300" : "text-slate-300"}
              >
                {chapter.number}
              </span>
              {chapter.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
};

const MobileScrollIdentity = ({ image, title, price }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const lastScrollYRef = useRef(0);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const mountFrame = window.requestAnimationFrame(() => setMounted(true));
    lastScrollYRef.current = window.scrollY;
    let frame = null;

    const showBriefly = () => {
      setVisible(true);
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setVisible(false), 2600);
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const distance = currentScrollY - lastScrollYRef.current;
        const isMobile = window.matchMedia("(max-width: 1023px)").matches;
        const isPastHero = currentScrollY > window.innerHeight * 0.72;

        if (!isMobile || !isPastHero) {
          setVisible(false);
        } else if (distance < -5) {
          showBriefly();
        } else if (distance > 10) {
          setVisible(false);
        }

        if (Math.abs(distance) > 3) lastScrollYRef.current = currentScrollY;
        frame = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(mountFrame);
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.aside
          aria-label="Current product"
          initial={{ opacity: 0, x: -36, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -28, scale: 0.97 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed left-0 top-[34%] z-[85] w-[10.5rem] overflow-hidden rounded-r-[1.4rem] border border-l-0 border-white/15 bg-slate-950/94 p-2.5 text-white shadow-[0_20px_65px_rgba(2,6,23,0.38)] backdrop-blur-2xl lg:hidden"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative flex items-center gap-2.5">
            <div className="relative h-10 w-10 flex-none overflow-hidden rounded-xl bg-white ring-1 ring-white/20">
              <LazyImage
                src={image}
                alt=""
                fill
                className="h-full w-full"
                imgClassName="object-contain p-0.5"
              />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-[9px] font-bold leading-3.5 text-white/65">
                {title}
              </p>
              <p className="mt-1 text-sm font-black tracking-tight text-emerald-300">
                ₹{formatIndianCurrency(price) || "—"}
              </p>
            </div>
          </div>
          <div className="relative mt-2 h-0.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 2.6, ease: "linear" }}
              className="h-full origin-left bg-gradient-to-r from-emerald-300 to-cyan-300"
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body,
  );
};

const ScrollProductStage = ({
  images,
  title,
  price,
  originalPrice,
  discount,
  facts = [],
  storyRef,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const touchStartXRef = useRef(null);
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
  const priceY = useTransform(
    scrollYProgress,
    [0, 0.45, 0.75, 1],
    [0, -10, 4, 0],
  );
  const priceScale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.72, 1],
    [1, 1.04, 0.98, 1],
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
  const showPreviousImage = () =>
    setActiveImageIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  const showNextImage = () =>
    setActiveImageIndex((current) => (current + 1) % images.length);

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartXRef.current === null || images.length <= 1) return;
    const distance =
      (event.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(distance) < 44) return;
    if (distance > 0) showPreviousImage();
    else showNextImage();
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative isolate h-[66svh] min-h-[500px] max-h-[620px] touch-pan-y overflow-hidden rounded-[1.75rem] border border-white/70 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,1),rgba(224,242,254,0.78)_44%,rgba(209,250,229,0.72)_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.14)] sm:rounded-[2.25rem] lg:h-[calc(100svh-7.5rem)] lg:max-h-none lg:min-h-[650px] lg:rounded-[3rem] lg:shadow-[0_36px_120px_rgba(15,23,42,0.15)]"
    >
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
      <motion.div
        aria-hidden="true"
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-400/35"
      />
      <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 shadow-[0_0_80px_rgba(34,211,238,0.2)]" />

      <div className="absolute left-5 right-5 top-5 z-30 flex items-center justify-between lg:left-8 lg:right-8 lg:top-8">
        <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 shadow-sm backdrop-blur-xl sm:text-xs">
          <Rotate3d size={15} className="text-emerald-600" />
          <span className="lg:hidden">Swipe gallery</span>
          <span className="hidden lg:inline">Scroll view</span>
        </div>
        <p className="max-w-[45%] truncate text-right text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
          {title}
        </p>
      </div>

      <motion.div
        style={{
          y: shouldReduceMotion ? 0 : priceY,
          scale: shouldReduceMotion ? 1 : priceScale,
        }}
        className="absolute bottom-16 left-5 z-40 min-w-[10.5rem] overflow-hidden rounded-[1.45rem] border border-white/15 bg-[linear-gradient(145deg,#020617_0%,#0f172a_58%,#064e3b_140%)] px-4 py-4 text-white shadow-[0_24px_70px_rgba(2,6,23,0.4)] ring-1 ring-slate-950/10 sm:left-7 sm:min-w-[12rem] sm:px-5 lg:bottom-24 lg:left-8 lg:min-w-[14rem] lg:rounded-[1.8rem] lg:px-6 lg:py-5"
      >
        <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="relative flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300 sm:text-[10px]">
            Online price
          </p>
          {discount > 0 && (
            <span className="rounded-full bg-emerald-400 px-2 py-1 text-[8px] font-black text-emerald-950 sm:text-[9px]">
              SAVE {discount}%
            </span>
          )}
        </div>
        <p className="relative mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl lg:text-4xl">
          ₹{formatIndianCurrency(price) || "—"}
        </p>
        <div className="relative mt-2 flex items-center gap-2 text-[9px] text-white/55 sm:text-[10px]">
          {originalPrice && (
            <span className="text-white/45 line-through">
              ₹{formatIndianCurrency(originalPrice)}
            </span>
          )}
          <span>Inclusive of taxes</span>
        </div>
      </motion.div>

      {facts.length > 0 && (
        <div className="absolute right-5 top-[24%] z-30 hidden w-36 flex-col gap-2 xl:flex">
          {facts.map((fact, index) => (
            <motion.div
              key={`${fact.label}-${fact.value}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + index * 0.1 }}
              className="rounded-2xl border border-white/80 bg-white/72 px-4 py-3 shadow-[0_14px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            >
              <p className="text-[8px] font-black uppercase tracking-[0.17em] text-slate-400">
                {fact.label}
              </p>
              <p className="mt-1 truncate text-xs font-black text-slate-900">
                {fact.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="absolute inset-x-6 bottom-14 top-20 z-20 flex items-center justify-center lg:inset-x-12 lg:bottom-20 lg:top-24">
        <motion.div
          style={{
            rotateY: shouldReduceMotion ? 0 : rotateY,
            rotateX: shouldReduceMotion ? 0 : rotateX,
            y: shouldReduceMotion ? 0 : imageY,
            scale: shouldReduceMotion ? 1 : imageScale,
            transformPerspective: 1400,
            transformStyle: "preserve-3d",
          }}
          className="relative h-full w-full before:absolute before:inset-[7%] before:-rotate-3 before:rounded-[2.4rem] before:border before:border-white/80 before:bg-white/22 before:shadow-[0_24px_60px_rgba(14,116,144,0.12)] before:backdrop-blur-sm after:absolute after:inset-[10%] after:rotate-2 after:rounded-[2.2rem] after:border after:border-cyan-100/80 after:bg-cyan-100/15"
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
              className="absolute inset-0 z-10 h-full w-full scale-[1.03] object-contain drop-shadow-[0_30px_28px_rgba(15,23,42,0.22)] lg:scale-[1.08]"
              loading={activeImageIndex === 0 ? "eager" : "lazy"}
            />
          </AnimatePresence>
        </motion.div>
      </div>

      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-3 top-1/2 z-30 flex -translate-y-1/2 justify-between lg:hidden">
          <button
            type="button"
            aria-label="Previous product image"
            onClick={showPreviousImage}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/75 text-slate-800 shadow-lg backdrop-blur-xl active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next product image"
            onClick={showNextImage}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/75 text-slate-800 shadow-lg backdrop-blur-xl active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

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
        <div className="rounded-full border border-white/70 bg-white/55 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 backdrop-blur-lg lg:border-0 lg:bg-transparent lg:p-0">
          <span className="lg:hidden">
            {String(activeImageIndex + 1).padStart(2, "0")} /{" "}
            {String(images.length).padStart(2, "0")}
          </span>
          <span className="hidden items-center gap-2 lg:flex">
            <ArrowDown size={14} className="animate-bounce" />
            Explore
          </span>
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
  stageRef,
  image,
  title,
  price,
  originalPrice,
  discount,
  isInCart,
  onCart,
  onBuyNow,
}) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const isPhone = window.matchMedia("(max-width: 639px)").matches;
    if (!isPhone) {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const stage = stageRef?.current;
    if (!stage || typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-88px 0px -12% 0px", threshold: 0.08 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [stageRef]);

  if (!mounted || !visible) return null;

  return createPortal(
    <motion.aside
      aria-label="Purchase this product"
      initial={{ opacity: 0, y: 36, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.8rem+env(safe-area-inset-bottom))] z-[90] px-3 sm:bottom-5 sm:px-5"
    >
      <div className="pointer-events-auto mx-auto grid max-w-5xl grid-cols-[minmax(62px,auto)_1fr_1fr] items-center gap-2 overflow-hidden rounded-[1.35rem] border border-white/15 bg-slate-950/95 p-2 shadow-[0_24px_90px_rgba(15,23,42,0.4)] ring-1 ring-slate-950/20 backdrop-blur-2xl sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-3 sm:rounded-[1.8rem] sm:border-white/80 sm:bg-white/92 sm:p-3 sm:shadow-[0_24px_90px_rgba(15,23,42,0.28)] sm:ring-slate-900/5">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        <div className="flex min-w-0 items-center gap-3 px-1 sm:px-2">
          <div className="relative hidden h-14 w-14 flex-none overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 to-emerald-50 ring-1 ring-slate-200 sm:block">
            <LazyImage
              src={image}
              alt=""
              fill
              className="h-full w-full"
              imgClassName="object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/45 sm:hidden">
              Your price
            </p>
            <p className="hidden max-w-sm truncate text-xs font-bold text-slate-500 sm:block">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-sm font-black tracking-tight text-white sm:mt-0.5 sm:text-xl sm:text-slate-950">
                ₹{formatIndianCurrency(price) || "—"}
              </p>
              {originalPrice && (
                <span className="hidden text-xs text-slate-400 line-through md:inline">
                  ₹{formatIndianCurrency(originalPrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="hidden rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700 md:inline">
                  {discount}% OFF
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCart}
          className={`flex min-h-12 items-center justify-center gap-1.5 rounded-2xl px-3 text-xs font-black text-white transition active:scale-[0.97] sm:min-w-44 sm:px-5 sm:text-sm ${
            isInCart
              ? "bg-emerald-600 hover:bg-emerald-700 sm:bg-emerald-700 sm:hover:bg-emerald-800"
              : "bg-white/10 ring-1 ring-white/15 hover:bg-white/15 sm:bg-gradient-to-r sm:from-emerald-500 sm:to-teal-500 sm:shadow-lg sm:shadow-emerald-500/20 sm:ring-0 sm:hover:from-emerald-600 sm:hover:to-teal-600"
          }`}
        >
          {isInCart ? <Check size={17} /> : <ShoppingCart size={17} />}
          <span className="hidden sm:inline">
            {isInCart ? "Added to Cart" : "Add to Cart"}
          </span>
          <span className="sm:hidden">{isInCart ? "Added" : "Cart"}</span>
        </button>

        <button
          type="button"
          onClick={onBuyNow}
          className="flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-950/25 transition hover:from-emerald-300 hover:to-teal-300 active:scale-[0.97] sm:min-w-40 sm:bg-slate-950 sm:bg-none sm:px-6 sm:text-sm sm:text-white sm:shadow-slate-900/20 sm:hover:bg-slate-800"
        >
          Buy Now
        </button>
      </div>
    </motion.aside>,
    document.body,
  );
};

function AquaProductRevamp({
  product,
  related,
  stockCount = 0,
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
}) {
  const shouldReduceCarouselMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const storyRef = useRef(null);
  const visualStageRef = useRef(null);
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
  const stageFacts = useMemo(() => {
    const preferredLabels = ["Capacity", "Model", "Warranty", "Brand"];
    return preferredLabels
      .map((label) =>
        specifications.find((specification) => specification.label === label),
      )
      .filter(Boolean)
      .slice(0, 3);
  }, [specifications]);

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
  const [relatedIndex, setRelatedIndex] = useState(0);

  useEffect(() => {
    if (!relatedProductApi) return;
    const updateRelatedIndex = () =>
      setRelatedIndex(relatedProductApi.selectedScrollSnap());
    updateRelatedIndex();
    relatedProductApi.on("select", updateRelatedIndex);
    relatedProductApi.on("reInit", updateRelatedIndex);
    return () => {
      relatedProductApi.off("select", updateRelatedIndex);
      relatedProductApi.off("reInit", updateRelatedIndex);
    };
  }, [relatedProductApi]);

  useEffect(() => {
    if (
      !relatedProductApi ||
      shouldReduceCarouselMotion ||
      relatedProducts.length < 2
    )
      return undefined;
    const timer = window.setInterval(
      () => relatedProductApi.scrollNext(),
      4500,
    );
    return () => window.clearInterval(timer);
  }, [relatedProductApi, relatedProducts.length, shouldReduceCarouselMotion]);

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
  const fullSummary = stripHtml(
    product?.shortDescription || product?.description,
  );
  const summary =
    fullSummary.length > 320
      ? `${fullSummary.slice(0, 317).trim()}...`
      : fullSummary;

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

      <AquaLayout allowPageSticky>
        <main className="min-h-screen overflow-x-clip bg-[linear-gradient(135deg,#eefcf8_0%,#f8fbff_42%,#eef4ff_100%)] pb-36 font-sans text-slate-900 selection:bg-emerald-100 sm:pb-28">
          <div
            ref={storyRef}
            className="relative mx-auto max-w-[92rem] px-3 pt-5 sm:px-5 sm:pt-7 lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.82fr)] lg:items-start lg:gap-10 lg:px-8"
          >
            <div
              ref={visualStageRef}
              className="self-start lg:sticky lg:top-24 lg:z-10"
            >
              <ScrollProductStage
                images={images}
                title={product?.title}
                price={price}
                originalPrice={originalPrice}
                discount={discount}
                facts={stageFacts}
                storyRef={storyRef}
              />
            </div>

            <div className="relative z-20 mt-3 space-y-3 pb-4 sm:mt-4 sm:space-y-4 lg:mt-0 lg:space-y-0 lg:pb-0">
              <MobileStoryNav />

              <StoryPanel
                id="product-overview"
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

                <div className="relative mt-6 overflow-hidden rounded-[1.6rem] bg-[linear-gradient(135deg,#020617_0%,#0f172a_62%,#064e3b_145%)] p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.2)] sm:p-6">
                  <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
                  <div className="relative flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                        Aquakart online price
                      </p>
                      <div className="mt-2 flex flex-wrap items-baseline gap-3">
                        <p className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                          ₹{formatIndianCurrency(price) || "—"}
                        </p>
                        {originalPrice && (
                          <span className="text-sm text-white/40 line-through">
                            ₹{formatIndianCurrency(originalPrice)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-white/55">
                        Inclusive of all taxes
                      </p>
                    </div>
                    {discount > 0 && (
                      <div className="flex h-16 w-16 flex-none rotate-6 flex-col items-center justify-center rounded-2xl bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-950/20">
                        <span className="text-xl font-black leading-none">
                          {discount}%
                        </span>
                        <span className="mt-1 text-[8px] font-black uppercase tracking-wider">
                          Savings
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="mt-6 max-h-[10rem] overflow-hidden text-base leading-7 text-slate-600 sm:text-[1.05rem]">
                  {summary ||
                    "A carefully selected water-care product supported by Aquakart's product and service team."}
                </p>

                {highlights.length > 0 && (
                  <div className="no-scrollbar -mx-1 mt-5 flex snap-x gap-2 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
                    {highlights.slice(0, 3).map((highlight, index) => (
                      <div
                        key={highlight}
                        className="min-w-[78%] snap-center rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-3 text-xs font-bold leading-5 text-emerald-950 sm:min-w-0"
                      >
                        <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {highlight}
                      </div>
                    ))}
                  </div>
                )}

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
                id="product-specifications"
                number="02"
                eyebrow="Specifications"
                title="The important numbers, without the clutter"
              >
                {specifications.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {specifications.map((spec, index) => (
                      <motion.div
                        key={`${spec.label}-${spec.value}`}
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(index * 0.05, 0.3) }}
                        className="min-w-0 rounded-[1.15rem] border border-slate-200/70 bg-slate-50/80 p-3 sm:rounded-[1.35rem] sm:p-4"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {spec.label}
                        </p>
                        <p className="mt-2 break-words text-sm font-black leading-5 text-slate-900 sm:text-base">
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
                id="product-process"
                number="03"
                eyebrow={processStory.eyebrow}
                title={processStory.title}
              >
                <p className="text-base leading-7 text-slate-600">
                  {processStory.description}
                </p>

                <div className="mt-6 flex items-center justify-between sm:hidden">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    Swipe the cycle
                  </p>
                  <p className="text-[10px] font-black tracking-[0.18em] text-slate-300">
                    01 — {String(processStory.steps.length).padStart(2, "0")}
                  </p>
                </div>

                <div className="no-scrollbar relative -mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-3 before:absolute before:bottom-5 before:left-[1.35rem] before:top-5 before:hidden before:w-px before:bg-gradient-to-b before:from-cyan-400 before:via-emerald-400 before:to-teal-500 sm:mx-0 sm:mt-8 sm:block sm:space-y-3 sm:overflow-visible sm:px-0 sm:pb-0 sm:before:block">
                  {processStory.steps.map((step, index) => (
                    <motion.div
                      key={`${step.title}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.55 }}
                      transition={{ delay: Math.min(index * 0.08, 0.32) }}
                      className="relative grid min-w-[84%] snap-center grid-cols-[2.75rem_1fr] gap-3 rounded-[1.35rem] border border-white/10 bg-slate-950 p-3 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] sm:min-w-0 sm:border-slate-200/70 sm:bg-white/85 sm:text-slate-950 sm:shadow-sm"
                    >
                      <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-500/20">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="py-1 pr-2">
                        <p className="font-black text-white sm:text-slate-950">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-white/60 sm:text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </StoryPanel>

              <StoryPanel
                id="product-ownership"
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

                <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
                  {ownershipBenefits.map((benefit) => (
                    <ProductInfo
                      key={benefit.title}
                      icon={benefit.icon}
                      title={benefit.title}
                      description={benefit.description}
                      className="min-w-[80%] snap-center sm:min-w-0"
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
            <section id="reviews" className="scroll-mt-28 pt-10 lg:pt-20">
              <ProductReviews
                productId={product?._id}
                reviews={reviews}
                loading={reviewsLoading}
                onReviewsChange={fetchReviews}
              />
            </section>

            {relatedProducts.length > 0 && (
              <section className="pb-6 pt-10 lg:pb-10 lg:pt-20">
                <div className="mb-5 flex items-end justify-between gap-4 sm:mb-8">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                      Keep exploring
                    </p>
                    <h2 className="mt-1.5 text-3xl font-black tracking-tight text-slate-950 sm:mt-2">
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

                <div
                  className="overflow-hidden px-2 py-2"
                  ref={relatedProductRef}
                >
                  <div className="flex items-stretch">
                    <Suspense
                      fallback={
                        <div className="h-96 min-w-[280px] animate-pulse rounded-[2rem] bg-white/60" />
                      }
                    >
                      {relatedProducts.map((item) => (
                        <div
                          key={item._id}
                          className="box-border min-w-0 flex-[0_0_88%] pr-3 sm:flex-[0_0_48%] sm:pr-5 lg:flex-[0_0_31%]"
                        >
                          <AquaRelatedProductCard product={item} />
                        </div>
                      ))}
                    </Suspense>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between lg:hidden">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Swipe to compare
                  </p>
                  <div className="flex items-center gap-1.5">
                    {relatedProducts.slice(0, 6).map((item, index) => (
                      <button
                        key={item._id || item.slug || index}
                        type="button"
                        aria-label={`View related product ${index + 1}`}
                        onClick={() => relatedProductApi?.scrollTo(index)}
                        className={`h-1.5 rounded-full transition-all ${
                          relatedIndex === index
                            ? "w-7 bg-emerald-500"
                            : "w-1.5 bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>

        <MobileScrollIdentity
          image={images[0]?.url || fallbackImage}
          title={product?.title}
          price={price}
        />

        <StickyPurchaseBar
          stageRef={visualStageRef}
          image={images[0]?.url || fallbackImage}
          title={product?.title}
          price={price}
          originalPrice={originalPrice}
          discount={discount}
          isInCart={isInCart}
          onCart={handleCart}
          onBuyNow={handleRedirectToCheckout}
        />
      </AquaLayout>
    </>
  );
}

export default AquaProductRevamp;
