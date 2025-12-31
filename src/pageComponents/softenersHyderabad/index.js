import { useEffect, useState } from "react";
import Link from "next/link";
import AquaLayout from "@/components/Layout/Layout";
import ArtGallery from "@/components/reusables/artGalery";
import AquaSoftnerOperations from "@/services/softenersHyderabad";
import ProductGrid from "../shop/productGrid";
import { PhoneIcon } from "@heroicons/react/24/solid";
import { FaWhatsapp } from "react-icons/fa";

const LoadingState = () => (
  <div className="animate-pulse space-y-12">
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-[2rem] bg-white p-10 shadow-xl border border-white/60">
        <div className="h-10 w-48 rounded-full bg-slate-200" />
        <div className="mt-6 space-y-3">
          <div className="h-6 w-3/4 rounded-full bg-slate-200" />
          <div className="h-4 w-full rounded-full bg-slate-200" />
          <div className="h-4 w-4/5 rounded-full bg-slate-200" />
        </div>
        <div className="mt-10 h-48 rounded-3xl bg-slate-200" />
      </div>
      <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-white/60">
        <div className="h-6 w-24 rounded-full bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-40 rounded-3xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const highlightCards = [
  {
    title: "Verified Installations",
    description:
      "Every image and testimonial comes from real Hyderabad customers satisfied with their setup.",
  },
  {
    title: "Tailored For Hard Water",
    description:
      "Engineered with premium MPV heads and resin to handle the city’s toughest water profiles.",
  },
  {
    title: "End-to-End Service",
    description:
      "From assessment to installation and follow-up care, our experts support you at every step.",
  },
];

