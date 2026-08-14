import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaGoogle,
  FaHome,
  FaLock,
  FaMapMarkerAlt,
  FaTint,
  FaUsers,
  FaWater,
} from "react-icons/fa";
import AquaLayout from "@/components/Layout/Layout";
import AquaAppLoader from "@/components/common/AquaAppLoader";
import ReusableProductCard from "@/components/cards/ProductCardTwo";
import { useAuth } from "@/context/AuthContext";
import ProductServiceOperations from "@/services/products";
import AquaSoftnerOperations from "@/services/softenersHyderabad";
import { getUserDisplayName } from "@/utils/user";

const DRAFT_KEY = "aquakart_softener_planner_draft";

const questions = [
  {
    key: "residents",
    title: "How many people use water at home?",
    helper: "This sets the daily soft-water capacity.",
    icon: FaUsers,
    options: [
      { value: "1-2", label: "1–2 people", note: "Compact home" },
      { value: "3-4", label: "3–4 people", note: "Typical family" },
      { value: "5-7", label: "5–7 people", note: "Large family" },
      { value: "8+", label: "8+ people", note: "Villa or shared home" },
    ],
  },
  {
    key: "coverage",
    title: "Where do you need soft water?",
    helper: "Choose the area that will actually use the system.",
    icon: FaHome,
    options: [
      { value: "bathroom", label: "One bathroom", note: "Shower and fittings" },
      { value: "multiple", label: "2–3 bathrooms", note: "Multiple daily users" },
      { value: "whole-home", label: "Whole home", note: "All major outlets" },
    ],
  },
  {
    key: "hardness",
    title: "How hard is your water?",
    helper: "No test report? Choose “Not sure”—we can confirm it later.",
    icon: FaTint,
    options: [
      { value: "mild", label: "Mild", note: "Light white marks" },
      { value: "hard", label: "Hard", note: "Frequent scale on taps" },
      { value: "very-hard", label: "Very hard", note: "Heavy scale or borewell" },
      { value: "unknown", label: "Not sure", note: "Recommend with safe margin" },
    ],
  },
];

const extractCapacity = (product) => {
  const text = [
    product?.title,
    product?.capacity,
    product?.description,
  ]
    .filter(Boolean)
    .join(" ");
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:l|litre|liter)/i);
  return match ? Number(match[1]) : 0;
};

const requiredCapacity = ({ residents, coverage, hardness }) => {
  if (coverage === "bathroom") return hardness === "very-hard" ? 12 : 8;

  const peopleBase = {
    "1-2": 20,
    "3-4": 25,
    "5-7": 40,
    "8+": 100,
  }[residents] || 25;

  const coverageBoost = coverage === "whole-home" ? 1.25 : 1;
  const hardnessBoost =
    hardness === "very-hard" ? 1.25 : hardness === "unknown" ? 1.1 : 1;

  return Math.ceil(peopleBase * coverageBoost * hardnessBoost);
};

const selectRecommendations = (products, answers) => {
  const target = requiredCapacity(answers);
  const softeners = products
    .filter((product) =>
      /softener|autosoft|softner/i.test(
        `${product?.title || ""} ${product?.category?.title || ""}`,
      ),
    )
    .map((product) => ({ product, capacity: extractCapacity(product) }))
    .sort((left, right) => {
      const leftDistance =
        left.capacity >= target
          ? left.capacity - target
          : target - left.capacity + 1000;
      const rightDistance =
        right.capacity >= target
          ? right.capacity - target
          : target - right.capacity + 1000;
      return leftDistance - rightDistance;
    });

  return softeners.slice(0, 2).map(({ product }) => product);
};

