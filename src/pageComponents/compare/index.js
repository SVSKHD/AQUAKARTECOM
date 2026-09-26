import AquaLayout from "@/components/Layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  CheckCircle2,
  GitCompare,
  Heart,
  LogIn,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import AquaFavoritesTabContent from "./favorites";
import AquaCartTabContent from "./cart";
import AquaCompareTabContent from "./Compare";

const AquaCompareComponent = () => {
  const router = useRouter();
  const { authenticated, loading: authLoading, signInWithGoogle } = useAuth();
  const { compare, cartData, favData } = useSelector((state) => ({
    compare: Array.isArray(state.compare) ? state.compare : [],
    cartData: Array.isArray(state.cartData) ? state.cartData : [],
    favData: Array.isArray(state.favData) ? state.favData : [],
  }));
  const [activeTab, setActiveTab] = useState("Compare");
  const [signingIn, setSigningIn] = useState(false);

  const tabs = useMemo(
    () => [
      {
        name: "Compare",
        count: compare.length,
        icon: GitCompare,
      },
      {
        name: "Wishlist",
        count: favData.length,
        icon: Heart,
      },
      {
        name: "Cart",
        count: cartData.length,
        icon: ShoppingCart,
      },
    ],
    [cartData.length, compare.length, favData.length],
  );

  const SeoData = {
    title: "Aquakart | Compare Water Softeners & Water Solutions",
    description:
      "Compare Aquakart water softeners and water treatment products side by side by price, capacity, coverage, warranty and technical specifications. No login required.",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Wishlist":
        return <AquaFavoritesTabContent />;
      case "Cart":
        return <AquaCartTabContent />;
      case "Compare":
      default:
        return <AquaCompareTabContent />;
    }
  };

  const handleOptionalLogin = async () => {
    if (authenticated || signingIn || authLoading) return;
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      // AuthContext already surfaces the actionable sign-in message.
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <AquaLayout seo={SeoData}>
      <main className="min-h-screen bg-[#f7f9f8] text-slate-950">
        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                    <GitCompare className="h-3.5 w-3.5" />
                    Comparison Studio
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    No login required
                  </span>
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                  Compare water solutions
                  <span className="block text-emerald-300">without the guesswork.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  See price, capacity, coverage, warranty and technical details
                  side by side. Build your shortlist first. Sign in only if you
                  decide you want to continue with your Aquakart account.
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-white/70">
                  {[
                    "Compare as a guest",
                    "Stored on this device",
                    "Remove or swap anytime",
                  ].map((item) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="min-w-[260px] rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                {authenticated ? (
                  <>
                    <div className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-black">You’re signed in</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Compare freely and continue to your account whenever you’re
                      ready.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-white">
                      <Sparkles className="h-5 w-5 text-amber-300" />
                      <span className="text-sm font-black">
                        Like your shortlist?
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Login is optional. Use it only when you want to continue
                      with account features.
                    </p>
                    <button
                      type="button"
                      onClick={handleOptionalLogin}
                      disabled={signingIn || authLoading}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
                    >
                      <LogIn className="h-4 w-4" />
                      {signingIn || authLoading
                        ? "Connecting…"
                        : "Sign in when ready"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f9f8]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  type="button"
                  onClick={() => setActiveTab(tab.name)}
                  className={[
                    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black transition",
                    active
                      ? "bg-slate-950 text-white shadow-lg"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                  <span
                    className={[
                      "grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-[10px]",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="ml-auto hidden min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 sm:inline-flex"
            >
              Add products
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <section className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8">
          {renderContent()}
        </section>
      </main>
    </AquaLayout>
  );
};

export default AquaCompareComponent;
