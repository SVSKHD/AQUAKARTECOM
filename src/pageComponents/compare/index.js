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
      name: "Favourites",
      href: "#",
      current: activeTab === "Favourites",
      icon: Heart
    },
    {
      name: "Cart",
      href: "#",
      current: activeTab === "Cart",
      icon: ShoppingCart
    },
    {
      name: "Compare",
      href: "#",
      current: activeTab === "Compare",
      icon: GitCompare
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">
              Select a tab
            </label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-3"
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

          <div className="hidden sm:block">
            <nav
              className="inline-flex rounded-2xl bg-white shadow-lg p-1.5 space-x-1"
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
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                      "group relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                    )}
                    aria-current={tab.current ? "page" : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-6">{renderContent()}</div>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaCompareComponent;
