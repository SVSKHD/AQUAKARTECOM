import { Fragment, useState, useEffect, useMemo } from "react";
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
import { useRouter } from "next/router";
import Link from "next/link";
import AquaProducts from "./products";
import AquaHomeHero from "./homeHeroSection";
import CategoryServiceOperations from "@/services/category";
import SubCategoryServiceOperations from "@/services/subcategory";
import {
  SparklesIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

const AquaHomeComponent = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [subCategoryData, setSubCategoryData] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState({
    category: false,
    subcategory: false,
    product: false,
  });
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
    () => waterGuides.find((item) => item.id === activeGuideId) || waterGuides[0],
    [activeGuideId, waterGuides],
  );
  const ActiveGuideIcon = activeGuide?.icon || SparklesIcon;

  useEffect(() => {
    const fetchAllCategories = async () => {
      CategoryServiceOperations.Allcategories().then((res) => {
        setCategoryData(res.data?.data);
      });
    };
    const fetchAllSubCategories = async () => {
      SubCategoryServiceOperations.AllSubcategories().then((res) => {
        setSubCategoryData(res.data?.data);
      });
    };
    fetchAllCategories();
    fetchAllSubCategories();
  }, []);

  const router = useRouter();
  const SeoData = {
    title: "Aquakart | Top Water Softeners, Purifiers & More for Your Home",
    description:
      "Discover top-quality water softeners and purifiers at Aquakart. Revolutionizing water quality, we ensure pure, soft water for a healthier lifestyle.",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
    canonical: `${process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in"}${router.asPath}`,
    keywords:
      "water softeners, RO purifiers, water softener systems, bathroom water softeners, salt-free water softeners, water purifier systems",
    keyphrases:
      "Affordable water softeners for bathrooms, automatic water softener systems, salt-free water softener prices, RO water purifier solutions",
  };

  return (
    <>
      <AquaLayout seo={SeoData}>
        <div>
          <div className="bg-white">
            {/* Mobile menu */}
            <Dialog
              className="relative z-40 lg:hidden"
              open={mobileMenuOpen}
              onClose={setMobileMenuOpen}
            >
              <DialogBackdrop
                transition
                className="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
              />

              <div className="fixed inset-0 z-40 flex">
                <DialogPanel
                  transition
                  className="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl transition duration-300 ease-in-out data-[closed]:-translate-x-full"
                >
                  <div className="flex px-4 pb-2 pt-5">
                    <button
                      type="button"
                      className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sr-only">Close menu</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  {/* {categoryData.length} */}
                  {/* Links */}
                  <TabGroup className="mt-2">
                    <TabPanels as={Fragment}>
                      {categoryData?.map((category) => (
                        <TabPanel
                          key={category.name}
                          className="space-y-12 px-4 py-6"
                        ></TabPanel>
                      ))}
                    </TabPanels>
                  </TabGroup>

                  <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                    <div className="flow-root">
                      <a
                        href="#"
                        className="-m-2 block p-2 font-medium text-gray-900"
                      >
                        Create an account
                      </a>
                    </div>
                    <div className="flow-root">
                      <a
                        href="#"
                        className="-m-2 block p-2 font-medium text-gray-900"
                      >
                        Sign in
                      </a>
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>

            {/* Hero section */}
            <AquaHomeHero data={categoryData} />

            <main>
              <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 rounded-3xl bg-white px-6 py-8 shadow-lg ring-1 ring-slate-100 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      Aquakart concierge
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      Plan, upgrade, or service in a few guided steps
                    </h2>
                    <p className="mt-3 text-sm text-slate-500">
                      Choose a journey below to get instant recommendations, service slots, or project-ready documentation. Everything is mapped to real Indian water challenges.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {waterGuides.map((guide) => {
                        const Icon = guide.icon;
                        const isActive = guide.id === activeGuideId;
                        return (
                          <button
                            key={guide.id}
                            type="button"
                            onClick={() => setActiveGuideId(guide.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                              isActive
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow"
                                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-600"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {guide.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-full max-w-lg rounded-3xl bg-slate-900/95 p-6 text-white shadow-xl lg:w-auto">
                    <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-emerald-200">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                        <ActiveGuideIcon className="h-5 w-5" />
                      </span>
                      Guided experience
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                      {activeGuide.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-200">
                      {activeGuide.description}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-emerald-100">
                      {activeGuide.bullets.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {activeGuide.cta && (
                      <Link
                        href={activeGuide.cta.href}
                        className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                      >
                        {activeGuide.cta.label}
                        <span className="ml-1" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </section>

              <AquaProducts />

              <section
                aria-labelledby="category-heading"
                className="pt-2 sm:pt-2 xl:mx-auto xl:max-w-7xl xl:px-8"
              >
                <div className="px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-0">
                  <h2
                    id="category-heading"
                    className="text-2xl font-bold tracking-tight text-gray-900"
                  >
                    Shop by Category
                  </h2>
                  <a
                    href="/categories"
                    className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block"
                  >
                    Browse All categories
                    <span aria-hidden="true"> &rarr;</span>
                  </a>
                </div>

                <div className="mt-4 flow-root">
                  <div className="-my-2">
                    <div className="relative box-content h-80 overflow-x-auto py-2 xl:overflow-visible">
                      <div className="absolute flex space-x-8 px-4 sm:px-6 lg:px-8 xl:relative xl:grid xl:grid-cols-5 xl:gap-x-8 xl:space-x-0 xl:px-0">
                        {loading.category ? (
                          <>
                            <div className="flex items-center text-center justify-center p-20">
                              <div className="text-center">
                                <AquaSpinner color="blue" size="lg" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {categoryData.map((category) => (
                              <a
                                key={category.title}
                                href={`/category/${category.title}`}
                                className="relative flex h-80 w-56 flex-col overflow-hidden rounded-lg p-6 hover:opacity-75 xl:w-auto"
                              >
                                <span
                                  aria-hidden="true"
                                  className="absolute inset-0"
                                >
                                  <img
                                    src={category.photos[0].secure_url}
                                    alt={category.title}
                                    className="h-full w-full object-cover object-center"
                                  />
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-800 opacity-50"
                                />
                                <a
                                  href={`/category/${category?.title}`}
                                  className="relative mt-auto text-center text-xl font-bold text-white"
                                >
                                  {category.title}
                                </a>
                              </a>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 px-4 sm:hidden">
                  <a
                    href="/categories"
                    className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Browse All categories
                    <span aria-hidden="true"> &rarr;</span>
                  </a>
                </div>
              </section>

              {/* Featured section */}
              <section
                aria-labelledby="social-impact-heading"
                className="mx-auto p-10 max-w-7xl px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0">
                    <img
                      src="https://res.cloudinary.com/aquakartproducts/image/upload/v1741968501/Blogs/jhkfgdhd9yatyml1bz4j.jpg"
                      alt="Aquakart | Blogs"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="relative bg-gray-900 bg-opacity-75 px-6 py-32 sm:px-12 sm:py-40 lg:px-16">
                    <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
                      <h2
                        id="social-impact-heading"
                        className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                      >
                        <span className="block sm:inline">Level up Water </span>
                      </h2>
                      <p className="mt-3 text-xl text-white">
                        Softeners are chemical agents used to reduce the
                        hardness of water by removing or neutralizing minerals
                        such as calcium and magnesium. These minerals can cause
                        scaling, buildup, and inefficiency in plumbing and
                        appliances, as well as less effective cleaning with
                        soaps and detergents. By replacing the hard minerals
                        with sodium or potassium ions through a process called
                        ion exchange, water softeners improve water quality,
                      </p>
                      <Link
                        href="/blogs"
                        className="mt-8 block w-full rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 sm:w-auto"
                      >
                        Know More
                      </Link>
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
