import AquaAppLoader from "@/components/common/AquaAppLoader";

const AquaPreloader = ({
  message = "Loading Aquakart",
  subtext = "Preparing your water-solutions experience.",
  variant = "screen",
}) => {
  return (
    <AquaAppLoader
      variant={variant}
      message={message}
      subtext={subtext}
    />
  );
};

export default AquaPreloader;
