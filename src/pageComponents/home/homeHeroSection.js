import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import logo from "@/assests/logo.png";
import LazyImage from "@/components/image/LazyImage";
import { getFestivalWish } from "@/utils/festival";

const rotatingHighlights = [
  "99% scale removal with reduced salt consumption",
  "IoT dashboards for live water-quality tracking",
  "Pan-India installation with lifetime service support",
  "Custom plans for apartments, villas, and industries",
];

const headings = [
  "Experience cleaner, healthier water every day",
  "Healthier hair and naturally glowing skin",
  "Helps reduce hair fall caused by hard water",
  "Gentle on skin, reduces dryness and irritation",
  "Prevents white scale stains in your home and bathroom",
];

const AquaHomeHero = ({ data }) => {
  const [activeHighlight, setActiveHighlight] = useState(0);
  const [activeHeading, setActiveHeading] = useState(0);
  const [festival, setFestival] = useState(null);

  useEffect(() => {
    setFestival(getFestivalWish());

    const highlightTimer = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % rotatingHighlights.length);
    }, 4200);

    const headingTimer = setInterval(() => {
      setActiveHeading((prev) => (prev + 1) % headings.length);
    }, 5000);

    return () => {
      clearInterval(highlightTimer);
      clearInterval(headingTimer);
    };
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
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-emerald-50/80 shadow-[0_8px_60px_rgba(0,0,0,0.08)] ring-1 ring-white/60 backdrop-blur-sm">
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
            <div className="relative order-2 lg:order-1 h-full">
              <div className="grid grid-cols-2 grid-rows-2 gap-6 h-full">
                {(data || []).slice(0, 4).map((category, index) => (
                  <motion.div
                    key={
                      category?.id || category?._id || category?.title || index
                    }
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                      y: 20,
                    }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: "easeOut",
                    }}
                    className="relative group overflow-hidden rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/50 bg-white/30 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10 opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
                    <LazyImage
                      src={category?.photos?.[0]?.delivery_url}
                      alt={category?.title || "Aquakart Water Solutions"}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="absolute inset-0"
                      imgClassName="object-cover transition-transform duration-700 group-hover:scale-110"
                      priority={index === 0}
                    />

                    <Link
                      href={`/category/${category?.title || ""}`}
                      className="absolute inset-0 z-20 flex items-end justify-center pb-6"
                    >
                      <div className="px-4 text-center">
                        <span className="inline-block rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
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
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="order-1 lg:order-2 flex flex-col justify-center rounded-[2.5rem] glass-card p-8 lg:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.06)] lg:min-h-[500px]"
            >
              <LazyImage
                src={logo}
                alt="Aquakart"
                imgClassName="mx-auto lg:mx-0 max-w-[160px] drop-shadow-md mb-6"
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

              <div className="min-h-[120px]">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={activeHeading}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl drop-shadow-sm"
                  >
                    {headings[activeHeading]}
                  </motion.h1>
                </AnimatePresence>
              </div>

              <div className="mt-5 min-h-[40px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHighlight}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-emerald-600 shadow"
                  >
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                    {rotatingHighlights[activeHighlight]}
                  </motion.div>
                </AnimatePresence>
              </div>

              <p className="mt-4 max-w-xl text-base text-slate-600 lg:max-w-md">
                Discover tailored softeners, filtration, and RO systems
                engineered for Indian water. From borewell to municipal supply,
                we keep every tap pristine and hassle-free.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center justify-center lg:justify-start">
                <Link
                  href="/shop"
                  aria-label="Shop solutions"
                  className="btn-glass btn-glass-primary"
                >
                  Shop solutions
                </Link>
                <Link
                  href="/shop"
                  aria-label="Book a free water test"
                  className="btn-glass btn-glass-secondary text-emerald-700"
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
