import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const ShopFiltersPanel = ({
  filters,
  onFilterChange,
  categoryOptions = [],
  subcategoryOptions = [],
  brandOptions = [],
  priceRange = { min: 0, max: 0, value: 0 },
}) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    subcategory: true,
    brand: true,
    price: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChange = (key, value) => {
    onFilterChange(key, value);
  };

  const handlePriceChange = (event) => {
    onFilterChange("price", Number(event.target.value));
  };

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceRange.value || priceRange.max || 0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        onClick={() => toggleSection(section)}
        className="flex w-full items-center justify-between py-4 text-left transition hover:text-emerald-600"
      >
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <ChevronDownIcon
          className={`h-5 w-5 text-slate-400 transition-transform ${
            expandedSections[section] ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {expandedSections[section] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const RadioOption = ({ value, currentValue, onChange, label }) => {
    const isSelected = currentValue === value;
    return (
      <label className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-50">
        <input
          type="radio"
          checked={isSelected}
          onChange={() => onChange(value)}
          className="sr-only"
        />
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
            isSelected
              ? "border-emerald-500 bg-emerald-500"
              : "border-slate-300 group-hover:border-emerald-300"
          }`}
        >
          {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
        </div>
        <span
          className={`text-sm transition ${
            isSelected
              ? "font-semibold text-slate-900"
              : "text-slate-600 group-hover:text-slate-900"
          }`}
        >
          {label}
        </span>
      </label>
    );
  };

  return (
    <div className="space-y-1">
      <FilterSection title="Category" section="category">
        <div className="space-y-1">
          <RadioOption
            value="All"
            currentValue={filters.category}
            onChange={(val) => handleChange("category", val)}
            label="All Categories"
          />
          {categoryOptions.map((option) => (
            <RadioOption
              key={option}
              value={option}
              currentValue={filters.category}
              onChange={(val) => handleChange("category", val)}
              label={option}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Subcategory" section="subcategory">
        <div className="space-y-1">
          <RadioOption
            value="All"
            currentValue={filters.subcategory}
            onChange={(val) => handleChange("subcategory", val)}
            label="All Subcategories"
          />
          {subcategoryOptions.map((option) => (
            <RadioOption
              key={option}
              value={option}
              currentValue={filters.subcategory}
              onChange={(val) => handleChange("subcategory", val)}
              label={option}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Brand" section="brand">
        <div className="space-y-1">
          <RadioOption
            value="All"
            currentValue={filters.brand}
            onChange={(val) => handleChange("brand", val)}
            label="All Brands"
          />
          {brandOptions.map((option) => (
            <RadioOption
              key={option}
              value={option}
              currentValue={filters.brand}
              onChange={(val) => handleChange("brand", val)}
              label={option}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range" section="price">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>{formatCurrency(priceRange.min || 0)}</span>
            <span>{formatCurrency(priceRange.max || 0)}</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={priceRange.min || 0}
              max={priceRange.max || 0}
              value={priceRange.value || priceRange.max || 0}
              onChange={handlePriceChange}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:shadow-lg"
            />
            <div
              className="pointer-events-none absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
              style={{
                width: `${((priceRange.value || priceRange.max) / (priceRange.max || 1)) * 100}%`,
              }}
            />
          </div>
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-center">
            <p className="text-xs font-medium text-emerald-600">Maximum Price</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">{formattedPrice}</p>
          </div>
        </div>
      </FilterSection>
    </div>
  );
};

export default ShopFiltersPanel;
