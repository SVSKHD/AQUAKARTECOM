import { useMemo, useState } from "react";
import { ArrowRight, Droplets, Sparkles } from "lucide-react";

const TIPS = [
  "Track cartridge replacements so every glass tastes better.",
  "Check your active orders and delivery updates in one place.",
  "Save products now and return when you are ready to compare.",
];

const AquaUserGreet = ({ userName = "there" }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good morning";
    if (currentHour < 17) return "Good afternoon";
    if (currentHour < 21) return "Good evening";
    return "Good night";
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-5xl items-center justify-between gap-5 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 sm:p-6">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          <Sparkles className="h-4 w-4" /> Your Aquakart
        </div>
        <h2 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {greeting}, {userName}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {TIPS[tipIndex]}
        </p>
        <button
          type="button"
          onClick={() => setTipIndex((current) => (current + 1) % TIPS.length)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 transition hover:text-emerald-600"
        >
          Another tip <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="hidden h-20 w-20 shrink-0 place-items-center rounded-[26px] bg-slate-950 text-emerald-400 shadow-lg shadow-emerald-900/10 sm:grid">
        <Droplets className="h-9 w-9" />
      </div>
    </section>
  );
};

export default AquaUserGreet;
