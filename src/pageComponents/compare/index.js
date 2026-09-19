import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import { useState } from "react";
import { Heart, ShoppingCart, GitCompare } from "lucide-react";
import AquaFavoritesTabContent from "./favorites";
import AquaCartTabContent from "./cart";
import AquaCompareTabContent from "./Compare";

const AquaCompareComponent = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Compare");

  const tabs = [
    {
      name: "Compare",
      href: "#",
      current: activeTab === "Compare",
      icon: GitCompare,
    },
    {
      name: "Favourites",
      href: "#",
      current: activeTab === "Favourites",
      icon: Heart,
    },
    {
      name: "Cart",
      href: "#",
      current: activeTab === "Cart",
      icon: ShoppingCart,
    },
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  const SeoData = {
    title: "Aquakart | Compare Products",
    description:
      "Aquakart's product comparison tool empowers shoppers to make informed decisions by offering side-by-side comparisons of features, prices, and customer reviews. Easily evaluate multiple products, discover the best deals, and find the perfect fit for your needs.",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Favourites":
        return <AquaFavoritesTabContent />;
      case "Cart":
        return <AquaCartTabContent />;
      case "Compare":
        return <AquaCompareTabContent />;
      default:
        return null;
    }
  };

  return (
    <AquaLayout seo={SeoData}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white relative overflow-hidden">
        {/* iOS 26 Aurora Background - Light Version */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse" />
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse delay-1000" />
          <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-emerald-100/40 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl drop-shadow-sm">
                Hub
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  .
                </span>
              </h1>
              <p className="max-w-xl text-lg text-slate-600 font-light leading-relaxed mx-auto">
                Manage your favorites, cart, and comparisons in one unified
                glass workspace.
              </p>
            </div>

            {/* Mobile Tab Selector */}
            <div className="sm:hidden w-full max-w-xs">
              <label htmlFor="tabs" className="sr-only">
                Select a tab
              </label>
              <select
                id="tabs"
                name="tabs"
                className="block w-full rounded-2xl border-white/40 bg-white/50 backdrop-blur-md shadow-lg focus:border-indigo-500 focus:ring-indigo-500 text-base py-3 text-slate-700"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                {tabs.map((tab) => (
                  <option key={tab.name} value={tab.name}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Glass Tabs */}
            <div className="hidden sm:block">
              <nav
                className="inline-flex rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl p-1.5 space-x-2"
                aria-label="Tabs"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.name}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(tab.name);
                      }}
                      className={classNames(
                        tab.current
                          ? "bg-white text-indigo-900 shadow-md scale-105"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/40",
                        "group relative flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300",
                      )}
                      aria-current={tab.current ? "page" : undefined}
                    >
                      <Icon
                        className={classNames(
                          tab.current
                            ? "text-indigo-600"
                            : "text-slate-400 group-hover:text-slate-600",
                          "w-4 h-4 transition-colors",
                        )}
                      />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="mt-6 transition-all duration-500 sm:mt-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaCompareComponent;
