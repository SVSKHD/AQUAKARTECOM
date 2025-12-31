import { useEffect, useState } from "react";
import Link from "next/link";
import AquaLayout from "@/components/Layout/Layout";
import ArtGallery from "@/components/reusables/artGalery";
import AquaSoftnerOperations from "@/services/softenersHyderabad";
import ProductGrid from "../shop/productGrid";

const LoadingState = () => (
  <div className="animate-pulse space-y-12">
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-10 shadow-sm ring-1 ring-gray-100">
        <div className="h-10 w-48 rounded-full bg-slate-200" />
        <div className="mt-6 space-y-3">
          <div className="h-6 w-3/4 rounded-full bg-slate-200" />
          <div className="h-4 w-full rounded-full bg-slate-200" />
          <div className="h-4 w-4/5 rounded-full bg-slate-200" />
        </div>
        <div className="mt-10 h-48 rounded-2xl bg-slate-200" />
      </div>
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="h-6 w-24 rounded-full bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-40 rounded-2xl bg-slate-200"
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
      <div className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-6 border-b border-slate-200 pb-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Hyderabad install spotlight
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                Premium Water Softeners Installed Across Hyderabad
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Explore a curated gallery of real customer installations. Each
                project showcases Aquakart&apos;s commitment to reliable water
                treatment, professional workmanship, and a seamless experience
                for Hyderabad homes and businesses.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {galleryCountLabel}
              </span>
              <a
                href="tel:+919014774667"
                className="inline-flex items-center justify-center rounded-full border border-transparent bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Talk to a water expert
              </a>
            </div>
          </header>

          <div className="mt-12 space-y-12">
            {isLoading && <LoadingState />}

            {!isLoading && errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
                {errorMessage}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    setErrorMessage("");
                    handleRetry();
                  }}
                  className="ml-3 inline-flex items-center justify-center rounded-full border border-transparent bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && !errorMessage && (
              <>
                <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {highlightCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                    >
                      <h2 className="text-lg font-semibold text-slate-900">
                        {card.title}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {card.description}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm">
                    <h2 className="text-lg font-semibold">
                      Request a site visit
                    </h2>
                    <p className="mt-2 text-sm text-white/80">
                      Our technicians can assess water hardness, suggest the
                      ideal softener, and provide a custom quote.
                    </p>
                    <Link
                      href="/contact"
                      className="mt-6 inline-flex items-center justify-center rounded-full border border-transparent bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
                    >
                      Schedule consultation
                    </Link>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Our Premium Collection
                      </h2>
                      <p className="text-sm text-slate-600">
                        Explore our range of high-performance water softeners
                        and purifiers.
                      </p>
                    </div>
                    <Link
                      href="/shop"
                      className="group inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      View full catalogue
                      <span className="transition-transform group-hover:translate-x-1">
                        &rarr;
                      </span>
                    </Link>
                  </div>
                  <ProductGrid products={initialProducts} viewMode="grid" />
                </section>

                <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Installation gallery
                      </h2>
                      <p className="text-sm text-slate-600">
                        Swipe through recent Hyderabad projects and explore how
                        Aquakart softeners elevate every space.
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Updated every month
                    </span>
                  </div>

                  <div className="mt-8">
                    {imageData.length ? (
                      <ArtGallery sections={imageData} />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-600">
                        No gallery items to display yet. Check back soon for new
                        Hyderabad installation showcases.
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>

          <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-700 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Need assistance choosing the right softener?
                </h3>
                <p className="text-sm text-slate-600">
                  Share your water hardness report or schedule a quick call with
                  our specialists for a tailored recommendation.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://wa.me/919014774667"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-transparent bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                >
                  Chat on WhatsApp
                </a>
                <Link
                  href="/shop?category=Softeners"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-600"
                >
                  View softener catalogue
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaSoftenerHyderabadComponent;
