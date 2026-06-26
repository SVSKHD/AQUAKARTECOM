import dynamic from "next/dynamic";
import { Fragment, useState, useMemo } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TabGroup,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import AquaLayout from "@/components/Layout/Layout";
import AquaSpinner from "@/components/common/spinner";
import AquaCategoryCard from "@/components/cards/categoryCard";
import { useRouter } from "next/router";
import Link from "next/link";
import LazyImage from "@/components/image/LazyImage";
import AquaHomeHero from "./homeHeroSection";
import {
  SparklesIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const AquaProducts = dynamic(() => import("./products"));

const AquaHomeComponent = ({
  initialCategories = [],
  initialSubCategories = [],
  initialProducts = [],
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const waterGuides = useMemo(
    () => [
      {
        id: "planner",
        title: "Softener planner",
        description:
          "Tell us your household size and hardness level to get the ideal softener capacity and salt schedule.",
        bullets: [
          "Predict salt usage for the next 6 months",
          "Get maintenance reminders on WhatsApp",
          "Receive tailored product recommendations",
        ],
        cta: { label: "Launch planner", href: "/softener-planner" },
        icon: SparklesIcon,
      },
      {
        id: "retrofit",
        title: "Service & retrofit",
        description:
          "Already have a unit? Book an Aquakart engineer to calibrate, retrofit, or upgrade your setup in under 48 hours.",
        bullets: [
          "Covers all major brands and models",
          "Includes 14-point performance checklist",
          "Optional AMC plans with on-call experts",
        ],
        cta: { label: "Book a visit", href: "/services" },
        icon: WrenchScrewdriverIcon,
      },
      {
        id: "assurance",
        title: "Water assurance report",
        description:
          "Upload your latest borewell or corporation report and we’ll decode contaminants, recommend filters, and send a PDF summary.",
        bullets: [
          "AI-assisted analysis of 30+ parameters",
          "Actionable fix list for each contaminant",
          "One-click quote for recommended systems",
        ],
        cta: { label: "Upload report", href: "/water-report" },
        icon: ShieldCheckIcon,
      },
      {
        id: "builder",
        title: "Project builder",
        description:
          "Architects & PMCs can use our builder to spec centralized softening, RO plants, and grey water reuse in minutes.",
        bullets: [
          "Auto-generate BOQs and layout drawings",
          "Compare energy footprint across models",
          "Dedicated project success manager",
        ],
        cta: { label: "Start a project", href: "/projects" },
        icon: RocketLaunchIcon,
      },
    ],
    [],
  );
  const [activeGuideId, setActiveGuideId] = useState(waterGuides[0]?.id);

  const activeGuide = useMemo(
    () =>
      waterGuides.find((item) => item.id === activeGuideId) || waterGuides[0],
    [activeGuideId, waterGuides],
  );
  const ActiveGuideIcon = activeGuide?.icon || SparklesIcon;

  const router = useRouter();
  const SeoData = {
    title: "Aquakart | Premium Water Solutions & Purifiers",
    description:
      "Transform your water quality with Aquakart's advanced softeners and purifiers. Engineered for Indian homes.",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
    canonical: `${process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in"}${router.asPath}`,
    keywords:
      "water softeners, RO purifiers, water softener systems, bathroom water softeners, salt-free water softeners, water purifier systems",
    keyphrases:
      "Affordable water softeners for bathrooms, automatic water softener systems, salt-free water softener prices, RO water purifier solutions",
  };

  const clampTwoLines = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  const clampThreeLines = {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  return (
    <>
      <AquaLayout seo={SeoData}>
        <div className="relative selection:bg-emerald-500 selection:text-white">
          <div className="relative z-10">
            <Dialog
              className="relative z-50 lg:hidden"
              open={mobileMenuOpen}
              onClose={setMobileMenuOpen}
            >
              <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
              />

              <div className="fixed inset-0 z-40 flex">
                <DialogPanel
                  transition
                  className="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl transition duration-300 ease-in-out data-[closed]:-translate-x-full"
                >
                  <div className="flex px-4 pb-2 pt-5">
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sr-only">Close menu</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <TabGroup className="mt-2">
                    <TabPanels as={Fragment}>
                      {initialCategories?.map((category) => (
                        <TabPanel
                          key={category.name}
                          className="space-y-12 px-4 py-6"
                        />
                      ))}
                    </TabPanels>
                  </TabGroup>

                  <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                    <div className="flow-root">
                      <a
                        href="/auth/login"
                        className="-m-2 block p-2 font-medium text-gray-900"
                      >
                        Sign in
                      </a>
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>

            <AquaHomeHero data={initialCategories} />

            <main className="space-y-24 pb-24">
              <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="glass-card relative overflow-hidden rounded-[2rem] p-8 shadow-[0_8px_60px_rgba(0,0,0,0.06)] lg:p-12">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-emerald-50/30 opacity-80" />

                  <div className="relative flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-xl">
                      <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100/50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 backdrop-blur-sm">
                        <SparklesIcon className="h-3 w-3" /> Aquakart Concierge
                      </p>

                      <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Your water journey, <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">simplified.</span>
                      </h2>
                      <p className="mt-4 text-base leading-relaxed text-slate-600">
                        Choose a path below to get instant recommendations,
                        service slots, or project-ready documentation. Tailored
                        specifically for Indian water conditions.
                      </p>

                      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {waterGuides.map((guide) => {
                          const Icon = guide.icon;
                          const isActive = guide.id === activeGuideId;
                          return (
                            <button
                              key={guide.id}
                              type="button"
                              onClick={() => setActiveGuideId(guide.id)}
                              className={`group relative flex min-h-[76px] items-center gap-3 rounded-xl p-4 text-left transition-all duration-300 ${
                                isActive
                                  ? "glass-card scale-[1.02] border-emerald-500/30 bg-emerald-50/60 text-emerald-900 shadow-lg shadow-emerald-500/10"
                                  : "glass-subtle border border-white/50 text-slate-600 hover:border-emerald-200 hover:bg-white/60 hover:shadow-md"
                              }`}
                            >
                              <div
                                className={`shrink-0 rounded-lg p-2 transition-colors ${isActive ? "bg-emerald-200" : "bg-slate-100 group-hover:bg-emerald-100"}`}
                              >
                                <Icon
                                  className={`h-5 w-5 ${isActive ? "text-emerald-700" : "text-slate-500 group-hover:text-emerald-600"}`}
                                />
                              </div>
                              <span
                                className="min-h-[40px] text-sm font-semibold leading-5"
                                style={clampTwoLines}
                              >
                                {guide.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="w-full max-w-lg lg:w-[450px]">
                      <div className="relative flex min-h-[520px] flex-col overflow-hidden rounded-[1.5rem] bg-slate-900 p-8 text-white shadow-2xl ring-1 ring-white/10 transition-all duration-500 sm:min-h-[500px] lg:min-h-[540px]">
                        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-emerald-500/30 blur-2xl" />
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-indigo-500/30 blur-2xl" />

                        <div className="relative flex h-full flex-1 flex-col">
                          <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-emerald-400">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
                              <ActiveGuideIcon className="h-4 w-4" />
                            </span>
                            Guided Experience
                          </div>
                          <h3
                            className="min-h-[64px] text-2xl font-bold leading-8"
                            style={clampTwoLines}
                          >
                            {activeGuide.title}
                          </h3>
                          <p
                            className="mt-3 min-h-[84px] text-sm leading-7 text-slate-300"
                            style={clampThreeLines}
                          >
                            {activeGuide.description}
                          </p>
                          <ul className="mt-6 min-h-[132px] space-y-3">
                            {activeGuide.bullets.map((item) => (
                              <li
                                key={item}
                                className="flex min-h-[36px] items-start gap-3 text-sm leading-6 text-slate-200"
                              >
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                <span style={clampTwoLines}>{item}</span>
                              </li>
                            ))}
                          </ul>
                          {activeGuide.cta && (
                            <Link
                              href={activeGuide.cta.href}
                              className="btn-glass group mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-900 shadow-lg hover:bg-emerald-50 hover:shadow-emerald-500/20"
                            >
                              {activeGuide.cta.label}
                              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="relative">
                <div className="absolute left-0 top-1/2 -z-10 h-[500px] w-full bg-gradient-to-b from-transparent via-emerald-50/50 to-transparent blur-3xl" />
                <AquaProducts initialProducts={initialProducts} />
              </div>

              <section
                aria-labelledby="category-heading"
                className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
              >
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2
                    id="category-heading"
                    className="text-2xl font-bold tracking-tight text-slate-900"
                  >
                    Shop by <span className="text-emerald-600">Collection</span>
                  </h2>
                  <Link
                    href="/categories"
                    className="hidden items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-emerald-600 sm:flex"
                  >
                    Browse all collections
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {initialCategories.length === 0 ? (
                    <div className="col-span-full flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50">
                      <AquaSpinner color="emerald" size="lg" />
                    </div>
                  ) : (
                    initialCategories.slice(0, 10).map((category) => (
                      <AquaCategoryCard
                        key={category?._id || category?.slug || category?.title}
                        category={category}
                        variant="collection"
                      />
                    ))
                  )}
                </div>

                <div className="mt-6 sm:hidden">
                  <Link
                    href="/categories"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition-colors hover:bg-slate-50"
                  >
                    View All Collections
                  </Link>
                </div>
              </section>

              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-900 shadow-2xl">
                  <div className="absolute inset-0">
                    <LazyImage
                      src="https://res.cloudinary.com/aquakartproducts/image/upload/v1741968501/Blogs/jhkfgdhd9yatyml1bz4j.jpg"
                      alt="Aquakart-blog-Background"
                      fill
                      imgClassName="h-full w-full object-cover opacity-40 blur-sm scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-indigo-900/80 to-transparent" />
                  </div>

                  <div className="relative px-6 py-16 sm:px-12 sm:py-24 lg:flex lg:items-center lg:px-16">
                    <div className="max-w-2xl">
                      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-200 backdrop-blur-md">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                        Knowledge Hub
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Why Water Softeners Matter?
                      </h2>
                      <p className="mt-6 text-lg leading-relaxed text-indigo-100">
                        Hard water minerals like calcium and magnesium can
                        damage appliances (efficiency loss) and irritate skin.
                        Discover how ion-exchange technology transforms your
                        daily water quality.
                      </p>
                      <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                          href="/blogs"
                          className="btn-glass rounded-xl bg-white px-6 py-3 font-bold text-indigo-900 shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 hover:shadow-indigo-900/30"
                        >
                          Read Full Article
                        </Link>
                        <Link
                          href="/water-report"
                          className="btn-glass rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md hover:bg-white/20"
                        >
                          Upload Water Report
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </AquaLayout>
    </>
  );
};

export default AquaHomeComponent;
