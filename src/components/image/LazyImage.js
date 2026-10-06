import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { FALLBACK_IMAGE } from "@/constants/images";

/**
 * LazyImage
 * - Uses IntersectionObserver to only render Next/Image when near viewport.
 * - Use `fill` OR provide `width` & `height`.
 * - Use `priority` ONLY for the single above-the-fold LCP image.
 * - Shows a shimmer on the wrapper until the image has loaded, then fades the
 *   image in. Pass `blurDataURL` to use a blur placeholder instead.
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
  blurDataURL,
  onError,
}) {
  const wrapperRef = useRef(null);
  const [visible, setVisible] = useState(priority); // priority images render immediately
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

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

  // A new src gets a fresh attempt (and shimmer) even if the previous one failed.
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const safeSrc = !src || failed ? FALLBACK_IMAGE : src;

  const wrapperClassName = [className, loaded ? "" : "aqua-image-shimmer"]
    .filter(Boolean)
    .join(" ");

  const image = (
    <Image
      src={safeSrc}
      alt={`Aquakart-${alt}` || "Aquakart products"}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      quality={quality}
      placeholder={blurDataURL ? "blur" : "empty"}
      blurDataURL={blurDataURL}
      className={`${imgClassName} aqua-image-fade${loaded ? " is-loaded" : ""}`}
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );

  return (
    <div
      ref={priority ? undefined : wrapperRef}
      className={wrapperClassName}
      aria-busy={!loaded}
    >
      {visible ? (
        image
      ) : (
        // keeps the wrapper sized so the shimmer shows before the image mounts
        <div className="h-full w-full" aria-hidden="true" />
      )}
    </div>
  );
}