const Choice = ({ option, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={[
      "group flex min-h-[92px] items-center justify-between rounded-2xl border p-4 text-left transition duration-200",
      "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.99]",
      selected
        ? "border-emerald-400 bg-emerald-50 shadow-[0_12px_28px_rgba(16,185,129,0.12)]"
        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40",
    ].join(" ")}
    aria-pressed={selected}
  >
    <span>
      <strong className="block text-sm text-slate-950 sm:text-base">
        {option.label}
      </strong>
      <small className="mt-1 block text-xs leading-5 text-slate-500">
        {option.note}
      </small>
    </span>
    <span
      className={[
        "grid h-7 w-7 shrink-0 place-items-center rounded-full border transition",
        selected
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-slate-200 bg-slate-50 text-transparent group-hover:border-emerald-300",
      ].join(" ")}
    >
      <FaCheck size={11} />
    </span>
  </button>
);

const LoginGate = ({ loading, onLogin }) => (
  <section className="mx-auto grid min-h-[calc(100vh-92px)] max-w-6xl place-items-center px-4 py-10">
    <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/88 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative overflow-hidden bg-slate-950 p-8 text-white sm:p-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]">
            <FaWater /> Softener Planner
          </span>
          <h1 className="mt-6 max-w-xl text-4xl font-black tracking-[-0.06em] sm:text-6xl">
            The right softener in three answers.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
            Tell us about your home and water. We’ll shortlist live Aquakart
            products that match your expected capacity.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold text-slate-200">
            {["3 quick choices", "Live products", "No technical form"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center p-8 sm:p-12">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <FaLock />
        </span>
        <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-slate-950">
          Sign in before planning
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Google sign-in protects your recommendations and lets you return
          without starting again.
        </p>
        <button
          type="button"
          onClick={onLogin}
          disabled={loading}
          className="mt-7 inline-flex min-h-[52px] items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-[0_14px_35px_rgba(15,23,42,0.22)] transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
        >
          <FaGoogle />
          {loading ? "Connecting…" : "Continue with Google"}
        </button>
        <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
          You’ll return to this planner automatically after sign-in.
        </p>
      </div>
    </div>
  </section>
);

const InstallationGallery = ({ sections = [], loading = false }) => {
  const images = useMemo(
    () =>
      sections
        .flatMap((section) =>
          (Array.isArray(section?.photos) ? section.photos : []).map((photo) => ({
            id: photo?.id || photo?._id || photo?.secure_url,
            url: photo?.secure_url || photo?.delivery_url || photo?.url || "",
            area: section?.title || section?.area || "Aquakart installation",
          })),
        )
        .filter((image) => image.url)
        .slice(0, 10),
    [sections],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= images.length) setActiveIndex(0);
  }, [activeIndex, images.length]);

  if (loading) {
    return (
      <section className="mt-8 animate-pulse rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-sm sm:p-7">
        <div className="h-5 w-44 rounded-full bg-slate-200" />
        <div className="mt-5 aspect-[16/8] rounded-2xl bg-slate-200" />
      </section>
    );
  }

  if (!images.length) return null;
  const active = images[activeIndex] || images[0];

  return (
    <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-white bg-white/92 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Live from Aquakart
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
            See real installations
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Tap a thumbnail to inspect the plumbing fit and finished setup.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {images.length} recent photos
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_116px]">
        <motion.figure
          key={active.id || active.url}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100"
        >
          <img
            src={active.url}
            alt={`Aquakart water softener installation in ${active.area}`}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <figcaption className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-slate-950/75 px-3 py-2 text-[10px] font-bold text-white backdrop-blur">
            <FaMapMarkerAlt /> {active.area}
          </figcaption>
        </motion.figure>

        <div className="flex gap-2 overflow-x-auto pb-1 lg:max-h-[min(56vw,430px)] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
          {images.map((image, index) => (
            <button
              key={image.id || image.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={[
                "relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 transition lg:h-[74px] lg:w-full",
                index === activeIndex
                  ? "border-emerald-500 shadow-md"
                  : "border-transparent opacity-70 hover:opacity-100",
              ].join(" ")}
              aria-label={`Show installation ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <img
                src={image.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const AquaSoftenerPlannerComponent = () => {
  const { authenticated, authReady, loading: authLoading, signInWithGoogle, user } =
    useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    residents: "",
    coverage: "",
    hardness: "",
  });
  const [products, setProducts] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState("");
  const [installationSections, setInstallationSections] = useState([]);
  const [installationsLoading, setInstallationsLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || "null");
      if (saved?.answers) {
        setAnswers((current) => ({ ...current, ...saved.answers }));
        setStep(Math.min(Number(saved.step) || 0, questions.length - 1));
      }
    } catch {
      window.sessionStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ answers, step }),
    );
  }, [answers, step]);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    setCatalogueLoading(true);
    setInstallationsLoading(true);
    setCatalogueError("");

    Promise.allSettled([
      ProductServiceOperations.AllProducts(),
      AquaSoftnerOperations.getSofteners(),
    ]).then(([productsResult, installationsResult]) => {
      if (!active) return;

      if (productsResult.status === "fulfilled") {
        const data = productsResult.value?.data?.data;
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setCatalogueError("We could not load the live catalogue.");
      }

      if (installationsResult.status === "fulfilled") {
        const sections = installationsResult.value?.data;
        setInstallationSections(Array.isArray(sections) ? sections : []);
      }
    }).finally(() => {
      if (!active) return;
      setCatalogueLoading(false);
      setInstallationsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [authenticated]);

  const question = questions[step];
  const QuestionIcon = question.icon;
  const selectedValue = answers[question?.key];
  const recommendations = useMemo(
    () => selectRecommendations(products, answers),
    [answers, products],
  );
  const progress = complete ? 100 : ((step + 1) / questions.length) * 100;
  const displayName = getUserDisplayName(user, "there");

  const choose = (value) => {
    setAnswers((current) => ({ ...current, [question.key]: value }));
  };

  const next = () => {
    if (!selectedValue) return;
    if (step < questions.length - 1) {
      setStep((current) => current + 1);
    } else {
      setComplete(true);
    }
  };

  const back = () => {
    if (complete) {
      setComplete(false);
      return;
    }
    setStep((current) => Math.max(current - 1, 0));
  };

  const restart = () => {
    setAnswers({ residents: "", coverage: "", hardness: "" });
    setStep(0);
    setComplete(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(DRAFT_KEY);
    }
  };

  if (!authenticated) {
    return (
      <AquaLayout path="softenerPlanning">
        <LoginGate
          loading={authLoading || !authReady}
          onLogin={signInWithGoogle}
        />
      </AquaLayout>
    );
  }

  return (
    <AquaLayout path="softenerPlanning">
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.28),transparent_34%),#f7faf9] px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                Aquakart Softener Planner
              </span>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">
                {complete ? "Your best-fit softeners" : `Let’s size it, ${displayName}.`}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                {complete
                  ? "Matched from the current catalogue using your home, coverage and hardness."
                  : "Three simple choices. No litres-per-day calculation required."}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm">
              <span className="text-emerald-600">
                {complete ? "Complete" : `${step + 1} of ${questions.length}`}
              </span>
              <span className="mx-2 text-slate-300">•</span>
              Signed in
            </div>
          </header>

          <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-emerald-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          {complete ? (
            <section className="mt-8">
              {catalogueLoading ? (
                <AquaAppLoader
                  variant="inline"
                  message="Matching live products"
                  subtext="Checking available softener capacities."
                />
              ) : catalogueError ? (
                <div className="rounded-3xl border border-rose-100 bg-white p-8 text-center text-sm text-rose-600 shadow-sm">
                  {catalogueError} Please try again shortly.
                </div>
              ) : recommendations.length ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    {recommendations.map((product, index) => (
                      <div key={product._id || product.slug} className="relative">
                        <span className="absolute left-5 top-5 z-30 rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                          {index === 0 ? "Best match" : "Alternative"}
                        </span>
                        <ReusableProductCard product={product} padded />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
                    <strong className="text-slate-950">Final installation check:</strong>{" "}
                    Aquakart can confirm inlet hardness and plumbing before installation.
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm">
                  <FaWater className="mx-auto text-2xl text-amber-500" />
                  <h2 className="mt-4 text-xl font-black text-slate-950">
                    We need an expert match
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    No suitable live catalogue item matched this capacity yet.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={back}
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-700 transition hover:border-emerald-300"
              >
                <FaArrowLeft /> Adjust answers
              </button>
              <button
                type="button"
                onClick={restart}
                className="ml-3 mt-7 rounded-full px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-950"
              >
                Start over
              </button>
            </section>
          ) : (
            <section className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
              <aside className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-slate-950">
                  <QuestionIcon size={19} />
                </span>
                <h2 className="mt-6 text-2xl font-black tracking-[-0.04em]">
                  {question.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {question.helper}
                </p>
                <div className="mt-8 space-y-2 text-xs text-slate-400">
                  {questions.map((item, index) => (
                    <div
                      key={item.key}
                      className={[
                        "flex items-center gap-3 rounded-xl px-3 py-2",
                        index === step ? "bg-white/10 text-white" : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "grid h-6 w-6 place-items-center rounded-full text-[10px] font-black",
                          index < step
                            ? "bg-emerald-400 text-slate-950"
                            : index === step
                              ? "bg-white text-slate-950"
                              : "bg-white/10",
                        ].join(" ")}
                      >
                        {index < step ? <FaCheck size={9} /> : index + 1}
                      </span>
                      {item.key === "residents"
                        ? "Household"
                        : item.key === "coverage"
                          ? "Coverage"
                          : "Hardness"}
                    </div>
                  ))}
                </div>
              </aside>

              <div className="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={question.key}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <Choice
                          key={option.value}
                          option={option}
                          selected={selectedValue === option.value}
                          onSelect={() => choose(option.value)}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={back}
                    disabled={step === 0}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black text-slate-500 transition hover:text-slate-950 disabled:invisible"
                  >
                    <FaArrowLeft /> Back
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    disabled={!selectedValue}
                    className="inline-flex min-h-12 items-center gap-3 rounded-full bg-slate-950 px-6 text-xs font-black text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {step === questions.length - 1 ? "Show my matches" : "Continue"}
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            </section>
          )}

          <InstallationGallery
            sections={installationSections}
            loading={installationsLoading}
          />
        </div>
      </main>
    </AquaLayout>
  );
};

export default AquaSoftenerPlannerComponent;
