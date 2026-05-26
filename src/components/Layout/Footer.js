import LW from "@/assests/logo-white.png";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Facebook,
  Instagram,
  Twitter,
  ArrowRight,
  Mail,
  Sparkles,
} from "lucide-react";
import LazyImage from "../image/LazyImage";

const navigation = {
  policy: [
    { name: "Shipping policy", href: "/shipping-policy" },
    { name: "Privacy policy", href: "/privacy-policy" },
    { name: "Terms & Conditions", href: "/terms-and-conditions" },
    { name: "Contact us", href: "/contact-us" },
  ],
  social: [
    {
      name: "Facebook",
      href: "https://www.facebook.com/AquaKart.co.in/",
      icon: Facebook,
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/aquakart.co.in/",
      icon: Instagram,
    },
    { name: "X", href: "https://x.com/aquakart.co.in", icon: Twitter },
  ],
};

const year = new Date().getFullYear();

const SkeletonPill = () => (
  <div className="h-8 w-24 animate-pulse rounded-full bg-white/5" />
);

import { getFestivalWish } from "@/utils/festival";

const AquaFooter = ({ categories = [], subcategories = [] }) => {
  const { userData } = useSelector((state) => ({ ...state }));
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const [festival, setFestival] = useState(null);

  useEffect(() => {
    setMounted(true);
    setFestival(getFestivalWish());
  }, []);

  const formattedCategories = Array.isArray(categories) ? categories : [];
  const formattedSubCategories = Array.isArray(subcategories)
    ? subcategories
    : [];

  // Determine if we should show skeletons (loading state or just empty initially)
  const isLoading =
    !mounted ||
    (formattedCategories.length === 0 && formattedSubCategories.length === 0);

  return (
    <footer
      aria-labelledby="footer-heading"
      className="relative z-10 bg-white px-2 pb-2 pt-10 text-slate-300"
    >
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 pb-8 pt-16 sm:px-12 lg:px-16">
        {/* Ambient Background Effects */}
        <div className="absolute top-0 left-1/2 -ml-[40rem] h-[30rem] w-[50rem] rounded-full bg-indigo-900/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 -mr-20 h-[30rem] w-[40rem] rounded-full bg-blue-900/10 blur-[80px]" />

        {/* Glass Grid Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-125"></div>

        {/* Festival Banner */}
        {festival && (
          <div className="relative z-20 -mt-8 mb-12 flex justify-center animate-fade-in-up">
            <div
              className={`relative overflow-hidden rounded-full p-[1px] bg-gradient-to-r ${festival.gradient}`}
            >
              <div className="relative rounded-full bg-slate-950/80 backdrop-blur-xl px-6 py-2">
                <p
                  className={`text-sm font-bold bg-gradient-to-r ${festival.gradient} bg-clip-text text-transparent flex items-center gap-2`}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  {festival.text}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-24">
          {/* Brand & Newsletter Column */}
          <div className="flex flex-col justify-between gap-10">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                  <LazyImage
                    src={LW}
                    alt="Aquakart"
                    height={48}
                    width={48}
                    imgClassName="h-8 w-8 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Aquakart
                  </h3>
                  <p className="text-xs font-medium text-indigo-200/60 uppercase tracking-widest">
                    Premium Water Solutions
                  </p>
                </div>
              </div>
              <p className="max-w-md text-base leading-7 text-slate-400">
                Advanced softening, filtration, and purification systems
                designed specifically for Indian water conditions. Experience
                the clarity of pure water.
              </p>
            </div>

            {!userData && (
              <div className="group relative rounded-[2rem] border border-white/10 bg-white/5 p-2 backdrop-blur-xl transition-all hover:bg-white/10">
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100 rounded-[2rem]" />
                <div className="px-6 py-6">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-indigo-400" /> Stay Updated
                  </h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Get expert water-care guides and product launches directly
                    to your inbox.
                  </p>
                  <form className="mt-6">
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 pr-32 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-black/40 focus:outline-none focus:ring-0 transition-all"
                      />
                      <button
                        type="submit"
                        aria-label="join-newsletter"
                        className="absolute right-1.5 top-1.5 bottom-1.5 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
                      >
                        Join
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Links & Instagram Grid */}
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            {/* Subcategories */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">
                Solutions
              </h4>
              <div className="flex flex-col gap-3">
                {isLoading && formattedSubCategories.length === 0
                  ? Array(5)
                      .fill(0)
                      .map((_, i) => <SkeletonPill key={i} />)
                  : formattedSubCategories.slice(0, 8).map((item) => (
                      <Link
                        key={item.title}
                        href={`/subcategory/${item.title}`}
                        aria-label={item.title}
                        className="group flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white hover:scale-[1.02]"
                      >
                        <span className="truncate">{item.title}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-indigo-400" />
                      </Link>
                    ))}
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">
                Collections
              </h4>
              <div className="flex flex-col gap-3">
                {isLoading && formattedCategories.length === 0
                  ? Array(5)
                      .fill(0)
                      .map((_, i) => <SkeletonPill key={i} />)
                  : formattedCategories.slice(0, 5).map((item) => (
                      <Link
                        key={item.title}
                        href={`/category/${item.title}`}
                        aria-label={item.title}
                        className="group flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white hover:scale-[1.02]"
                      >
                        <span className="truncate">{item.title}</span>
                      </Link>
                    ))}
              </div>
            </div>

            {/* Instagram Feed */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">
                On Instagram
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "https://res.cloudinary.com/aquakartproducts/image/upload/v1741968501/Blogs/jhkfgdhd9yatyml1bz4j.jpg",
                  "https://res.cloudinary.com/aquakartproducts/image/upload/v1741968501/Blogs/jhkfgdhd9yatyml1bz4j.jpg",
                  "https://res.cloudinary.com/aquakartproducts/image/upload/v1717355833/Blogs/TitleImages/z5sqkhkvawe0xcaliiei.jpg",
                ]
                  .filter(Boolean)
                  .map((src, i) => (
                    <a
                      key={i}
                      href="https://www.instagram.com/aquakart.co.in/"
                      target="_blank"
                      aria-label="aquakart instagram"
                      rel="noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition-all hover:ring-white/30 hover:scale-105"
                    >
                      <LazyImage
                        src={src}
                        alt="Aquakart Instagram"
                        width={150}
                        height={150}
                        imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/40 backdrop-blur-sm">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                    </a>
                  ))}
              </div>
              <a
                href="https://www.instagram.com/aquakart.co.in/"
                target="_blank"
                aria-label="aquakart instagram"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                View Profile <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">
                Company
              </h4>
              <div className="flex flex-col gap-2">
                {navigation.policy.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="relative z-10 mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-6">
            <p className="text-xs font-medium text-slate-500">
              &copy; {year} Aquakart. All rights reserved.
            </p>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
                Made in India
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            {navigation.social.map(({ name, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                aria-label={name}
                target="_blank"
                rel="noreferrer"
                className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:scale-110"
              >
                <Icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AquaFooter;
