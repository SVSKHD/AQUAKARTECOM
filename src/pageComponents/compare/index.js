import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import { useState } from "react";
import AquaFavoritesComponent from "./favorites";
import AquaCartComponent from "./cart";

const AquaCompareComponent = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Favourites");

  const tabs = [
    { name: "Favourites", href: "#", current: activeTab === "Favourites" },
    { name: "Cart", href: "#", current: activeTab === "Cart" },
    { name: "Compare", href: "#", current: activeTab === "Compare" },
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
        return <AquaFavoritesComponent />;
      case "Cart":
        return <AquaCartComponent/>;
      case "Compare":
        return <div>Compare products side by side here.</div>;
      default:
        return null;
    }
  };

  return (
    <AquaLayout seo={SeoData}>
      <div>
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
            className="isolate flex divide-x divide-gray-200 rounded-lg shadow"
            aria-label="Tabs"
          >
            {tabs.map((tab, tabIdx) => (
              <a
                key={tab.name}
                href={tab.href}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(tab.name);
                }}
                className={classNames(
                  tab.current
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700",
                  tabIdx === 0 ? "rounded-l-lg" : "",
                  tabIdx === tabs.length - 1 ? "rounded-r-lg" : "",
                  "group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10",
                )}
                aria-current={tab.current ? "page" : undefined}
              >
                <span>{tab.name}</span>
                <span
                  aria-hidden="true"
                  className={classNames(
                    tab.current ? "bg-indigo-500" : "bg-transparent",
                    "absolute inset-x-0 bottom-0 h-0.5",
                  )}
                />
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-4">{renderContent()}</div>
      </div>
    </AquaLayout>
  );
};

export default AquaCompareComponent;
