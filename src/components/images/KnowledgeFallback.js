import Image from "next/image";

// Branded placeholder for blog/knowledge images that are missing.
// Fills its (relatively positioned) parent.
const SIZES = {
  sm: { logo: 40, title: "text-xs", subtitle: "text-[10px]" },
  md: { logo: 56, title: "text-sm", subtitle: "text-[11px]" },
  lg: { logo: 80, title: "text-lg sm:text-xl", subtitle: "text-xs" },
};

const KnowledgeFallback = ({ label, size = "md" }) => {
  const scale = SIZES[size] || SIZES.md;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-4 text-center text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-white/5"
      />
      <Image
        src="/aquakart-logo-white.png"
        alt="Aquakart"
        width={scale.logo}
        height={scale.logo}
        className="relative drop-shadow-sm"
      />
      <p className={`relative font-extrabold tracking-tight ${scale.title}`}>
        Aquakart Knowledge
      </p>
      {label && (
        <p
          className={`relative font-semibold uppercase tracking-[0.18em] text-white/75 ${scale.subtitle}`}
        >
          {label}
        </p>
      )}
    </div>
  );
};

export default KnowledgeFallback;
