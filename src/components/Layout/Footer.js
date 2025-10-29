import LW from "@/assests/logo-white.png";
import Image from "next/image";
import Link from "next/link";
import { isArray } from "lodash";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

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
      href: "https://www.facebook.com/AquaKart8/",
      icon: Facebook,
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/aquakart8/",
      icon: Instagram,
    },
    { name: "X", href: "https://x.com/aquakart8", icon: Twitter },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@aquakart",
      icon: Youtube,
    },
  ],
};

const year = new Date().getFullYear();

const AquaFooter = ({ categories = [], subcategories = [] }) => {
  const { userData } = useSelector((state) => ({ ...state }));
  const [email, setEmail] = useState("");

  const formattedCategories = isArray(categories) ? categories : [];
  const formattedSubCategories = isArray(subcategories) ? subcategories : [];

  return (
    <footer
      className="relative overflow-hidden bg-slate-950"
      aria-labelledby="footer-heading"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_55%)]" />
      <div className="absolute -top-32 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-20 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                <Image
                  src={LW}
                  alt="Aquakart"
                  height={42}
                  width={42}
                  className="h-10 w-10"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Aquakart</h3>
                <p className="text-sm text-white/60">
                  Premium water solutions for every home and industry.
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-white/60">
              Softening, filtration, and purification systems designed for
              Indian water conditions. Discover products, service support, and
              expert consultation from Aquakart.
            </p>

            {!userData && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
                <h4 className="text-sm font-semibold text-white">
                  Subscribe to our newsletter
                </h4>
                <p className="mt-2 text-xs text-white/60">
                  Product updates, maintenance guides, and water-care insights
                  in your inbox.
                </p>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold text-white">
                Subcategories
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-white/60">
                {formattedSubCategories.slice(0, 6).map((item) => (
                  <li key={item.title}>
                    <Link
                      href={`/subcategory/${item.title}`}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-white/10 hover:text-white"
                    >
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Categories</h4>
              <ul className="mt-4 space-y-2 text-sm text-white/60">
                {formattedCategories.slice(0, 6).map((item) => (
                  <li key={item.title}>
                    <Link
                      href={`/category/${item.title}`}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-white/10 hover:text-white"
                    >
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Quick links</h4>
              <ul className="mt-4 space-y-2 text-sm text-white/60">
                {navigation.policy.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-white/10 hover:text-white"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="rounded-full border border-white/10 px-3 py-1">
              Made in India
            </span>
            <span>&copy; {year} Aquakart. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            {navigation.social.map(({ name, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                aria-label={name}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AquaFooter;
