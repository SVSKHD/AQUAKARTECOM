import React, { useState, useEffect, Suspense, useMemo } from "react";
import {
  ShoppingCart,
  Heart,
  Truck,
  ShieldCheck,
  RefreshCcw,
  PhoneCall,
  Star,
  CheckCircle2,
  Clock3,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AquaHeader from "@/components/Layout/Header";
import AquaFooter from "@/components/Layout/Footer";
import useProduct from "@/utils/product";
import { useSelector } from "react-redux";
import AquafavDrawer from "@/components/common/commonDrawers/favDrawer";
import AquaCartDrawer from "@/components/common/commonDrawers/cartDrawer";
import useEmblaCarousel from "embla-carousel-react";

const AquaRelatedProductCard = React.lazy(
  () => import("@/components/cards/RelatedProductCard"),
);

const DEFAULT_FALLBACK_IMAGE =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const stripHtml = (value) => {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const resolveDisplayText = (input) => {
  if (input === null || input === undefined) return "";
  if (typeof input === "string") return input.trim();
  if (typeof input === "number" || typeof input === "boolean") {
    return String(input);
  }

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
      if (input[key]) {
        return resolveDisplayText(input[key]);
      }
    }
  }

  return "";
};

const normalizeImages = (photos, fallbackImage) => {
  if (Array.isArray(photos) && photos.length > 0) {
    return photos
      .map((photo, index) => {
        if (photo?.secure_url) {
          return { id: photo._id || `photo-${index}`, url: photo.secure_url };
        }

        if (typeof photo === "string") {
          return { id: `photo-${index}`, url: photo };
        }

        return null;
      })
      .filter(Boolean);
  }

  return [{ id: "fallback", url: fallbackImage || DEFAULT_FALLBACK_IMAGE }];
};

const extractHighlightText = (value) => {
  if (!value) return null;
  if (typeof value === "string") return stripHtml(value);

  if (typeof value === "object") {
    const candidates = ["text", "title", "label", "description", "value"];
    for (const key of candidates) {
      if (typeof value[key] === "string" && value[key].trim()) {
        return stripHtml(value[key]);
      }
    }
  }

  return null;
};

const buildHighlights = (product) => {
  if (
    Array.isArray(product?.keyHighlights) &&
    product.keyHighlights.length > 0
  ) {
    return product.keyHighlights
      .map((item) => extractHighlightText(item))
      .filter((item) => item && item.length > 0)
      .slice(0, 6);
  }

  const description = product?.description;
  if (!description) return [];

  const listMatches = description.match(/<li[^>]*>(.*?)<\/li>/gis);
  if (listMatches && listMatches.length > 0) {
    return listMatches
      .map((item) => stripHtml(item))
      .filter((item) => item && item.length > 0)
      .slice(0, 6);
  }

  const fallbackHighlights = stripHtml(description)
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((item) => item && item.length > 0)
    .slice(0, 4);

  return fallbackHighlights;
};

const getStockStatus = (stockCount) => {
  if (stockCount <= 0) {
    return {
      label: "Out of stock",
      tone: "border-rose-200 bg-rose-50 text-rose-600",
      Icon: XCircle,
    };
  }

  if (stockCount < 5) {
    return {
      label: stockCount === 1 ? "Only 1 left" : `Only ${stockCount} left`,
      tone: "border-amber-200 bg-amber-50 text-amber-600",
      Icon: Clock3,
    };
  }

  return {
    label: `In stock (${stockCount} available)`,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Icon: CheckCircle2,
  };
};

const formatIndianCurrency = (value) => {
  if (value === null || value === undefined) return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;
  return amount.toLocaleString("en-IN");
};

