import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import fallbackImage from "@/assests/Default.png";

const shimmer = (w, h) => `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#f3f4f6" offset="20%"/>
        <stop stop-color="#e5e7eb" offset="50%"/>
        <stop stop-color="#f3f4f6" offset="70%"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#f3f4f6"/>
    <rect id="r" width="${w}" height="${h}" fill="url(#g)"/>
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.2s" repeatCount="indefinite"/>
  </svg>
`;

const toBase64 = (str) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

/**
 * LazyImage
 * - Uses IntersectionObserver to only render Next/Image when near viewport.
 * - Use `fill` OR provide `width` & `height`.
 * - Use `priority` ONLY for the single above-the-fold LCP image.
 */
export default function LazyImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  quality = 75,
  placeholder = "blur",
  blurDataURL,
  onError,
  unoptimized = false,
}) {
  const wrapperRef = useRef(null);
  const [visible, setVisible] = useState(priority); // priority images render immediately
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  useEffect(() => {
    if (priority) return;
    if (!wrapperRef.current) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }, // start loading before it appears
    );

    io.observe(wrapperRef.current);
    return () => io.disconnect();
  }, [priority]);

  const safeSrc = !src || failed ? fallbackImage : src;
  const isCloudinaryImage =
    typeof safeSrc === "string" &&
    safeSrc.startsWith("https://res.cloudinary.com/");
  const shouldSkipOptimization = unoptimized || isCloudinaryImage;
  const imageAlt = alt ? `Aquakart-${alt}` : "Aquakart products";

  const handleImageError = (event) => {
    if (!failed) {
      setFailed(true);
    }
    onError?.(event);
  };

  const defaultBlur =
    blurDataURL ||
    `data:image/svg+xml;base64,${toBase64(
      shimmer(width || 700, height || 475),
    )}`;

  // Priority images: skip IntersectionObserver overhead, render immediately with fetchPriority
  if (priority) {
    return (
      <div className={className}>
        <Image
          src={safeSrc}
          alt={imageAlt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          sizes={sizes}
          priority
          fetchPriority="high"
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === "blur" ? defaultBlur : undefined}
          className={imgClassName}
          unoptimized={shouldSkipOptimization}
          onError={handleImageError}
        />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={className}>
      {visible ? (
        <Image
          src={safeSrc}
          alt={imageAlt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          sizes={sizes}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === "blur" ? defaultBlur : undefined}
          className={imgClassName}
          unoptimized={shouldSkipOptimization}
          onError={handleImageError}
        />
      ) : (
        // lightweight placeholder while not visible (no heavy Image decode)
        <div
          className="h-full w-full animate-pulse bg-slate-200/60"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
