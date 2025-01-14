"use client";

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useState, useEffect, useMemo } from "react";

const AquaCombobox = ({ data = [], label, onSelect, clear }) => {
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // Memoized filtering for performance optimization
  const filteredData = useMemo(() => {
    if (!query) return [{ id: "none", title: "None" }, ...data]; // Add "None" option
    return [
      { id: "none", title: "None" },
      ...data.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()),
      ),
    ];
  }, [query, data]);

  // Handle selection
  const handleSelection = (item) => {
    if (item.id === "none") {
      setSelectedItem(null);
      onSelect(null);
    } else {
      setSelectedItem(item);
      onSelect(item);
    }
    setQuery(""); // Clear search after selection
  };

  // Clear selection when the `clear` prop is true
  useEffect(() => {
    if (clear) {
      setSelectedItem(null);
    }
  }, [clear]);

  return (
    <Combobox as="div" value={selectedItem} onChange={handleSelection}>
      <Label className="block text-sm font-medium text-gray-900">{label}</Label>
      <div className="relative mt-2">
        <ComboboxInput
          className="block w-full rounded-md bg-white py-1.5 pl-3 pr-12 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600 sm:text-sm"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(item) => item?.title || "None"}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon
            className="size-5 text-gray-400"
            aria-hidden="true"
          />
        </ComboboxButton>

        {filteredData.length > 0 && (
          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {filteredData.map((item) => (
              <ComboboxOption
                key={item.id}
                value={item}
                className="group relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
              >
                <span
                  className={`block truncate ${selectedItem?.id === item.id ? "font-semibold" : ""}`}
                >
                  {item?.title}
                </span>
                {selectedItem?.id === item.id && item.id !== "none" && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-data-[focus]:text-white">
                    <CheckIcon className="size-5" aria-hidden="true" />
                  </span>
                )}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        )}
      </div>
    </Combobox>
  );
};

export default AquaCombobox;