function AquaServerDynamicProduct({
  product,
  related,
  stockCount = 0,
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cart, setCart] = useState(false);
  const [relatedEmblaRef, relatedEmblaApi] = useEmblaCarousel({
    align: "start",
    skipSnaps: false,
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const images = useMemo(
    () => normalizeImages(product?.photos, fallbackImage),
    [product?.photos, fallbackImage],
  );
  const highlights = useMemo(() => buildHighlights(product), [product]);
  const stockStatus = useMemo(() => getStockStatus(stockCount), [stockCount]);
  const relatedProducts = useMemo(() => {
    if (!Array.isArray(related)) return [];
    return related.filter((item) => item && (item.slug || item._id));
  }, [related]);

  const { cartData = [], favData = [] } = useSelector((state) => ({
    cartData: state.cartData || [],
    favData: state.favData || [],
  }));
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();

  const ratingValue = Number(product?.rating?.value) || null;
  const ratingCount = Number(product?.rating?.count) || null;

  const discountPercentage = useMemo(() => {
    if (!product?.discountPriceStatus) return 0;
    const price = Number(product?.price);
    const discounted = Number(product?.discountPrice);
    if (Number.isNaN(price) || Number.isNaN(discounted) || price <= 0) return 0;
    return Math.round(((price - discounted) / price) * 100);
  }, [product?.discountPriceStatus, product?.price, product?.discountPrice]);

  const detailItems = useMemo(
    () =>
      [
        { label: "Brand", value: resolveDisplayText(product?.brand) },
        { label: "Model", value: resolveDisplayText(product?.model) },
        { label: "SKU", value: resolveDisplayText(product?.sku) },
        { label: "Category", value: resolveDisplayText(product?.category) },
        { label: "Warranty", value: resolveDisplayText(product?.warranty) },
        { label: "Capacity", value: resolveDisplayText(product?.capacity) },
        { label: "Coverage", value: resolveDisplayText(product?.coverage) },
      ].filter((item) => item.value),
    [
      product?.brand,
      product?.model,
      product?.sku,
      product?.category,
      product?.warranty,
      product?.capacity,
      product?.coverage,
    ],
  );

  const infoTiles = useMemo(
    () => [
      {
        Icon: Truck,
        title: "Same-day delivery (Hyderabad)",
        description:
          "Order before 1:00 PM to receive your purifier within Hyderabad city limits on the same day.",
      },
      {
        Icon: ShieldCheck,
        title: product?.warranty
          ? `${product.warranty} warranty support`
          : "Trusted warranty support",
        description:
          "Genuine manufacturer warranty backed by Aquakart service assistance.",
      },
      {
        Icon: RefreshCcw,
        title: "Easy replacements",
        description:
          "7-day doorstep assistance for manufacturing defects or transit issues.",
      },
      {
        Icon: PhoneCall,
        title: "Talk to water experts",
        description:
          "Need help choosing? Our team is a call away for a personalised recommendation.",
      },
    ],
    [product?.warranty],
  );

  useEffect(() => {
    if (!product?._id) return;
    const isProductInCart = cartData.some((item) => item?._id === product?._id);
    const isProductInFav = favData.some((item) => item?._id === product?._id);
    setCart(isProductInCart);
    setIsFavorite(isProductInFav);
  }, [cartData, favData, product?._id]);

  useEffect(() => {
    if (!relatedEmblaApi) return;

    const updateControls = () => {
      setCanScrollPrev(relatedEmblaApi.canScrollPrev());
      setCanScrollNext(relatedEmblaApi.canScrollNext());
    };

    updateControls();
    relatedEmblaApi.on("select", updateControls);
    relatedEmblaApi.on("reInit", updateControls);

    return () => {
      relatedEmblaApi.off("select", updateControls);
      relatedEmblaApi.off("reInit", updateControls);
    };
  }, [relatedEmblaApi]);

  useEffect(() => {
    if (images.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, images.length]);

  const handleAddToCart = () => {
    AddAndRemoveCart(product, setCart);
  };

  const handleAddToFav = () => {
    AddAndRemoveFav(product, setIsFavorite);
  };

  const scrollRelatedPrev = () => {
    relatedEmblaApi?.scrollPrev();
  };

  const scrollRelatedNext = () => {
    relatedEmblaApi?.scrollNext();
  };

  const { Icon: StockIcon, tone, label } = stockStatus;
  const actualPrice = product?.discountPriceStatus
    ? product?.discountPrice
    : product?.price;
  const strikePrice = product?.discountPriceStatus ? product?.price : null;

  return (
    <>
      <AquaHeader />
      <AquaCartDrawer />
      <AquafavDrawer />

      <AquaFooter />
    </>
  );
}

export default AquaServerDynamicProduct;
