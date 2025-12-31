import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import logo from "@/assests/logo.png";
import AquaImage from "@/components/images/AquaImage";
import { getFestivalWish } from "@/utils/festival";

const rotatingHighlights = [
  "99% scale removal with reduced salt consumption",
  "IoT dashboards for live water-quality tracking",
  "Pan-India installation with lifetime service support",
  "Custom plans for apartments, villas, and industries",
];

const AquaHomeHero = ({ data }) => {
  const [activeHighlight, setActiveHighlight] = useState(0);
  const [festival, setFestival] = useState(null);

  useEffect(() => {
    setFestival(getFestivalWish());

    const timer = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % rotatingHighlights.length);
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  const quickLinks = useMemo(
    () =>
      (data || [])
        .slice(0, 4)
        .filter((item) => item?.title)
        .map((item) => ({
          title: item.title,
          href: `/category/${item.title}`,
        })),
    [data],
  );

  return (
    <div className="px-3 py-6 sm:px-4 lg:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50 shadow-lg">
        {/* Dynamic Festival Background Overlay */}
        {festival && (
          <div
            className={`absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-br ${festival.gradient}`}
          />
        )}

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-emerald-100 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100 blur-3xl" />
        </div>

        <div className="relative px-4 pb-12 pt-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div className="relative order-2 lg:order-1">
              <div className="grid grid-cols-2 grid-rows-2 gap-4">
                {(data || []).slice(0, 4).map((category, index) => (
                  <motion.div
                    key={
                      category?.id || category?._id || category?.title || index
                    }
                    initial={{
                      opacity: 0,
                      x: -12 * (index + 1),
                      y: -12 * (index + 1),
                    }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.18 }}
                    className="relative"
                  >
                    <AquaImage
                      src={category?.photos?.[0]?.secure_url}
                      alt={category?.title || "Aquakart Water Solutions"}
                      customClass="h-full w-full rounded-lg object-cover shadow-lg"
                    />
                    <Link href={`/category/${category?.title || ""}`}>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-lg bg-black/45 p-2">
                        <span className="text-sm font-semibold text-white">
                          {category?.title || "Explore"}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="order-1 text-center lg:order-2 lg:text-left"
            >
              <AquaImage
                src={logo}
                alt="Aquakart"
                customClass="mx-auto max-w-[180px]"
              />

              {/* Festival Banner */}
              {festival && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mx-auto lg:mx-0 mt-4 max-w-sm rounded-2xl border border-white/40 bg-white/60 p-1 backdrop-blur-md shadow-lg ring-1 ring-black/5 ${festival.animation}`}
                >
                  <div
                    className={`rounded-xl bg-gradient-to-r ${festival.gradient} p-0.5`}
                  >
                    <div className="flex items-center gap-3 rounded-[0.7rem] bg-white px-4 py-2">
                      <span className="text-2xl">{festival.icon}</span>
                      <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {festival.subText}
                        </p>
                        <p
                          className={`text-base font-black bg-gradient-to-r ${festival.gradient} bg-clip-text text-transparent leading-tight`}
                        >
                          {festival.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Elevate your water experience
              </h1>

              <motion.div
                key={activeHighlight}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-emerald-600 shadow"
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                {rotatingHighlights[activeHighlight]}
              </motion.div>

              <p className="mt-4 max-w-xl text-base text-slate-600 lg:max-w-md">
                Discover tailored softeners, filtration, and RO systems
                engineered for Indian water. From borewell to municipal supply,
                we keep every tap pristine and hassle-free.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-400"
                >
                  Shop solutions
                </Link>
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 px-6 py-3 text-sm font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  Book a free water test
                </Link>
              </div>

              {quickLinks.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AquaHomeHero;
