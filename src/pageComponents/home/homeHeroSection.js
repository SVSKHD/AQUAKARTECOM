import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <div className="w-full max-w-full overflow-x-hidden px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
      <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-emerald-50/80 shadow-[0_8px_60px_rgba(0,0,0,0.08)] ring-1 ring-white/60 sm:rounded-[3rem]">
        {/* Dynamic Festival Background Overlay */}
        {festival && (
          <div
            className={`absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-br ${festival.gradient}`}
          />
        )}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-emerald-100 opacity-50" />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100 opacity-50" />
        </div>

        <div className="relative px-3 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2">
            <div className="relative order-2 h-full lg:order-1">
              <div className="grid h-full grid-cols-2 grid-rows-2 gap-3 sm:gap-6">
                {(data || []).slice(0, 4).map((category, index) => (
                  <div
                    key={
                      category?.id || category?._id || category?.title || index
                    }
                    className="hero-card-enter relative group overflow-hidden rounded-[1.5rem] border border-white/50 bg-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] sm:rounded-[2.5rem]"
                    style={{ animationDelay: `${index * 100}ms` }}
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
                      className="absolute inset-0 z-20 flex items-end justify-center pb-4 sm:pb-6"
                    >
                      <div className="max-w-full px-3 text-center sm:px-4">
                        <span className="inline-block max-w-full truncate rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md sm:px-4 sm:text-sm">
                          {category?.title || "Explore"}
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-content-enter order-1 flex max-w-full flex-col justify-center overflow-hidden rounded-[1.75rem] hero-glass-card p-5 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:rounded-[2.5rem] sm:p-8 lg:order-2 lg:min-h-[500px] lg:p-12">
              <Image
                src={logo}
                alt="Aquakart"
                className="mx-auto mb-5 max-w-[112px] drop-shadow-md sm:mb-6 sm:max-w-[160px] lg:mx-0"
                priority
                width={160}
                height={160}
              />

              {/* Festival Banner */}
              {festival && (
                <div
                  className={`hero-fade-in mx-auto lg:mx-0 mt-4 max-w-full rounded-2xl border border-white/40 bg-white/60 p-1 shadow-lg ring-1 ring-black/5 sm:max-w-sm ${festival.animation}`}
                >
                  <div
                    className={`rounded-xl bg-gradient-to-r ${festival.gradient} p-0.5`}
                  >
                    <div className="flex items-center gap-3 rounded-[0.7rem] bg-white px-4 py-2">
                      <span className="text-2xl">{festival.icon}</span>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {festival.subText}
                        </p>
                        <p
                          className={`break-words text-base font-black bg-gradient-to-r ${festival.gradient} bg-clip-text text-transparent leading-tight`}
                        >
                          {festival.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="min-h-[104px] sm:min-h-[120px]">
                <h1
                  key={activeHeading}
                  className="hero-heading-rotate mt-4 max-w-full break-words text-[2rem] font-black leading-[1.12] tracking-tight text-slate-900 drop-shadow-sm sm:text-5xl lg:text-6xl"
                >
                  {headings[activeHeading]}
                </h1>
              </div>

              <div className="mt-5 min-h-[48px] sm:min-h-[40px]">
                <div
                  key={activeHighlight}
                  className="hero-highlight-rotate flex w-full max-w-full items-start gap-2 rounded-2xl bg-white/90 px-3 py-2 text-xs font-medium leading-relaxed text-emerald-600 shadow sm:inline-flex sm:w-auto sm:items-center sm:gap-3 sm:rounded-full sm:px-4 sm:text-sm"
                >
                  <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 sm:mt-0" />
                  <span className="min-w-0 break-words">
                    {rotatingHighlights[activeHighlight]}
                  </span>
                </div>
              </div>

              <p className="mt-4 max-w-full break-words text-sm leading-7 text-slate-600 sm:text-base lg:max-w-md">
                Discover tailored softeners, filtration, and RO systems
                engineered for Indian water. From borewell to municipal supply,
                we keep every tap pristine and hassle-free.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:mt-10 sm:flex-row sm:items-center lg:justify-start">
                <Link
                  href="/shop"
                  aria-label="Shop solutions"
                  className="btn-glass btn-glass-primary w-full sm:w-auto"
                >
                  Shop solutions
                </Link>
                <Link
                  href="/shop"
                  aria-label="Book a free water test"
                  className="btn-glass btn-glass-secondary w-full text-emerald-700 sm:w-auto"
                >
                  Book a free water test
                </Link>
              </div>

              {quickLinks.length > 0 && (
                <div className="mt-6 flex max-w-full flex-wrap justify-center gap-3 overflow-hidden lg:justify-start">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="max-w-full truncate rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AquaHomeHero;
