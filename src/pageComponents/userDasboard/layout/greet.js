import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AquaLogo from "@/assests/logo-white.png";

const MOTIVATION_SNIPPETS = [
  "Monitor your water softener stats to keep scale off every fixture.",
  "RO filters thrive on timely swaps—check when your membrane is due.",
  "Sand filters that run clear mean sparkling tanks and happier showers.",
  "Top up softener salt before hardness creeps back into the lines.",
  "Log today's TDS readings to keep your RO system dialed in.",
  "Cartridge life matters—track replacements so every glass tastes better.",
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

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % MOTIVATION_SNIPPETS.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % MOTIVATION_SNIPPETS.length);
  };

  return (
    <>
      <div className="relative mt-4 w-full overflow-hidden rounded-3xl glass-tint-emerald p-6 text-left">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-200/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-indigo-200/50 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 z-0 opacity-85">
          <Image
            src={AquaLogo}
            alt="Aquakart logo"
            fill
            className="object-contain object-right opacity-95"
            style={{ filter: "brightness(0.7) contrast(1.05)" }}
            sizes="(max-width: 768px) 100vw, 400px"
            priority
          />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-semibold text-gray-900">
            <span className="text-gray-500">{greeting}, </span>
            <span className="text-gray-900">{userName}</span>
            <span className="wave-hand ml-2 inline-block">👋</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-gray-600 transition-opacity duration-500 ease-in-out">
            {MOTIVATION_SNIPPETS[tipIndex]}
          </p>
          <button
            type="button"
            onClick={handleNextTip}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-medium text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition hover:translate-y-0.5 hover:bg-indigo-50"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow" />
            Show me something else
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes wave {
          0% {
            transform: rotate(0deg);
          }
          15% {
            transform: rotate(14deg);
          }
          30% {
            transform: rotate(-8deg);
          }
          45% {
            transform: rotate(14deg);
          }
          60% {
            transform: rotate(-4deg);
          }
          75% {
            transform: rotate(10deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        .wave-hand {
          animation: wave 1.8s ease-in-out infinite;
          transform-origin: 70% 70%;
        }
      `}</style>
    </>
  );
};

export default AquaUserGreet;
