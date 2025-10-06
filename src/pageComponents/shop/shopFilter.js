const ShopFiltersPanel = ({
  filters,
  onFilterChange,
  categoryOptions = [],
  subcategoryOptions = [],
  brandOptions = [],
  priceRange = { min: 0, max: 0, value: 0 },
}) => {
  const handleChange = (key) => (event) => {
    onFilterChange(key, event.target.value);
  };

  const handlePriceChange = (event) => {
    onFilterChange("price", Number(event.target.value));
  };

  const renderOptions = (options) => [
    <option key="all" value="All">
      All
    </option>,
    ...options.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    )),
  ];

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceRange.value || priceRange.max || 0);

  return (
    <div className="space-y-6 rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-100">
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-900">
          Category
        </label>
        <div className="relative">
          <select
            value={filters.category}
            onChange={handleChange("category")}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white/70 px-4 py-2 text-gray-900 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {renderOptions(categoryOptions)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
            ▼
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-900">
          Subcategory
        </label>
        <div className="relative">
          <select
            value={filters.subcategory}
            onChange={handleChange("subcategory")}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white/70 px-4 py-2 text-gray-900 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {renderOptions(subcategoryOptions)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
            ▼
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-900">
          Brand
        </label>
        <div className="relative">
          <select
            value={filters.brand}
            onChange={handleChange("brand")}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white/70 px-4 py-2 text-gray-900 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {renderOptions(brandOptions)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
            ▼
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-900">
          Price up to
        </label>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(priceRange.min || 0)}</span>
          <span>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(priceRange.max || 0)}</span>
        </div>
        <input
          type="range"
          min={priceRange.min || 0}
          max={priceRange.max || 0}
          value={priceRange.value || priceRange.max || 0}
          onChange={handlePriceChange}
          className="mt-2 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-emerald-400 to-sky-400 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
        />
        <p className="mt-2 text-sm font-medium text-emerald-700">
          Up to {formattedPrice}
        </p>
      </div>
    </div>
  );
};

export default ShopFiltersPanel;
