import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import AquaSeo from "@/components/Layout/seo/seo";
import AquaImage from "@/components/images/AquaImage";
import logo from "../assests/logo.png";
import TicTacToe from "@/components/games/TicTacToe";

const AquaError = ({ statusCode }) => {
  const seo = {
    title: `Aquakart | ${statusCode ? `Error ${statusCode}` : "Error"}`,
    description: "Something went wrong.",
    noindex: true,
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 500:
        return "Internal Server Error";
      case 503:
        return "Service Unavailable";
      case 404:
        return "Page Not Found";
      default:
        return "An Unexpected Error Occurred";
    }
  };

  return (
    <>
      <AquaSeo seo={seo} />
      <main className="relative min-h-screen w-full overflow-hidden bg-slate-50 selection:bg-emerald-200 selection:text-emerald-900 flex items-center justify-center p-4">
        {/* Dynamic Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-rose-200/20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-orange-200/20 blur-[120px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-white/40 blur-[100px]" />
        </div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-[3rem] border border-white/60 bg-white/40 p-8 text-center shadow-2xl backdrop-blur-2xl ring-1 ring-black/5"
        >
          {/* Logo */}
          <div className="mx-auto mb-8 w-24 rounded-2xl bg-white/50 p-4 shadow-lg ring-1 ring-white/60 backdrop-blur-sm">
            <AquaImage
              src={logo}
              alt="Aquakart"
              height={100}
              width={100}
              customClass="h-full w-full object-contain drop-shadow-sm"
            />
          </div>

          <h1 className="text-7xl font-black tracking-tighter text-slate-900/10 select-none">
            {statusCode || "Oops"}
          </h1>
          <div className="-mt-12 mb-8 relative z-20">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              {getErrorMessage(statusCode)}
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
              Our servers encountered a hiccup. While we fix this, why not
              challenge our AI to a game?
            </p>
          </div>

          {/* Game Section */}
          <div className="mb-10">
            <TicTacToe />
          </div>

          {/* Action */}
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95"
          >
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </motion.div>
      </main>
    </>
  );
};

AquaError.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default AquaError;
