import { AnimatePresence, motion } from "framer-motion";
import {
  BadgePercent,
  Check,
  ChevronDown,
  IndianRupee,
  PackageCheck,
  Search,
  Sparkles,
  Star,
  Tags,
  X,
} from "lucide-react";
import { useState } from "react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const FilterSection = ({
  title,
  hint,
  icon: Icon,
  open,
  onToggle,
  children,
}) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white"
      aria-expanded={open}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-black tracking-[-0.02em] text-slate-950">
          {title}
        </strong>
        {hint ? (
          <small className="mt-0.5 block truncate text-[10px] text-slate-400">
            {hint}
          </small>
        ) : null}
      </span>
      <ChevronDown
        size={17}
        className={`shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      />
    </button>

    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  </section>
);

const ChoiceButton = ({ selected, label, onClick, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${
      selected
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-transparent bg-slate-50/80 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950"
    }`}
  >
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
        selected
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-slate-300 bg-white text-transparent group-hover:border-emerald-300"
      }`}
    >
      <Check size={11} strokeWidth={3} />
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {Number.isFinite(count) ? (
      <span className="text-[10px] font-semibold text-slate-400">{count}</span>
    ) : null}
  </button>
);

const ToggleRow = ({ checked, onChange, icon: Icon, title, description }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`grid min-h-[72px] w-full grid-cols-[36px_minmax(0,1fr)_44px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
      checked
        ? "border-emerald-200 bg-emerald-50/90"
        : "border-slate-200/80 bg-white/70 hover:bg-white"
    }`}
  >
    <span
      className={`grid h-9 w-9 place-items-center rounded-xl ${
        checked ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      <Icon size={17} />
    </span>
    <span className="min-w-0 self-center">
      <strong className="block text-xs font-black leading-4 text-slate-900">
        {title}
      </strong>
      <small className="mt-0.5 block text-[10px] leading-4 text-slate-500">
        {description}
      </small>
    </span>
    <span
      className={`relative h-6 w-11 justify-self-end rounded-full transition ${
        checked ? "bg-emerald-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full border border-slate-200 bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  </button>
);

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
    subcategory: false,
    brand: false,
    price: true,
    rating: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  const currentPrice = Number.isFinite(Number(priceRange.value))
    ? Number(priceRange.value)
    : Number(priceRange.max) || 0;
  const minPrice = Number(priceRange.min) || 0;
  const maxPrice = Number(priceRange.max) || 0;
  const rangeSize = Math.max(maxPrice - minPrice, 1);
  const progress = Math.max(
    0,
    Math.min(100, ((currentPrice - minPrice) / rangeSize) * 100),
  );

  const renderOptions = (key, options, allLabel) => (
    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
      <ChoiceButton
        selected={filters[key] === "All"}
        label={allLabel}
        onClick={() => onFilterChange(key, "All")}
      />
      {options.map((option) => (
        <ChoiceButton
          key={option}
          selected={filters[key] === option}
          label={option}
          onClick={() => onFilterChange(key, option)}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={filters.query}
          onChange={(event) => onFilterChange("query", event.target.value)}
          placeholder="Search name, brand or use…"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white/85 pl-11 pr-11 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => onFilterChange("query", "")}
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Clear product search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2">
        <ToggleRow
          checked={filters.inStockOnly}
          onChange={(value) => onFilterChange("inStockOnly", value)}
          icon={PackageCheck}
          title="Ready to buy"
          description="In-stock only"
        />
        <ToggleRow
          checked={filters.offersOnly}
          onChange={(value) => onFilterChange("offersOnly", value)}
          icon={BadgePercent}
          title="Best offers"
          description="Discounted only"
        />
      </div>

      <FilterSection
        title="Category"
        hint={`${categoryOptions.length} water-solution groups`}
        icon={Sparkles}
        open={expandedSections.category}
        onToggle={() => toggleSection("category")}
      >
        {renderOptions("category", categoryOptions, "All categories")}
      </FilterSection>

      <FilterSection
        title="Solution type"
        hint={`${subcategoryOptions.length} specialist options`}
        icon={Tags}
        open={expandedSections.subcategory}
        onToggle={() => toggleSection("subcategory")}
      >
        {renderOptions("subcategory", subcategoryOptions, "All solution types")}
      </FilterSection>

      <FilterSection
        title="Brand"
        hint={`${brandOptions.length} trusted manufacturers`}
        icon={BadgePercent}
        open={expandedSections.brand}
        onToggle={() => toggleSection("brand")}
      >
        {renderOptions("brand", brandOptions, "All brands")}
      </FilterSection>

      <FilterSection
        title="Budget"
        hint={`Up to ${formatCurrency(currentPrice)}`}
        icon={IndianRupee}
        open={expandedSections.price}
        onToggle={() => toggleSection("price")}
      >
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="block text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                Your ceiling
              </span>
              <strong className="mt-1 block text-lg font-black tracking-[-0.04em] text-emerald-700">
                {formatCurrency(currentPrice)}
              </strong>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
            </span>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200" />
            <div
              className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={minPrice}
              max={Math.max(maxPrice, minPrice)}
              step={Math.max(Math.round(rangeSize / 100), 1)}
              value={currentPrice}
              onChange={(event) =>
                onFilterChange("price", Number(event.target.value))
              }
              className="relative z-10 h-7 w-full cursor-pointer appearance-none bg-transparent accent-emerald-500 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-emerald-500"
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection
        title="Customer rating"
        hint={filters.rating ? `${filters.rating}+ stars` : "Any rating"}
        icon={Star}
        open={expandedSections.rating}
        onToggle={() => toggleSection("rating")}
      >
        <div className="space-y-1">
          {[
            [0, "Any rating"],
            [4, "4 stars & above"],
            [3, "3 stars & above"],
          ].map(([value, label]) => (
            <ChoiceButton
              key={value}
              selected={filters.rating === value}
              label={label}
              onClick={() => onFilterChange("rating", value)}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export default ShopFiltersPanel;
