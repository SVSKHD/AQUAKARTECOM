import { motion } from "framer-motion";
import logo from "@/assests/logo.png"; // Fallback/Reference if needed, but we'll use SVG for mask
import Image from "next/image";

const AquaPreloader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="relative h-32 w-32 overflow-hidden">
        {/* Background Logo (Empty/Outline) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 filter grayscale">
          <Image
            src={logo}
            alt="Aquakart"
            className="h-24 w-24 object-contain"
          />
        </div>

        {/* Filling Animation Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* 
               We use a clipping mask strategy or a simple height overlay if the logo is complex.
               For a perfect fill, we'd need the logo as an SVG path. 
               Since we have a PNG `logo.png`, we'll use a "water rise" effect masking the image.
            */}
          <div className="relative h-24 w-24">
            <Image
              src={logo}
              alt="Aquakart"
              className="h-full w-full object-contain"
            />

            {/* The Liquid Mask - Starts full height (hiding everything) and shrinks/moves to reveal */}
            <motion.div
              initial={{ height: "100%" }}
              animate={{ height: "0%" }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 0.5,
                repeatType: "reverse",
              }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm border-b-4 border-emerald-400"
              style={{ bottom: 0, top: "auto" }}
            />
          </div>
        </div>

        {/* Ripple/Wave effects could be added here */}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute bottom-20 text-sm font-medium tracking-[0.2em] text-slate-400 uppercase"
      >
        Aquakart
      </motion.p>
    </div>
  );
};

export default AquaPreloader;
