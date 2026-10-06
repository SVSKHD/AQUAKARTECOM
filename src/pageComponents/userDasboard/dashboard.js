import { useMemo } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Heart,
  Package,
  ShoppingCart,
  SlidersHorizontal,
  User,
  Wallet,
} from "lucide-react";
import AquaUserDashbordLayout from "./layout/layout";
import AquaUserGreet from "./layout/greet";
import { getDisplayName } from "./layout/header";
import {
  formatINR,
  getUnitPrice,
  getUnitSaving,
  MiniProductRow,
} from "./layout/cards/cartCard";

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const QUICK_LINKS = [
  {
    href: "/dashboard/orders",
    label: "Orders & tracking",
    hint: "Delivery status and invoices",
    icon: Package,
  },
  {
    href: "/dashboard/profile",
    label: "Profile & addresses",
    hint: "Contact and delivery details",
    icon: User,
  },
  {
    href: "/find-invoice",
    label: "Find an invoice",
    hint: "Download a GST invoice",
    icon: FileText,
  },
  {
    href: "/softener-planner",
    label: "Softener planner",
    hint: "Size a system for your home",
    icon: SlidersHorizontal,
  },
];

const StatTile = ({ href, label, value, hint, icon: Icon, tone }) => (
  <Link
    href={href}
    className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-300 sm:p-5"
  >
    <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <p className="mt-4 text-2xl font-black tracking-tight text-slate-950">
      {value}
    </p>
    <p className="text-sm font-semibold text-slate-600">{label}</p>
    {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
  </Link>
);

const Panel = ({ title, href, linkLabel, children }) => (
  <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-600"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
    {children}
  </section>
);

const EmptyNote = ({ children, href, cta }) => (
  <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-slate-50 px-4 py-8 text-center">
    <p className="text-sm text-slate-500">{children}</p>
    <Link
      href={href}
      className="mt-3 text-sm font-bold text-emerald-700 hover:text-emerald-600"
    >
      {cta}
    </Link>
  </div>
);

const AquaUserDashbordPageComponent = () => {
  const userData = useSelector((state) => state.userData);
  const cartData = useSelector((state) => state.cartData);
  const favData = useSelector((state) => state.favData);

  const cart = useMemo(() => ensureArray(cartData), [cartData]);
  const fav = useMemo(() => ensureArray(favData), [favData]);

  const cartSummary = useMemo(
    () =>
      cart.reduce(
        (acc, item) => {
          const qty = item?.quantity || 1;
          acc.units += qty;
          acc.total += getUnitPrice(item) * qty;
          acc.saving += getUnitSaving(item) * qty;
          return acc;
        },
        { units: 0, total: 0, saving: 0 },
      ),
    [cart],
  );

  return (
    <AquaUserDashbordLayout>
      <div className="space-y-5">
        <AquaUserGreet userName={getDisplayName(userData?.user)} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            href="/dashboard/cart"
            label="In your cart"
            value={cartSummary.units}
            hint={cart.length ? formatINR(cartSummary.total) : "Nothing yet"}
            icon={ShoppingCart}
            tone="bg-emerald-50 text-emerald-700"
          />
          <StatTile
            href="/dashboard/fav"
            label="Saved items"
            value={fav.length}
            hint="Ready when you are"
            icon={Heart}
            tone="bg-rose-50 text-rose-600"
          />
          <StatTile
            href="/dashboard/cart"
            label="You're saving"
            value={formatINR(cartSummary.saving)}
            hint="On items in your cart"
            icon={Wallet}
            tone="bg-amber-50 text-amber-600"
          />
          <StatTile
            href="/dashboard/orders"
            label="Orders"
            value={<ArrowRight className="h-6 w-6" />}
            hint="Track and download invoices"
            icon={Package}
            tone="bg-sky-50 text-sky-700"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3">
            <Panel
              title="Your cart"
              href="/dashboard/cart"
              linkLabel="View cart"
            >
              {cart.length > 0 ? (
                <>
                  <div className="-mx-2 divide-y divide-slate-100">
                    {cart.slice(0, 3).map((item) => (
                      <MiniProductRow key={item?._id} product={item} />
                    ))}
                  </div>
                  {cart.length > 3 && (
                    <p className="mt-2 text-xs text-slate-500">
                      +{cart.length - 3} more in your cart
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                    <div>
                      <p className="text-xs text-slate-500">Subtotal</p>
                      <p className="text-lg font-black text-slate-950">
                        {formatINR(cartSummary.total)}
                      </p>
                    </div>
                    <Link
                      href="/checkout"
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      Checkout
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </>
              ) : (
                <EmptyNote href="/shop" cta="Browse products">
                  Your cart is empty.
                </EmptyNote>
              )}
            </Panel>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <Panel
              title="Saved for later"
              href="/dashboard/fav"
              linkLabel="View all"
            >
              {fav.length > 0 ? (
                <div className="-mx-2 divide-y divide-slate-100">
                  {fav.slice(0, 4).map((item) => (
                    <MiniProductRow key={item?._id} product={item} />
                  ))}
                </div>
              ) : (
                <EmptyNote href="/shop" cta="Find something you like">
                  Tap the heart on any product to save it here.
                </EmptyNote>
              )}
            </Panel>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-base font-black text-slate-950">
            Quick links
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map(({ href, label, hint, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-300"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">
                    {label}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {hint}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AquaUserDashbordLayout>
  );
};

export default AquaUserDashbordPageComponent;
