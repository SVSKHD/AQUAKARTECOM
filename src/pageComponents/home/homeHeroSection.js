import { motion } from "framer-motion";
import Link from "next/link";
import logo from "@/assests/logo.png";
import AquaImage from "@/components/images/AquaImage";

const AquaHomeHero = ({ data }) => {
  return (
    <>
      <div className="relative bg-white overflow-hidden mt-8 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side: Static image grid with overlapping images */}
            <div className="relative order-2 lg:order-1">
              <div className="grid grid-cols-2 grid-rows-2 gap-4">
                {data?.slice(0, 4).map((category, index) => (
                  <motion.div
                    key={category.id || index}
                    initial={{
                      opacity: 0,
                      x: -20 * (index + 1),
                      y: -20 * (index + 1),
                    }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    className="relative"
                  >
                    <AquaImage
                      src={category?.photos[0]?.secure_url}
                      alt="Aquakart Water Solutions"
                      customClass="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                    <a href={`/category/${category?.title}`}>
                      <div className="absolute bottom-0 left-0 right-0 h-1/6 bg-black bg-opacity-50 flex items-center justify-center p-2 rounded-b-lg">
                        <span className="text-white text-lg font-semibold">
                          {category?.title}
                        </span>
                      </div>
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right side: Bold title with rounded font */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-center lg:text-left order-1 lg:order-2"
            >
              <AquaImage
                src={logo}
                alt="Aquakart"
                customClass="mx-auto max-w-[180px]"
              />
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 rounded-full p-4">
                Elevate Your Water Experience
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Discover our exclusive collection of water solutions designed
                for a purer, healthier home.
              </p>
              <div className="mt-8">
                <Link
                  href="/shop"
                  className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Shop Now
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};
export default AquaHomeHero;
