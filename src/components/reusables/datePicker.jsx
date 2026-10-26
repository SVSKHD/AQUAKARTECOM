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
import s from "./datePicker.module.css";

// Glass date picker shared by the site (Pages Router) and the Aqua app (App
// Router). Styled by its own CSS module, so it doesn't need Tailwind; inside
// the Aqua app it picks up the Aqua theme (light/dark) from its trigger.
//
// `birthday`: opens on a year grid (nobody wants to page back 30 years month
// by month), shows the age next to the date, and defaults to 1900 → today.
// onChange gets an input-like event: { target: { name, value: "YYYY-MM-DD" } }.

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
const PANEL_HEIGHT = 400;
const GAP = 8;
// Below this width the panel is a bottom sheet over a dimmed page.
const SHEET_BELOW = 560;

// Aqua theme tokens copied from the trigger onto the portalled panel, which
// renders outside .aq-root and would otherwise lose them.
const THEME_VARS = [
  "--aq-ink",
  "--aq-mut",
  "--aq-body",
  "--aq-surf",
  "--aq-mint",
  "--aq-mintbd",
  "--aq-mintink",
  "--aq-mintrgb",
  "--aq-bd",
  "--aq-gl",
  "--aq-sh",
  "--aq-ln",
];

const parseValue = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const buildCalendar = (viewDate) => {
  const startOfMonth = viewDate.startOf("month");
  const gridStart = startOfMonth.subtract(startOfMonth.day(), "day");
  const days = [];
  for (let i = 0; i < 42; i += 1) days.push(gridStart.add(i, "day"));
  return days;
};

const computePosition = (rect) => {
  if (typeof window === "undefined") return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw < SHEET_BELOW) return { sheet: true };
  const width = Math.min(PANEL_WIDTH, vw - 16);
  const openUp =
    vh - rect.bottom < PANEL_HEIGHT + GAP && rect.top > PANEL_HEIGHT + GAP;
  const top = openUp ? rect.top - PANEL_HEIGHT - GAP : rect.bottom + GAP;
  const left = Math.min(Math.max(8, rect.left), vw - width - 8);
  return { sheet: false, top, left, width };
};

