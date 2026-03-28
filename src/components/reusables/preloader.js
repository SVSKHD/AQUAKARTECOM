import Image from "next/image";
import logo from "@/assests/logo.png";

const AquaPreloader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Glass container */}
      <div className="relative flex flex-col items-center gap-6 rounded-3xl border border-white/60 bg-white/50 px-12 py-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        {/* Logo with water-fill animation */}
        <div className="relative h-20 w-20">
          {/* Background logo (faded) */}
          <div className="absolute inset-0 opacity-15">
            <Image
              src={logo}
              alt="Aquakart"
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {/* Foreground logo with CSS clip fill */}
          <div className="absolute inset-0 animate-[waterFill_2s_ease-in-out_infinite_alternate]">
            <Image
              src={logo}
              alt="Aquakart"
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </div>

        {/* Pulse bar */}
        <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-200/60">
          <div className="h-full w-1/2 animate-[slideBar_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Aquakart
        </p>
      </div>

      <style jsx>{`
        @keyframes waterFill {
          0% {
            clip-path: inset(100% 0 0 0);
          }
          100% {
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes slideBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
};

export default AquaPreloader;
