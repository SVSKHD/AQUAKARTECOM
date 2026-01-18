import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getFestivalWish } from "@/utils/festival";

const FestivalCornerWidget = () => {
  const [festival, setFestival] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setFestival(getFestivalWish());
  }, []);

  if (!festival || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-bounce-slow">
      {/* Glow Effect */}
      <div
        className={`absolute -inset-4 rounded-full bg-gradient-to-r ${festival.gradient} opacity-40 blur-xl animate-pulse`}
      ></div>

      <div className="relative group">
        {/* Dismiss Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 bg-white text-slate-900 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:scale-110"
          aria-label="dismiss festival widget"
        >
          <X size={12} />
        </button>

        {/* Main Card */}
        <div className="flex items-center gap-3 rounded-full border border-white/40 bg-white/70 backdrop-blur-2xl p-2 pr-5 shadow-2xl ring-1 ring-white/50 transition-transform hover:scale-105">
          {/* Icon Circle */}
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${festival.gradient} text-xl shadow-inner text-white`}
          >
            {festival.icon}
          </div>

          {/* Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {festival.subText}
            </p>
            <p
              className={`text-sm font-black bg-gradient-to-r ${festival.gradient} bg-clip-text text-transparent`}
            >
              {festival.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestivalCornerWidget;