const GlassCard = ({ children, className = "", hoverEffect = true }) => (
  <div
    className={`
      relative overflow-hidden rounded-[2.5rem] 
      border border-white/60
      bg-white/60
      backdrop-blur-2xl shadow-xl hover:shadow-2xl
      ${hoverEffect ? "transition-all duration-500 hover:scale-[1.02] hover:bg-white/80" : ""}
      ${className}
    `}
  >
    {/* Specular highlight */}
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

const AquaSoftenerHyderabadComponent = ({
  initialSections = [],
  initialError = "",
  initialProducts = [],
}) => {
  const [imageData, setImageData] = useState(initialSections);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError ?? "");

  useEffect(() => {
    setImageData(initialSections);
  }, [initialSections]);

  useEffect(() => {
    setErrorMessage(initialError ?? "");
  }, [initialError]);

  const handleRetry = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await AquaSoftnerOperations.getSofteners();
      const sections = Array.isArray(res?.data) ? res.data : [];
      setImageData(sections);
    } catch (error) {
      console.error("Retry softeners gallery fetch failed", error);
      setErrorMessage(
        "Still having trouble loading the gallery. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const galleryCountLabel = isLoading
    ? "Loading…"
    : `${imageData.length} galleries`;

  return (
    <AquaLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white py-12 sm:py-24 text-slate-900 overflow-hidden relative selection:bg-indigo-100 selection:text-indigo-900">
        {/* iOS 26 Aurora Background - Light Version */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse" />
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse delay-1000" />
          <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-emerald-100/40 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse delay-2000" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          {/* Header */}
          <header className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between mb-20 animate-fade-in-up">
            <div className="space-y-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/50 backdrop-blur-md shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  Hyderabad Edition
                </span>
              </div>

              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
                Pure Water. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Perfectly Soft.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 font-light leading-relaxed max-w-2xl">
                Experience the next generation of water treatment. Curated
                installations showcasing Aquakart's premium engineering across
                Hyderabad.
              </p>
            </div>

            <div className="flex flex-col items-start gap-6 lg:items-end">
              <div className="flex -space-x-4">
                {/* Pseudo-avatars for social proof look */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm`}
                  >
                    {i === 3 ? "+" : ""}
                  </div>
                ))}
                <div className="pl-6 flex items-center text-sm font-medium text-slate-600">
                  {galleryCountLabel}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://wa.me/919014774667"
                  target="_blank"
                  rel="noreferrer"
                  className="group relative inline-flex items-center gap-3 rounded-full bg-[#25D366] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:bg-[#20bd5a] hover:scale-105 active:scale-95"
                >
                  <FaWhatsapp className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">WhatsApp</span>
                </a>

                <a
                  href="tel:+919014774667"
                  className="group relative inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-800 shadow-lg border border-slate-100 transition-all duration-300 hover:bg-slate-50 hover:scale-105 active:scale-95"
                >
                  <PhoneIcon className="h-5 w-5 relative z-10 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  <span className="relative z-10">Call Expert</span>
                </a>
              </div>
            </div>
          </header>

          <div className="space-y-20">
            {isLoading && <LoadingState />}

            {!isLoading && errorMessage && (
              <GlassCard className="!border-red-200 !bg-red-50 text-center py-12">
                <p className="text-xl text-red-600 font-medium mb-6">
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    setErrorMessage("");
                    handleRetry();
                  }}
                  className="px-8 py-3 rounded-full bg-red-600 font-bold text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-200"
                >
                  Try Again
                </button>
              </GlassCard>
            )}

            {!isLoading && !errorMessage && (
              <>
                {/* Highlights Grid */}
                <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {highlightCards.map((card) => (
                    <GlassCard key={card.title} className="p-8">
                      <div className="mb-4 inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600/80">
                        <div className="h-6 w-6 rounded-full border-2 border-current opacity-60" />{" "}
                        {/* Abstract Icon */}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-3">
                        {card.title}
                      </h2>
                      <p className="text-base text-slate-500 leading-relaxed font-normal">
                        {card.description}
                      </p>
                    </GlassCard>
                  ))}

                  {/* CTA Card */}
                  <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-2xl shadow-indigo-200 border border-indigo-400/20 group">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-700" />

                    <h2 className="text-2xl font-bold relative z-10">
                      Request Site Visit
                    </h2>
                    <p className="mt-3 text-white/90 leading-relaxed relative z-10">
                      Our elite technicians provide comprehensive water hardness
                      assessment.
                    </p>
                    <Link
                      href="/contact"
                      className="mt-8 inline-flex items-center justify-center w-full rounded-2xl bg-white text-indigo-900 px-6 py-4 text-sm font-bold transition-transform active:scale-95 hover:bg-indigo-50 relative z-10 shadow-lg"
                    >
                      Book Consultation
                    </Link>
                  </div>
                </section>

                {/* Products Section */}
                <section className="space-y-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                        Premium Collection
                      </h2>
                      <p className="text-slate-500 text-lg mt-2 font-normal">
                        Engineered for performance. Designed for life.
                      </p>
                    </div>
                    <Link
                      href="/shop"
                      className="px-6 py-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm"
                    >
                      Browse Full Catalog &rarr;
                    </Link>
                  </div>

                  {/* Glass container for products */}
                  <div className="rounded-[3rem] border border-white/60 bg-white/40 p-8 backdrop-blur-xl shadow-sm">
                    <ProductGrid products={initialProducts} viewMode="grid" />
                  </div>
                </section>

                {/* Gallery Section */}
                <GlassCard className="p-8 sm:p-12" hoverEffect={false}>
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12 gap-6">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                        Installation Gallery
                      </h2>
                      <p className="text-lg text-slate-500 max-w-xl font-normal">
                        Real homes. Real solutions. Witness the Aquakart
                        difference across Hyderabad.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Live Updates
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    {imageData.length ? (
                      <ArtGallery sections={imageData} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[2rem]">
                        <p className="text-slate-400 text-lg">
                          Submitting showcase images...
                        </p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </>
            )}
          </div>

          {/* Bottom CTA */}
          <section className="mt-20 relative overflow-hidden rounded-[3rem]">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-teal-900" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
            <div className="relative p-10 sm:p-16 border border-white/20 rounded-[3rem]">
              <div className="flex flex-col items-center text-center gap-8">
                <h3 className="text-3xl sm:text-5xl font-bold text-white">
                  Unsure About Your Water?
                </h3>
                <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl font-light">
                  Our water quality experts are available 24/7. Send us your
                  report or get on a quick call.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <a
                    href="https://wa.me/919014774667"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-emerald-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
                  >
                    <FaWhatsapp className="h-6 w-6" />
                    Chat on WhatsApp
                  </a>
                  <a
                    href="tel:9014774667"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800/50 border border-white/20 px-8 py-4 text-lg font-bold text-white backdrop-blur-md shadow-xl transition-transform hover:bg-emerald-800/70 hover:scale-105 active:scale-95"
                  >
                    <PhoneIcon className="h-6 w-6" />
                    Call 9014774667
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaSoftenerHyderabadComponent;
