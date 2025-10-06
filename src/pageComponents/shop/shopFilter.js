import { useSelector } from "react-redux";

const ShopFiltersPanel = () => {
  const { categories, subcategories } = useSelector((state) => {
    const slice = state?.dynamicData;
    if (!slice || typeof slice !== "object") {
      return {
        categories: { data: [] },
        subcategories: { data: [] },
      };
    }
    return {
      categories: slice.categories || { data: [] },
      subcategories: slice.subcategories || { data: [] },
    };
  });
  return (
    <div className="space-y-6 p-6 rounded-xl shadow-xl ring-1 ring-white/10">
      {["Category", "Subcategory", "Brand"].map((label) => (
        <div key={label}>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            {label}
          </label>
          <div className="relative">
            <select className="w-full appearance-none bg-white/70 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md">
              {label === "Category" && (
                <>
                  <option>All</option>
                  {categories?.data?.map((r, i) => (
                    <option key={i}>{r.title}</option>
                  ))}
                </>
              )}
              {label === "Subcategory" && (
                <>
                  <option>All</option>
                  {subcategories?.data?.map((r, i) => (
                    <option key={i}>{r.title}</option>
                  ))}
                </>
              )}
              {label === "Brand" && (
                <>
                  <option>All</option>
                  <option>Aquakart</option>
                  <option>PureFlow</option>
                </>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              ▼
            </div>
          </div>
        </div>
      ))}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          Price Range
        </label>
        <div className="flex items-center justify-between text-sm text-gray-900">
          <span>₹0</span>
          <span>₹10000+</span>
        </div>
        <input
          type="range"
          min="0"
          max="10000"
          className="w-full mt-1 appearance-none bg-gray-300 h-2 rounded-lg outline-none transition-opacity duration-200"
        />
      </div>
    </div>
  );
};

export default ShopFiltersPanel;
