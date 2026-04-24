import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import dayjs from "dayjs";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 360;
const GAP = 8;

const parseValue = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const buildCalendar = (viewDate) => {
  const startOfMonth = viewDate.startOf("month");
  const gridStart = startOfMonth.subtract(startOfMonth.day(), "day");
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(gridStart.add(i, "day"));
  }
  return days;
};

const computePosition = (rect) => {
  if (typeof window === "undefined")
    return { top: 0, left: 0, width: PANEL_WIDTH };
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const width = Math.min(PANEL_WIDTH, Math.max(rect.width, 280));
  const spaceBelow = viewportH - rect.bottom;
  const openUp =
    spaceBelow < PANEL_HEIGHT + GAP && rect.top > PANEL_HEIGHT + GAP;
  const top = openUp ? rect.top - PANEL_HEIGHT - GAP : rect.bottom + GAP;
  let left = rect.left;
  if (left + width > viewportW - 8) left = viewportW - width - 8;
  if (left < 8) left = 8;
  return { top, left, width };
};

const AquaDatePicker = forwardRef(function AquaDatePicker(
  {
    id,
    name,
    value,
    onChange,
    placeholder = "Select a date",
    min,
    max,
    yearRange = 100,
    className = "",
    disabled = false,
  },
  ref,
) {
  const selected = useMemo(() => parseValue(value), [value]);
  const today = dayjs();
  const [viewDate, setViewDate] = useState(selected || today);
  const [focusDate, setFocusDate] = useState(selected || today);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [mounted, setMounted] = useState(false);

  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const setButtonRef = useCallback(
    (node) => {
      buttonRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (selected) {
      setViewDate(selected);
      setFocusDate(selected);
    }
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    setFocusDate(selected || viewDate);
  }, [open, selected, viewDate]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords(computePosition(rect));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const handler = () => updatePosition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (
        panelRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const minDate = useMemo(() => parseValue(min), [min]);
  const maxDate = useMemo(() => parseValue(max), [max]);

  const years = useMemo(() => {
    const currentYear = today.year();
    const end = maxDate ? maxDate.year() : currentYear;
    const start = minDate ? minDate.year() : currentYear - yearRange;
    const list = [];
    for (let y = end; y >= start; y -= 1) list.push(y);
    return list;
  }, [maxDate, minDate, today, yearRange]);

  const days = useMemo(() => buildCalendar(viewDate), [viewDate]);

  const isDisabled = (day) => {
    if (minDate && day.isBefore(minDate, "day")) return true;
    if (maxDate && day.isAfter(maxDate, "day")) return true;
    return false;
  };

  const emitChange = (nextValue) => {
    if (!onChange) return;
    onChange({ target: { name, value: nextValue } });
  };

  const handleSelect = (day) => {
    if (isDisabled(day)) return;
    emitChange(day.format("YYYY-MM-DD"));
    setOpen(false);
  };

  const moveFocusByDays = (daysToMove) => {
    const nextDay = focusDate.add(daysToMove, "day");
    if (minDate && nextDay.isBefore(minDate, "day")) return;
    if (maxDate && nextDay.isAfter(maxDate, "day")) return;
    setFocusDate(nextDay);
    setViewDate(nextDay);
  };

  const handleGridKeyDown = (event) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        moveFocusByDays(-1);
        break;
      case "ArrowRight":
        event.preventDefault();
        moveFocusByDays(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocusByDays(-7);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveFocusByDays(7);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        handleSelect(focusDate);
        break;
      default:
        break;
    }
  };

  const handleClear = (event) => {
    event?.stopPropagation();
    emitChange("");
    setOpen(false);
  };

  const handleToday = () => {
    if (isDisabled(today)) return;
    setViewDate(today);
    emitChange(today.format("YYYY-MM-DD"));
    setOpen(false);
  };

  const displayLabel = selected ? selected.format("DD MMM YYYY") : placeholder;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={setButtonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`mt-1 flex w-full items-center justify-between rounded-lg border bg-white p-3 text-left text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 ${
          open ? "border-indigo-500 ring-2 ring-indigo-500" : "border-gray-300"
        } ${selected ? "text-gray-900" : "text-gray-400"}`}
      >
        <span className="truncate">{displayLabel}</span>
        <span className="ml-2 flex items-center gap-1">
          {selected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e);
                }
              }}
              className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <CalendarDaysIcon
            className="h-5 w-5 text-indigo-500"
            aria-hidden="true"
          />
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {mounted && open && coords
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 9999,
              }}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xl animate-in fade-in"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewDate(viewDate.subtract(1, "month"))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                <div className="flex flex-1 items-center justify-center gap-1.5">
                  <select
                    value={viewDate.month()}
                    onChange={(e) =>
                      setViewDate(viewDate.month(Number(e.target.value)))
                    }
                    className="rounded-lg bg-transparent px-2 py-1 text-sm font-semibold text-gray-900 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={viewDate.year()}
                    onChange={(e) =>
                      setViewDate(viewDate.year(Number(e.target.value)))
                    }
                    className="rounded-lg bg-transparent px-2 py-1 text-sm font-semibold text-gray-900 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setViewDate(viewDate.add(1, "month"))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                  aria-label="Next month"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {WEEKDAYS.map((d, idx) => (
                  <div key={`${d}-${idx}`} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div
                className="mt-1 grid grid-cols-7 gap-1"
                role="grid"
                tabIndex={0}
                onKeyDown={handleGridKeyDown}
                aria-label="Calendar dates"
              >
                {days.map((day) => {
                  const inMonth = day.month() === viewDate.month();
                  const isSelected = selected && day.isSame(selected, "day");
                  const isTodayCell = day.isSame(today, "day");
                  const disabledDay = isDisabled(day);
                  const isFocused = day.isSame(focusDate, "day");

                  let classes =
                    "h-9 w-full rounded-full text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400";
                  if (disabledDay) {
                    classes += " cursor-not-allowed text-gray-300";
                  } else if (isSelected) {
                    classes +=
                      " bg-indigo-600 text-white shadow-sm hover:bg-indigo-500";
                  } else if (isTodayCell) {
                    classes +=
                      " bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-100";
                  } else if (inMonth) {
                    classes += " text-gray-700 hover:bg-gray-100";
                  } else {
                    classes += " text-gray-300 hover:bg-gray-50";
                  }

                  if (isFocused && !disabledDay && !isSelected) {
                    classes += " ring-2 ring-indigo-200";
                  }

                  return (
                    <button
                      key={day.format("YYYY-MM-DD")}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => handleSelect(day)}
                      onFocus={() => setFocusDate(day)}
                      className={classes}
                      aria-pressed={Boolean(isSelected)}
                    >
                      {day.date()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => handleClear()}
                  className="rounded-full px-3 py-1 font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600 transition hover:bg-indigo-100"
                >
                  Today
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
});

export default AquaDatePicker;
