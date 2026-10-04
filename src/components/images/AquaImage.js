import Image from "next/image";
import { useEffect, useState } from "react";
import { FALLBACK_IMAGE } from "@/constants/images";

const AquaImage = ({ src, customClass, alt, width, height }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  // next/image throws on an empty src, and a broken URL renders a broken icon;
  // both fall back to the brand image instead.
  const safeSrc = !src || failed ? FALLBACK_IMAGE : src;

  return (
    <Image
      src={safeSrc}
      alt={alt || "Aquakart"}
      className={customClass}
      width={width ? width : 200}
      height={height ? height : 200}
      onError={() => setFailed(true)}
    />
  );
};

export default AquaImage;