const ageOf = (d, now = dayjs()) => now.diff(d, "year");

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
    birthday = false,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
  },
  ref,
) {
  const selected = useMemo(() => parseValue(value), [value]);
  const today = useMemo(() => dayjs(), []);
  const minDate = useMemo(
    () => parseValue(min) || (birthday ? dayjs("1900-01-01") : null),
    [min, birthday],
  );
  const maxDate = useMemo(
    () => parseValue(max) || (birthday ? today : null),
    [max, birthday, today],
  );

  const [open, setOpen] = useState(false);
  // "day" grid, "month" grid or "year" grid.
  const [view, setView] = useState("day");
  const [viewDate, setViewDate] = useState(selected || today);
  const [focusDate, setFocusDate] = useState(selected || today);
  const [coords, setCoords] = useState(null);
  const [theme, setTheme] = useState(null);
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

  const years = useMemo(() => {
    const end = maxDate ? maxDate.year() : today.year();
    const start = minDate ? minDate.year() : today.year() - yearRange;
    const list = [];
    for (let y = end; y >= start; y -= 1) list.push(y);
    return list;
  }, [maxDate, minDate, today, yearRange]);

  const openPanel = () => {
    // A birthday with no date yet: start ~25 years back on the year grid.
    const start = selected || (birthday ? today.subtract(25, "year") : today);
    setViewDate(start);
    setFocusDate(start);
    setView(birthday && !selected ? "year" : "day");
    const el = buttonRef.current;
    if (el) {
      const cs = getComputedStyle(el);
      const t = {};
      THEME_VARS.forEach((v) => {
        const val = cs.getPropertyValue(v).trim();
        if (val) t[v] = val;
      });
      // The panel renders in <body>; keep the field's font, not the default.
      t.fontFamily = cs.fontFamily;
      setTheme(t);
      setCoords(computePosition(el.getBoundingClientRect()));
    }
    setOpen(true);
  };

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () =>
      buttonRef.current &&
      setCoords(computePosition(buttonRef.current.getBoundingClientRect()));
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        panelRef.current?.contains(e.target) ||
        buttonRef.current?.contains(e.target)
      )
        return;
      close(false);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      // Esc inside a dialog closes the picker only, not the dialog under it.
      e.stopPropagation();
      close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, close]);

  // Focus moves into the panel: the selected/focused cell of the current view.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target =
        panel.querySelector('[data-focus="true"]') ||
        panel.querySelector('[aria-selected="true"]');
      target?.focus({ preventScroll: view !== "year" });
      if (view === "year") target?.scrollIntoView?.({ block: "center" });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, view]);

  const days = useMemo(() => buildCalendar(viewDate), [viewDate]);

  const outOfRange = (d, unit = "day") =>
    (minDate && d.isBefore(minDate, unit)) ||
    (maxDate && d.isAfter(maxDate, unit));

  const emit = (next) => onChange?.({ target: { name, value: next } });

  const pickDay = (d) => {
    if (outOfRange(d)) return;
    emit(d.format("YYYY-MM-DD"));
    close();
  };

  const moveFocus = (n) => {
    const next = focusDate.add(n, "day");
    if (outOfRange(next)) return;
    setFocusDate(next);
    setViewDate(next);
    requestAnimationFrame(() =>
      panelRef.current?.querySelector('[data-focus="true"]')?.focus(),
    );
  };

  const onGridKey = (e) => {
    const step = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }[e.key];
    if (step) {
      e.preventDefault();
      moveFocus(step);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pickDay(focusDate);
    }
  };

  const shift = (dir) => {
    if (view === "day") setViewDate(viewDate.add(dir, "month"));
    else if (view === "month") setViewDate(viewDate.add(dir, "year"));
  };
  const canShift = (dir) => {
    if (view === "year") return false;
    const unit = view === "day" ? "month" : "year";
    const next = viewDate.add(dir, unit);
    return !outOfRange(next, unit);
  };

  const age = selected && birthday ? ageOf(selected) : null;
  const label = selected ? selected.format("DD MMM YYYY") : placeholder;

  const title =
    view === "day"
      ? `${MONTHS[viewDate.month()]} ${viewDate.year()}`
      : view === "month"
        ? `${viewDate.year()}`
        : "Pick a year";

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={birthday ? "Choose your birthday" : "Choose a date"}
      className={s.panel}
      data-sheet={coords?.sheet || undefined}
      style={{
        ...theme,
        ...(coords && !coords.sheet
          ? { top: coords.top, left: coords.left, width: coords.width }
          : null),
      }}
    >
      {coords?.sheet && <span className={s.grab} aria-hidden="true" />}
      <div className={s.head}>
        <button
          type="button"
          className={s.nav}
          onClick={() => shift(-1)}
          disabled={!canShift(-1)}
          aria-label={view === "day" ? "Previous month" : "Previous year"}
          hidden={view === "year"}
        >
          <ChevronLeftIcon aria-hidden="true" />
        </button>
        <button
          type="button"
          className={s.title}
          aria-live="polite"
          onClick={() =>
            setView(view === "day" ? "year" : view === "month" ? "year" : "day")
          }
          title={view === "year" ? "Back to days" : "Pick a year"}
        >
          {title}
          <ChevronDownIcon
            aria-hidden="true"
            data-up={view !== "day" || undefined}
          />
        </button>
        <button
          type="button"
          className={s.nav}
          onClick={() => shift(1)}
          disabled={!canShift(1)}
          aria-label={view === "day" ? "Next month" : "Next year"}
          hidden={view === "year"}
        >
          <ChevronRightIcon aria-hidden="true" />
        </button>
      </div>

      {view === "year" && (
        <div className={s.years} role="listbox" aria-label="Year">
          {years.map((y) => {
            const on = y === viewDate.year();
            return (
              <button
                key={y}
                type="button"
                role="option"
                aria-selected={on}
                data-focus={on || undefined}
                className={s.cell}
                onClick={() => {
                  setViewDate(viewDate.year(y));
                  setView("month");
                }}
              >
                {y}
              </button>
            );
          })}
        </div>
      )}

      {view === "month" && (
        <div className={s.months} role="listbox" aria-label="Month">
          {MONTHS.map((m, i) => {
            const d = viewDate.month(i);
            const on = i === viewDate.month();
            return (
              <button
                key={m}
                type="button"
                role="option"
                aria-selected={on}
                data-focus={on || undefined}
                disabled={outOfRange(d, "month")}
                className={s.cell}
                onClick={() => {
                  setViewDate(d);
                  setFocusDate(
                    selected && selected.isSame(d, "month")
                      ? selected
                      : d.startOf("month"),
                  );
                  setView("day");
                }}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
      )}

      {view === "day" && (
        <>
          <div className={s.weekdays} aria-hidden="true">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div
            className={s.days}
            role="grid"
            aria-label={title}
            onKeyDown={onGridKey}
          >
            {days.map((d) => {
              const off = outOfRange(d);
              const on = selected && d.isSame(selected, "day");
              const focus = d.isSame(focusDate, "day");
              return (
                <button
                  key={d.format("YYYY-MM-DD")}
                  type="button"
                  role="gridcell"
                  tabIndex={focus ? 0 : -1}
                  data-focus={focus || undefined}
                  aria-selected={Boolean(on)}
                  aria-label={d.format("dddd, D MMMM YYYY")}
                  disabled={off}
                  data-out={d.month() !== viewDate.month() || undefined}
                  data-today={d.isSame(today, "day") || undefined}
                  className={s.day}
                  onClick={() => pickDay(d)}
                  onFocus={() => setFocusDate(d)}
                >
                  {d.date()}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className={s.foot}>
        <button
          type="button"
          className={s.ghost}
          onClick={() => {
            emit("");
            close();
          }}
          disabled={!selected}
        >
          Clear
        </button>
        {!birthday && !outOfRange(today) && (
          <button
            type="button"
            className={s.soft}
            onClick={() => pickDay(today)}
          >
            Today
          </button>
        )}
        {birthday && (
          <button type="button" className={s.soft} onClick={() => close()}>
            Done
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`${s.wrap} ${className}`}>
      <button
        ref={setButtonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close(false) : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className={s.field}
        data-open={open || undefined}
        data-empty={!selected || undefined}
      >
        <span className={s.icon} aria-hidden="true">
          <CalendarDaysIcon />
        </span>
        <span className={s.value}>
          <span className={s.date}>{label}</span>
          {age !== null && <span className={s.age}>{age} years old</span>}
        </span>
        {selected && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date"
            className={s.clear}
            onClick={(e) => {
              e.stopPropagation();
              emit("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                emit("");
              }
            }}
          >
            <XMarkIcon aria-hidden="true" />
          </span>
        )}
        <ChevronDownIcon className={s.chev} aria-hidden="true" />
      </button>

      {mounted && open && coords
        ? createPortal(
            <>
              {coords.sheet && (
                <div
                  className={s.scrim}
                  aria-hidden="true"
                  onMouseDown={() => close(false)}
                />
              )}
              {panel}
            </>,
            document.body,
          )
        : null}
    </div>
  );
});

export default AquaDatePicker;
