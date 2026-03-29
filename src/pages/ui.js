import Head from "next/head";
import { useState } from "react";
import { ShoppingCartIcon, HeartIcon } from "@heroicons/react/24/outline";

const Section = ({ title, children }) => (
  <section className="space-y-4">
    <h2 className="text-lg font-bold text-slate-900 border-b border-white/30 pb-2">
      {title}
    </h2>
    <div className="space-y-6">{children}</div>
  </section>
);

const PropTable = ({ rows }) => (
  <div className="overflow-x-auto rounded-xl border border-white/30 bg-white/20 backdrop-blur-sm">
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b border-white/20 text-slate-500">
          <th className="px-3 py-2 font-semibold">Prop</th>
          <th className="px-3 py-2 font-semibold">Type</th>
          <th className="px-3 py-2 font-semibold">Default</th>
          <th className="px-3 py-2 font-semibold">Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.prop} className="border-b border-white/10">
            <td className="px-3 py-2 font-mono text-emerald-700">{r.prop}</td>
            <td className="px-3 py-2 text-indigo-600">{r.type}</td>
            <td className="px-3 py-2 text-slate-400">{r.default || "-"}</td>
            <td className="px-3 py-2 text-slate-600">{r.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ACCESS_CODE = "2607";

const UIShowcasePage = () => {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      setUnlocked(true);
    } else {
      setCode("");
    }
  };

  if (!unlocked) {
    return (
      <>
        <Head>
          <title>Access Required | Aquakart</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="flex min-h-screen items-center justify-center px-4">
          <form
            onSubmit={handleSubmit}
            className="glass-card w-full max-w-sm rounded-3xl p-8 text-center space-y-6"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/80">
              <svg
                className="h-8 w-8 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Design System
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter the access code to continue
              </p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter code"
              className="w-full rounded-xl border border-white/50 bg-white/40 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-base backdrop-blur-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              autoFocus
            />
            <button
              type="submit"
              disabled={code.length < 4}
              className="btn-glass btn-glass-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Unlock
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>UI Components | Aquakart Design System</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-16">
          {/* Page Header */}
          <header className="text-center space-y-3">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
              Design System
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Aquakart UI Components
            </h1>
            <p className="text-slate-500 max-w-lg mx-auto">
              Every reusable component with its props, variants, and glass UI
              styling. Use this page for consistency across the app.
            </p>
          </header>

          {/* ── Glass Card Variants ─────────────────────── */}
          <Section title="Glass Cards">
            <p className="text-sm text-slate-500">
              Base card classes that provide depth and frosted glass effect.
              Apply these to any container element.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="glass-card rounded-2xl p-6 space-y-2">
                <code className="text-xs font-mono bg-white/30 px-2 py-0.5 rounded-full text-slate-700">
                  .glass-card
                </code>
                <p className="text-sm text-slate-600">
                  Standard frosted glass with white gradient, inner shadow, and
                  hover glow. Used for product cards, drawers, and content
                  panels.
                </p>
              </div>

              <div className="glass rounded-2xl p-6 space-y-2">
                <code className="text-xs font-mono bg-white/30 px-2 py-0.5 rounded-full text-slate-700">
                  .glass
                </code>
                <p className="text-sm text-slate-600">
                  Lighter glass with stronger blur. Used for overlays, loading
                  states, and navigation bars.
                </p>
              </div>

              <div className="glass-subtle rounded-2xl p-6 space-y-2">
                <code className="text-xs font-mono bg-white/30 px-2 py-0.5 rounded-full text-slate-700">
                  .glass-subtle
                </code>
                <p className="text-sm text-slate-600">
                  Minimal glass for filter pills, tags, and subtle background
                  containers.
                </p>
              </div>

              <div className="glass-dark rounded-2xl p-6 space-y-2 text-white">
                <code className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full text-slate-200">
                  .glass-dark
                </code>
                <p className="text-sm text-slate-300">
                  Dark frosted glass for footer sections and dark overlays.
                </p>
              </div>
            </div>

            <PropTable
              rows={[
                {
                  prop: "class",
                  type: "CSS class",
                  desc: "Apply to any div/section for glass morphism effect",
                },
              ]}
            />
          </Section>

          {/* ── Tinted Glass Cards ──────────────────────── */}
          <Section title="Tinted Glass Cards">
            <p className="text-sm text-slate-500">
              Color-coded glass cards for visual differentiation. Each has a
              unique gradient, border color, and shadow tint.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  cls: "glass-tint-emerald",
                  label: "Emerald",
                  use: "Success, delivered orders, complete profile fields",
                },
                {
                  cls: "glass-tint-indigo",
                  label: "Indigo",
                  use: "Cart items, navigation, primary info sections",
                },
                {
                  cls: "glass-tint-rose",
                  label: "Rose",
                  use: "Favourites, wishlist, love/heart features",
                },
                {
                  cls: "glass-tint-amber",
                  label: "Amber",
                  use: "Pending status, active orders, warnings",
                },
              ].map((item) => (
                <div
                  key={item.cls}
                  className={`${item.cls} rounded-2xl p-5 space-y-2`}
                >
                  <code className="text-xs font-mono bg-white/30 px-2 py-0.5 rounded-full text-slate-700">
                    .{item.cls}
                  </code>
                  <p className="font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-600">{item.use}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Buttons ─────────────────────────────────── */}
          <Section title="Buttons">
            <p className="text-sm text-slate-500">
              Glass-styled buttons with smooth hover lift and active press
              feedback.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button className="btn-glass btn-glass-primary">
                Primary Action
              </button>
              <button className="btn-glass btn-glass-secondary">
                Secondary Action
              </button>
              <button className="btn-glass btn-glass-primary" disabled>
                Disabled
              </button>
              <button className="btn-glass btn-glass-primary flex items-center gap-2">
                <ShoppingCartIcon className="h-4 w-4" />
                Add to Cart
              </button>
              <button className="btn-glass btn-glass-secondary flex items-center gap-2">
                <HeartIcon className="h-4 w-4" />
                Save
              </button>
            </div>

            <PropTable
              rows={[
                {
                  prop: "class",
                  type: "CSS class",
                  default: "btn-glass",
                  desc: "Base class — adds padding, border-radius, transitions, active:scale",
                },
                {
                  prop: "btn-glass-primary",
                  type: "modifier",
                  desc: "Emerald gradient background, white text, green shadow",
                },
                {
                  prop: "btn-glass-secondary",
                  type: "modifier",
                  desc: "Frosted white background, dark text, subtle shadow",
                },
              ]}
            />
          </Section>

          {/* ── Stat Cards ──────────────────────────────── */}
          <Section title="Dashboard Stat Cards">
            <p className="text-sm text-slate-500">
              Used on the dashboard to show key metrics. Each stat gets its own
              tinted glass.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Items in cart",
                  value: 3,
                  cls: "glass-tint-indigo",
                  iconCls: "bg-indigo-100 text-indigo-700",
                  icon: ShoppingCartIcon,
                },
                {
                  title: "Saved favourites",
                  value: 7,
                  cls: "glass-tint-rose",
                  iconCls: "bg-rose-100 text-rose-700",
                  icon: HeartIcon,
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`flex items-center gap-3 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${card.cls}`}
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconCls}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm text-slate-500">{card.title}</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {card.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <PropTable
              rows={[
                {
                  prop: "title",
                  type: "string",
                  desc: "Label text below the number",
                },
                {
                  prop: "value",
                  type: "number",
                  desc: "The stat count displayed prominently",
                },
                {
                  prop: "cardClass",
                  type: "string",
                  desc: "Tinted glass class (glass-tint-indigo, glass-tint-rose, etc.)",
                },
                {
                  prop: "iconTone",
                  type: "string",
                  desc: "Background + text color classes for the icon circle",
                },
                {
                  prop: "icon",
                  type: "LucideIcon",
                  desc: "Icon component from lucide-react or heroicons",
                },
              ]}
            />
          </Section>

          {/* ── Profile Cards ───────────────────────────── */}
          <Section title="Profile Highlight Cards">
            <p className="text-sm text-slate-500">
              Profile fields use tint-based status: emerald for complete, amber
              for pending.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass-tint-emerald rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700">
                    Updated
                  </span>
                </div>
                <p className="text-base font-medium text-slate-900">
                  user@example.com
                </p>
                <p className="text-sm text-slate-500">
                  We'll email you order updates and service reminders.
                </p>
              </div>

              <div className="glass-tint-amber rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Date of Birth
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/80 px-3 py-1 text-xs font-medium text-amber-700">
                    Pending
                  </span>
                </div>
                <p className="text-base font-medium text-slate-900">
                  Not provided yet
                </p>
                <p className="text-sm text-slate-500">
                  Helps us personalise offers and reminders.
                </p>
              </div>
            </div>
          </Section>

          {/* ── Empty States ────────────────────────────── */}
          <Section title="Empty States">
            <div className="glass-subtle rounded-2xl border border-dashed border-white/40 p-10 text-center text-sm text-slate-500">
              Your cart is currently empty. Browse products to add them here.
            </div>
          </Section>

          {/* ── Navigation Pill Bar ─────────────────────── */}
          <Section title="Navigation Pill Bar">
            <p className="text-sm text-slate-500">
              Used in dashboard header. Active state uses emerald gradient.
            </p>

            <div className="flex items-center gap-1.5 rounded-full border border-white/50 bg-white/50 backdrop-blur-2xl px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] w-fit">
              {["Dashboard", "Profile", "Orders", "Cart", "Favourites"].map(
                (label, i) => (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      i === 0
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                        : "text-slate-500 hover:bg-white/60"
                    }`}
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          </Section>

          {/* ── Drawer Preview ──────────────────────────── */}
          <Section title="Drawer / Sidebar Style">
            <p className="text-sm text-slate-500">
              Cart and Favourites drawers use frosted glass panel with backdrop
              blur.
            </p>

            <div className="relative h-64 rounded-2xl overflow-hidden border border-white/30">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-emerald-100/50" />
              <div className="absolute right-0 top-0 bottom-0 w-72 border-l border-white/30 bg-white/70 backdrop-blur-2xl shadow-[-20px_0_60px_rgba(0,0,0,0.08)] p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  Your cart
                </h3>
                <div className="glass-card rounded-xl p-3 space-y-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Water Softener XL
                  </p>
                  <p className="text-sm font-bold text-emerald-600">
                    ₹12,500.00
                  </p>
                </div>
                <button className="btn-glass btn-glass-primary w-full mt-4 py-2.5 text-sm">
                  Checkout
                </button>
              </div>
            </div>
          </Section>

          {/* ── Mobile Bottom Nav ───────────────────────── */}
          <Section title="Mobile Bottom Navigation">
            <p className="text-sm text-slate-500">
              Fixed bottom bar on mobile (sm:hidden). Glass morphism with badge
              counts.
            </p>

            <div className="mx-auto max-w-sm">
              <div className="flex items-center justify-around rounded-2xl border border-white/50 bg-white/60 backdrop-blur-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.06)] px-1 py-1">
                {[
                  { label: "Home", active: true },
                  { label: "Shop", active: false },
                  { label: "Cart", active: false, badge: 3 },
                  { label: "Saved", active: false, badge: 2 },
                  { label: "Account", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 ${
                      item.active
                        ? "bg-emerald-50/80 text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    <div className="relative h-5 w-5 bg-current rounded-sm opacity-30" />
                    {item.badge && (
                      <span className="absolute -top-1 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <PropTable
              rows={[
                {
                  prop: "label",
                  type: "string",
                  desc: "Tab label text",
                },
                {
                  prop: "icon / activeIcon",
                  type: "HeroIcon",
                  desc: "Outline icon for default, Solid icon for active",
                },
                {
                  prop: "badge",
                  type: "number",
                  desc: "Badge count (shows emerald pill when > 0)",
                },
                {
                  prop: "isLink",
                  type: "boolean",
                  default: "false",
                  desc: "If true, renders as Next.js Link; otherwise button with onClick",
                },
                {
                  prop: "onClick",
                  type: "function",
                  desc: "Handler for non-link tabs (opens drawer, dialog, etc.)",
                },
              ]}
            />
          </Section>

          {/* ── Colour Palette ──────────────────────────── */}
          <Section title="Colour Palette">
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
              {[
                { label: "Emerald 500", color: "bg-emerald-500" },
                { label: "Emerald 100", color: "bg-emerald-100" },
                { label: "Indigo 500", color: "bg-indigo-500" },
                { label: "Indigo 100", color: "bg-indigo-100" },
                { label: "Rose 500", color: "bg-rose-500" },
                { label: "Rose 100", color: "bg-rose-100" },
                { label: "Amber 500", color: "bg-amber-500" },
                { label: "Amber 100", color: "bg-amber-100" },
                { label: "Slate 900", color: "bg-slate-900" },
                { label: "Slate 50", color: "bg-slate-50" },
              ].map((c) => (
                <div key={c.label} className="text-center space-y-1">
                  <div
                    className={`h-10 w-full rounded-xl ${c.color} shadow-sm`}
                  />
                  <p className="text-[9px] text-slate-500 font-medium">
                    {c.label}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Typography ──────────────────────────────── */}
          <Section title="Typography">
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h1 className="text-4xl font-black text-slate-900">
                Heading 1 (4xl/black)
              </h1>
              <h2 className="text-2xl font-bold text-slate-900">
                Heading 2 (2xl/bold)
              </h2>
              <h3 className="text-lg font-semibold text-slate-900">
                Heading 3 (lg/semibold)
              </h3>
              <p className="text-base text-slate-600">
                Body text (base) — Used for descriptions and content blocks.
              </p>
              <p className="text-sm text-slate-500">
                Small text (sm) — Used for helper text and captions.
              </p>
              <p className="text-xs text-slate-400">
                Extra small (xs) — Used for badges, labels, and fine print.
              </p>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
                Overline (sm/bold/uppercase/tracking-widest)
              </p>
            </div>
          </Section>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-400 pb-8">
            Aquakart Design System &middot; For internal use only
          </footer>
        </div>
      </div>
    </>
  );
};

export default UIShowcasePage;
