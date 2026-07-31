"use client";

import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useEffect, useMemo, useState } from "react";

const normalizeItemTitle = (item) =>
  typeof item === "string" ? item : item?.title || item?.name || "";

const normalizeItemId = (item, index) =>
  typeof item === "string"
    ? item
    : item?.id || item?._id || item?.title || index;

const Combobox = ({
  data = [],
  label,
  onSelect,
  clear = false,
  placeholder = "Select option",
  noneLabel = "None",
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const normalizedData = useMemo(
    () =>
      data.map((item, index) => ({
        ...(typeof item === "object" && item !== null ? item : { value: item }),
        id: normalizeItemId(item, index),
        title: normalizeItemTitle(item),
        original: item,
      })),
    [data],
  );

  const filteredData = useMemo(() => {
    const noneOption = { id: "none", title: noneLabel, original: null };
    if (!query) return [noneOption, ...normalizedData];

    const formattedQuery = query.toLowerCase();
    return [
      noneOption,
      ...normalizedData.filter((item) =>
        item.title.toLowerCase().includes(formattedQuery),
      ),
    ];
  }, [query, normalizedData, noneLabel]);

  const handleSelection = (item) => {
    if (!item || item.id === "none") {
      setSelectedItem(null);
      onSelect?.(null);
    } else {
      setSelectedItem(item);
      onSelect?.(item.original ?? item);
    }
    setQuery("");
  };

  useEffect(() => {
    if (clear) {
      setSelectedItem(null);
      setQuery("");
    }
  }, [clear]);

  return (
    <HeadlessCombobox
      as="div"
      value={selectedItem}
      onChange={handleSelection}
      className={className}
    >
      {label && (
        <Label className="block text-sm font-semibold text-slate-800">
          {label}
        </Label>
      )}
      <div className="relative mt-2 overflow-visible">
        <ComboboxInput
          className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(item) => item?.title || ""}
          placeholder={placeholder}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-2xl px-3 text-slate-400 focus:outline-none">
          <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
        </ComboboxButton>

        {filteredData.length > 0 && (
          <ComboboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-2 text-sm shadow-none ring-1 ring-black/5 focus:outline-none">
            {filteredData.map((item) => (
              <ComboboxOption
                key={item.id}
                value={item}
                className="group relative cursor-pointer select-none px-4 py-2.5 text-slate-900 transition-colors data-[focus]:bg-slate-950 data-[focus]:text-white"
              >
                <span
                  className={`block truncate pr-8 ${
                    selectedItem?.id === item.id
                      ? "font-semibold"
                      : "font-medium"
                  }`}
                >
                  {item.title}
                </span>
                {selectedItem?.id === item.id && item.id !== "none" && (
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-950 group-data-[focus]:text-white">
                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        )}
      </div>
    </HeadlessCombobox>
  );
};

export default Combobox;
