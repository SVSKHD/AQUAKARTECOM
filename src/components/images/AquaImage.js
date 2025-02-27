import Image from "next/image";
const AquaImage = ({ src, customClass, alt, width, height }) => {
  return (
    <>
      <Image
        src={src}
        alt={alt}
        className={customClass}
        width={width ? width : 200}
        height={height ? height : 200}
      />
    </>
  );
};
export default AquaImage;
