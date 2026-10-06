import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Package } from "lucide-react";

const greetingFor = (hour) => {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

/** Welcome banner for the dashboard overview. */
const AquaUserGreet = ({ userName = "there" }) => {
  // The hour depends on the visitor's clock, so pick it after mount to keep
  // the server and client HTML identical.
  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  return (
    <section
      data-dashboard-greeting
      className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-300">{greeting}</p>
          <h2 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">
            {userName}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
            Track deliveries, finish checkout, or pick up where you left off.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-50"
          >
            <Package className="h-4 w-4" />
            Track orders
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            Shop
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AquaUserGreet;
