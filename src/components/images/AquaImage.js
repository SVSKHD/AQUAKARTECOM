import Image from "next/image";
import { useState } from "react";
import { FALLBACK_IMAGE } from "@/constants/images";

const AquaImage = ({
  src,
  customClass,
  alt,
  width,
  height,
  shimmer = false,
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // A new src gets a fresh attempt (adjusted during render).
  const [attemptedSrc, setAttemptedSrc] = useState(src);
  if (attemptedSrc !== src) {
    setAttemptedSrc(src);
    setFailed(false);
    setLoaded(false);
  }

  // next/image throws on an empty src, and a broken URL renders a broken icon;
  // both fall back to the brand image instead.
  const safeSrc = !src || failed ? FALLBACK_IMAGE : src;

  const image = (
    <Image
      src={safeSrc}
      alt={alt || "Aquakart"}
      className={
        shimmer
          ? `${customClass || ""} aqua-image-fade${loaded ? " is-loaded" : ""}`
          : customClass
      }
      width={width ? width : 200}
      height={height ? height : 200}
      onLoad={shimmer ? () => setLoaded(true) : undefined}
      onError={() => setFailed(true)}
    />
  );

  if (!shimmer) return image;

  // Shimmer fills the parent until the image loads, then the image fades in.
  return (
    <div
      className={`h-full w-full${loaded ? "" : " aqua-image-shimmer"}`}
      aria-busy={!loaded}
    >
      {image}
    </div>
  );
};

export default AquaImage;
