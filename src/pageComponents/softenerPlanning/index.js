import { useMemo, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser,
  FaHome,
  FaWater,
  FaCalendarAlt,
  FaLightbulb,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
} from "react-icons/fa";
import ReusableProductCard from "@/components/cards/ProductCardTwo";

/**
 * Premium Glass Wrapper
 */
const GlassCard = ({ className = "", children }) => (
  <div
    className={[
      "relative overflow-hidden rounded-[2.8rem]",
      "bg-white/25 backdrop-blur-2xl",
      "border border-white/40",
      "shadow-[0_25px_60px_-20px_rgba(0,0,0,0.35)]",
      className,
    ].join(" ")}
  >
    {/* Light sweep */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-white/5 to-transparent opacity-80" />
    {/* Inner ring */}
    <div className="pointer-events-none absolute inset-0 rounded-[2.8rem] ring-1 ring-white/30" />
    {/* Subtle noise-ish overlay */}
    <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.5)_1px,transparent_0)] [background-size:18px_18px]" />
    <div className="relative z-10">{children}</div>
  </div>
);

const AquaSoftenerPlannerComponent = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [formData, setFormData] = useState({
    residents: "",
    averageUsage: "",
    usageFrequency: "",
  });

  const steps = useMemo(
    () => [
      {
        id: 0,
        title: "User Info",
        icon: <FaUser />,
        tip: "We’ll tailor the system based on your inputs — no spam, only the right match.",
      },
      {
        id: 1,
        title: "Residents",
        icon: <FaHome />,
        tip: "More people = more water demand = higher resin capacity needed.",
      },
      {
        id: 2,
        title: "Usage",
        icon: <FaWater />,
        tip: "High daily usage needs stronger capacity so water stays soft throughout the day.",
      },
      {
        id: 3,
        title: "Frequency",
        icon: <FaCalendarAlt />,
        tip: "Daily use benefits most from auto-regeneration softeners for consistent softness.",
      },
    ],
    [],
  );

  // Mock Product Data
  const products = useMemo(
    () => ({
      small: {
        _id: "kent-bathroom-water-softener",
        title: "AquaKart Compact Softener",
        price: 15000,
        photos: [
          {
            secure_url:
              "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
          },
        ],
        description: "Perfect for small families (1–4 people).",
        capacity: "1000L",
        warranty: "1 Year",
      },
      kent25: {
        _id: "kent-auto-25",
        title: "Kent Autosoft 25L",
        price: 25000,
        photos: [
          {
            secure_url:
              "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
          },
        ],
        description: "Ideal for medium to large homes.",
        capacity: "25L Resin",
        warranty: "1 Year",
      },
      kent40: {
        _id: "kent-auto-40",
        title: "Kent Autosoft 40L",
        price: 40000,
        photos: [
          {
            secure_url:
              "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
          },
        ],
        description: "High capacity for large families.",
        capacity: "40L Resin",
        warranty: "1 Year",
      },
      kent100: {
        _id: "kent-auto-100",
        title: "Kent Autosoft 100L",
        price: 90000,
        photos: [
          {
            secure_url:
              "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
          },
        ],
        description:
          "Very high capacity for villas / large families (10+ members).",
        capacity: "100L Resin",
        warranty: "1 Year",
      },
    }),
    [],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const progressPercentage = useMemo(() => {
    const denom = steps.length - 1;
    if (denom <= 0) return 0;
    return (currentStep / denom) * 100;
  }, [currentStep, steps.length]);

  const canProceed = useMemo(() => {
    if (showRecommendations) return true;
    if (currentStep === 0) return true;
    if (currentStep === 1) return !!formData.residents;
    if (currentStep === 2) return !!formData.averageUsage;
    if (currentStep === 3) return !!formData.usageFrequency;
    return false;
  }, [currentStep, formData, showRecommendations]);

  const getRecommendations = () => {
    const r = formData.residents;

    // 1–4 members -> small
    if (r === "1-2" || r === "3-4") return [products.small];

    // 5–9 members -> 25 + 40
    if (r === "5-6" || r === "7-9") return [products.kent25, products.kent40];

    // 10+ members -> 25 + 40 + 100
    if (r === "10+")
      return [products.kent25, products.kent40, products.kent100];

    return [];
  };

  const handleNext = () => {
    if (!canProceed) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      setShowRecommendations(true);
    }
  };

  const handleBack = () => {
    if (showRecommendations) {
      setShowRecommendations(false);
      return;
    }
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };

  const StepperTop = () => (
    <GlassCard className="mb-8">
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center border border-white/50">
              <FaWater className="text-xl" />
            </div>
            <div>
              <p className="text-sm opacity-70 font-medium">AquaKart Planner</p>
              <h3 className="text-lg md:text-xl font-bold">
                {showRecommendations
                  ? "Recommendations Ready"
                  : `Step ${currentStep + 1} of ${steps.length}`}
              </h3>
            </div>
          </div>

          {/* Desktop step pills */}
          <div className="hidden lg:flex items-center gap-2">
            {steps.map((s, i) => {
              const done = showRecommendations || i < currentStep;
              const active = i === currentStep && !showRecommendations;

              return (
                <div
                  key={s.id}
                  className={[
                    "px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 transition-all",
                    done
                      ? "bg-success/15 border-success/25 text-success"
                      : active
                        ? "bg-primary/15 border-primary/30 text-primary shadow-[0_0_20px_rgba(var(--p),0.25)]"
                        : "bg-white/10 border-white/25 text-base-content/50",
                  ].join(" ")}
                >
                  <span className="text-base">
                    {done ? <FaCheckCircle /> : s.icon}
                  </span>
                  {s.title}
                </div>
              );
            })}
          </div>
        </div>

        {!showRecommendations && (
          <div className="mt-4">
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 25 }}
              />
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );

  return (
    <AquaLayout path="softenerPlanning">
      <div className="min-h-screen bg-base-200 p-4 md:p-8 relative overflow-hidden">
        {/* Background Liquid Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[520px] h-[520px] bg-primary/20 rounded-full blur-[110px] opacity-60" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[650px] h-[650px] bg-secondary/20 rounded-full blur-[130px] opacity-60" />
          <div className="absolute top-[35%] left-[30%] w-[420px] h-[420px] bg-accent/15 rounded-full blur-[120px] opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Sticky Rich Stepper */}
          <div className="sticky top-3 z-20">
            <StepperTop />
          </div>

          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-sm whitespace-pre-line">
              {showRecommendations
                ? "Your Recommendations"
                : "Plan Your Perfect Water \nSoftener System"}
            </h1>
            <p className="mt-4 text-base-content/70 max-w-2xl text-lg font-medium">
              {showRecommendations
                ? "Based on your inputs, here are the best-fit options for your home."
                : "Answer a few quick questions and we’ll match the right softener capacity for your family."}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto md:h-[650px]">
            {/* Left: Vertical Stepper Card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-4 lg:col-span-3 h-fit"
            >
              <GlassCard>
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="avatar placeholder">
                      <div className="bg-primary/20 text-primary rounded-full w-14 h-14 shadow-lg flex items-center justify-center border-2 border-white/50">
                        <span className="text-xl">
                          <FaUser />
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-base-content/90">
                        Guest User
                      </h3>
                      <span className="badge badge-accent badge-outline font-semibold mt-1">
                        Planning
                      </span>
                    </div>
                  </div>

                  <div className="divider my-2 before:bg-base-content/10 after:bg-base-content/10" />

                  <div className="space-y-6 relative">
                    <div className="absolute left-4 top-2 bottom-4 w-0.5 bg-base-content/10 -z-10" />

                    {steps.map((step, idx) => {
                      const isActive =
                        idx === currentStep && !showRecommendations;
                      const isDone = idx < currentStep || showRecommendations;

                      return (
                        <div
                          key={idx}
                          className={[
                            "flex items-center gap-4 transition-all duration-300 relative",
                            isActive
                              ? "text-primary font-bold scale-[1.02]"
                              : isDone
                                ? "text-success font-medium"
                                : "text-base-content/30",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                              isActive
                                ? "border-primary bg-primary text-primary-content shadow-[0_0_15px_rgba(var(--p),0.55)] scale-110"
                                : isDone
                                  ? "border-success bg-success text-success-content"
                                  : "border-base-content/20 bg-base-100",
                            ].join(" ")}
                          >
                            {isDone ? <FaCheckCircle /> : step.icon}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm tracking-wide">
                              {step.title}
                            </span>
                            {isActive && (
                              <span className="text-xs opacity-70 mt-0.5">
                                You’re here
                              </span>
                            )}
                          </div>

                          {isActive && (
                            <motion.div
                              layoutId="active-step-glow"
                              className="absolute left-0 w-10 h-10 rounded-full bg-primary/30 blur-md -z-10"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Mini summary */}
                  <div className="mt-8 rounded-2xl border border-white/30 bg-white/10 p-4">
                    <p className="text-xs font-semibold opacity-70">
                      Current selections
                    </p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">Residents</span>
                        <span className="font-semibold">
                          {formData.residents || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">Usage</span>
                        <span className="font-semibold">
                          {formData.averageUsage || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">Frequency</span>
                        <span className="font-semibold capitalize">
                          {formData.usageFrequency || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Center: Main Interaction */}
            <motion.div
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="md:col-span-8 lg:col-span-6"
            >
              <GlassCard className="h-full">
                <div className="p-8 md:p-12 flex flex-col h-full justify-between">
                  {/* Mobile step bar */}
                  {!showRecommendations && (
                    <div className="lg:hidden w-full bg-white/10 rounded-full h-2 mb-8 overflow-hidden">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 140,
                          damping: 25,
                        }}
                      />
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {showRecommendations ? (
                      <motion.div
                        key="recommendations"
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 22,
                        }}
                        className="w-full h-full flex flex-col"
                      >
                        <div className="mb-6">
                          <h3 className="text-2xl md:text-3xl font-extrabold">
                            We found the best options for your home
                          </h3>
                          <p className="opacity-70 mt-2">
                            Based on your family size and usage pattern, these
                            match your capacity needs.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                          {getRecommendations().map((product, idx) => (
                            <motion.div
                              key={product._id}
                              initial={{ opacity: 0, y: 18 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 + idx * 0.08 }}
                              className="min-h-[420px] transform hover:scale-[1.01] transition-transform duration-300"
                            >
                              <div className="relative bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden border border-white/60 p-2 h-full">
                                <div
                                  className={[
                                    "badge absolute top-5 right-5 z-20 shadow-lg font-bold p-3",
                                    idx === 0
                                      ? "badge-secondary"
                                      : "badge-ghost",
                                  ].join(" ")}
                                >
                                  {idx === 0 ? "Best Match" : "Also Suitable"}
                                </div>
                                <ReusableProductCard
                                  product={product}
                                  viewMode="grid"
                                  padded={true}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* CTA strip */}
                        <div className="mt-8 rounded-2xl border border-white/25 bg-white/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div>
                            <p className="font-bold">Want exact sizing?</p>
                            <p className="opacity-70 text-sm">
                              Share your water hardness (TDS / hardness) and
                              we’ll confirm the perfect capacity.
                            </p>
                          </div>
                          <button className="btn btn-primary border-0 bg-gradient-to-r from-primary to-secondary text-white rounded-full px-7">
                            Book a Free Call
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -40, filter: "blur(10px)" }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        className="flex-grow flex flex-col justify-center"
                      >
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-8 flex items-center gap-4">
                          <span className="text-primary text-5xl drop-shadow-md">
                            {steps[currentStep].icon}
                          </span>
                          {currentStep === 0
                            ? "Welcome!"
                            : steps[currentStep].title}
                        </h2>

                        {currentStep === 0 && (
                          <div className="text-left">
                            <p className="text-xl opacity-80 mb-8 leading-relaxed font-medium">
                              Quick planner → right capacity → better skin/hair,
                              less scaling, longer appliance life.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                              {[
                                {
                                  t: "Less scaling",
                                  d: "Reduced white stains on taps & tiles.",
                                },
                                {
                                  t: "Softer water",
                                  d: "Better shower feel and smoother skin.",
                                },
                                {
                                  t: "Protect appliances",
                                  d: "Less damage to geyser & fittings.",
                                },
                              ].map((b) => (
                                <div
                                  key={b.t}
                                  className="rounded-2xl border border-white/25 bg-white/10 p-4"
                                >
                                  <p className="font-bold">{b.t}</p>
                                  <p className="text-sm opacity-70 mt-1">
                                    {b.d}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-4 items-center">
                              <button
                                className="btn btn-circle btn-lg border-0 text-white bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/30 hover:scale-110 transition-transform"
                                onClick={handleNext}
                              >
                                <FaArrowRight />
                              </button>
                              <span className="text-lg font-medium opacity-70">
                                Start Planning
                              </span>
                            </div>
                          </div>
                        )}

                        {currentStep === 1 && (
                          <div className="form-control w-full max-w-xl">
                            <label className="label mb-2">
                              <span className="label-text text-xl font-semibold">
                                How many people stay in your home?
                              </span>
                            </label>

                            <select
                              className="select select-bordered select-lg w-full bg-white/50 backdrop-blur-sm focus:bg-white transition-colors rounded-2xl border-2 border-base-content/10 focus:border-primary shadow-sm h-16 text-lg"
                              name="residents"
                              value={formData.residents}
                              onChange={handleChange}
                            >
                              <option disabled value="">
                                Select Residents
                              </option>
                              <option value="1-2">1–2 People</option>
                              <option value="3-4">3–4 People</option>
                              <option value="5-6">5–6 People</option>
                              <option value="7-9">7–9 People</option>
                              <option value="10+">10+ People</option>
                            </select>

                            <div className="mt-5 rounded-2xl border border-white/25 bg-white/10 p-4">
                              <p className="text-sm font-semibold">
                                Capacity hint
                              </p>
                              <p className="text-sm opacity-70 mt-1">
                                1–4: Compact • 5–9: Auto 25/40 • 10+: Auto
                                25/40/100
                              </p>
                            </div>
                          </div>
                        )}

                        {currentStep === 2 && (
                          <div className="form-control w-full">
                            <label className="label mb-4">
                              <span className="label-text text-xl font-semibold">
                                Daily Water Usage?
                              </span>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[
                                "Low (<300L)",
                                "Medium (300-600L)",
                                "High (600-1000L)",
                                "Very High (1000L+)",
                              ].map((opt) => {
                                const selected = formData.averageUsage === opt;
                                return (
                                  <button
                                    type="button"
                                    key={opt}
                                    className={[
                                      "btn h-auto py-6 rounded-2xl text-lg font-medium border-2 transition-all",
                                      "hover:scale-[1.02] active:scale-[0.99]",
                                      selected
                                        ? "btn-primary shadow-lg shadow-primary/30 border-primary"
                                        : "btn-outline border-base-content/20 hover:border-primary hover:bg-primary/5",
                                    ].join(" ")}
                                    onClick={() =>
                                      setFormData((p) => ({
                                        ...p,
                                        averageUsage: opt,
                                      }))
                                    }
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {currentStep === 3 && (
                          <div className="form-control w-full">
                            <label className="label mb-4">
                              <span className="label-text text-xl font-semibold">
                                How often will you use it?
                              </span>
                            </label>

                            <div className="flex flex-col md:flex-row gap-4">
                              {["Daily", "Weekly", "Occasionally"].map(
                                (opt) => {
                                  const val = opt.toLowerCase();
                                  const selected =
                                    formData.usageFrequency === val;

                                  return (
                                    <label
                                      key={opt}
                                      className={[
                                        "cursor-pointer flex-col p-6 border-2 rounded-2xl transition-all duration-200 flex-1 relative overflow-hidden",
                                        selected
                                          ? "border-primary bg-primary/10 shadow-md"
                                          : "border-white/25 bg-white/10 hover:border-primary/50 hover:bg-white/15",
                                      ].join(" ")}
                                    >
                                      <span className="font-bold mb-2 text-lg z-10">
                                        {opt}
                                      </span>

                                      <div className="flex items-center gap-3 z-10">
                                        <input
                                          type="radio"
                                          name="usageFrequency"
                                          className="radio radio-primary z-10"
                                          value={val}
                                          checked={selected}
                                          onChange={handleChange}
                                        />
                                        <span className="text-sm opacity-70">
                                          {opt === "Daily"
                                            ? "Best for full home use"
                                            : opt === "Weekly"
                                              ? "Good for partial usage"
                                              : "For guest / occasional use"}
                                        </span>
                                      </div>

                                      {selected && (
                                        <motion.div
                                          layoutId="active-blob"
                                          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-0"
                                        />
                                      )}
                                    </label>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation */}
                  {(currentStep > 0 || showRecommendations) && (
                    <div className="flex justify-between items-center mt-10 pt-8 border-t border-white/20">
                      <button
                        type="button"
                        className="btn btn-ghost hover:bg-white/10 rounded-full px-6 gap-2 text-lg font-medium"
                        onClick={handleBack}
                      >
                        <FaArrowLeft /> Back
                      </button>

                      {!showRecommendations && (
                        <button
                          type="button"
                          disabled={!canProceed}
                          className={[
                            "btn btn-circle btn-lg text-2xl border-0 text-white",
                            "bg-gradient-to-r from-primary to-secondary",
                            "shadow-lg shadow-primary/30 transition-transform",
                            canProceed
                              ? "hover:scale-110"
                              : "opacity-40 cursor-not-allowed hover:scale-100",
                          ].join(" ")}
                          onClick={handleNext}
                        >
                          {currentStep === steps.length - 1 ? (
                            <FaCheckCircle />
                          ) : (
                            <FaArrowRight />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Right: Tip + Promo */}
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="md:col-span-12 lg:col-span-3 lg:col-start-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8 h-full">
                <GlassCard className="rounded-[2.5rem]">
                  <div className="p-8">
                    <h3 className="text-warning text-xl font-bold flex items-center gap-2">
                      <FaLightbulb /> Did you know?
                    </h3>
                    <p className="mt-3 text-base-content/80 font-medium leading-relaxed">
                      {steps[currentStep]?.tip ||
                        "Water softeners can reduce scaling and improve the feel of water instantly."}
                    </p>

                    <div className="mt-6 rounded-2xl border border-white/25 bg-white/10 p-4">
                      <p className="text-sm font-semibold">Pro tip</p>
                      <p className="text-sm opacity-70 mt-1">
                        If you share hardness (ppm) and water source
                        (bore/municipal), we can confirm exact sizing.
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="rounded-[2.5rem] bg-gradient-to-br from-primary/40 to-accent/30 border-white/30">
                  <div className="p-8 text-primary-content relative overflow-hidden">
                    <FaWater className="absolute -bottom-8 -right-8 text-9xl opacity-20 rotate-12" />
                    <h3 className="font-bold text-xl">Need Help?</h3>
                    <p className="text-primary-content/90 font-medium mt-2">
                      Our experts can guide you with sizing, plumbing fitment,
                      and installation.
                    </p>
                    <button className="btn btn-sm btn-secondary glass mt-5 w-fit rounded-full px-6 text-white border-0 shadow-lg">
                      Contact Us
                    </button>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaSoftenerPlannerComponent;
