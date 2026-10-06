import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import BlogServiceOperations from "@/services/blog";
import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/20/solid";
import {
  ArrowUpIcon,
  ClockIcon,
  SparklesIcon,
  CalendarIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  GlobeAltIcon,
  HashtagIcon,
  ChevronLeftIcon,
  SpeakerWaveIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  AdjustmentsHorizontalIcon,
  MinusIcon,
  PlusIcon,
  XMarkIcon,
  ShoppingBagIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import {
  ChevronLeftIcon as ArrowPrevIcon,
  ChevronRightIcon as ArrowNextIcon,
} from "@heroicons/react/20/solid";
import useEmblaCarousel from "embla-carousel-react";
import ReusableProductCard from "@/components/cards/ProductCardTwo";
import Link from "next/link";
import AquaImage from "@/components/images/AquaImage";
import KnowledgeFallback from "@/components/images/KnowledgeFallback";
import { getCategoryName } from "@/utils/blogCategory";

const ProductCarousel = ({ products }) => {
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });
  const [snaps, setSnaps] = useState([]);
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return undefined;
    const sync = () => {
      setSnaps(emblaApi.scrollSnapList());
      setSelected(emblaApi.selectedScrollSnap());
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    sync();
    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    return () => {
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi]);

  const navButton =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--reader-border)] bg-[var(--reader-card)] text-[var(--reader-heading)] transition hover:border-emerald-400 hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div>
      <div ref={viewportRef} className="overflow-hidden">
        <div className="-ml-4 flex touch-pan-y">
          {products.map((item, idx) => (
            <div
              key={item?._id || idx}
              className="flex min-w-0 shrink-0 grow-0 basis-[85%] pl-4 sm:basis-1/2 xl:basis-1/3"
            >
              <div className="w-full">
                <ReusableProductCard product={item} variant="standard" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {snaps.length > 1 && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {snaps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === selected
                    ? "w-6 bg-[var(--reader-link)]"
                    : "w-1.5 bg-[var(--reader-border)]"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              aria-label="Previous products"
              className={navButton}
            >
              <ArrowPrevIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              aria-label="Next products"
              className={navButton}
            >
              <ArrowNextIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const formatShortDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const RelatedBlogCard = ({ post }) => (
  <Link
    href={`/blog/${encodeURIComponent(post.slug || post._id)}`}
    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--reader-border)] bg-[var(--reader-card)] transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
  >
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--reader-border)]">
      {post.image ? (
        <AquaImage
          customClass="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={post.image}
          alt={post.title}
          width={640}
          height={360}
          shimmer
        />
      ) : (
        <KnowledgeFallback size="sm" />
      )}
    </div>
    <div className="flex flex-1 flex-col p-4">
      {post.tags?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--reader-quote)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--reader-link)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <h3 className="line-clamp-2 text-base font-bold leading-snug text-[var(--reader-heading)] group-hover:text-[var(--reader-link)]">
        {post.title.replace(/_/g, " ")}
      </h3>
      {post.excerpt && (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--reader-muted)]">
          {post.excerpt}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between pt-3 text-xs font-semibold text-[var(--reader-muted)]">
        <span>{formatShortDate(post.createdAt)}</span>
        <span className="inline-flex items-center gap-0.5 text-[var(--reader-link)]">
          Read
          <ArrowNextIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  </Link>
);

const DESKTOP_QUERY = "(min-width: 1024px)";
const READER_PREFS_KEY = "aqua-blog-reader";
const LISTEN_PREFS_KEY = "aqua-blog-listen";
const BLOCKS_PER_SECTION = 4;
const SPOKEN_WORDS_PER_MINUTE = 160;

const FONT_SIZES = [16, 18, 20, 22];
const LINE_SPACINGS = [
  { key: "compact", label: "Compact", value: 1.65 },
  { key: "comfortable", label: "Comfortable", value: 1.85 },
  { key: "airy", label: "Airy", value: 2.05 },
];
const FONTS = [
  { key: "sans", label: "Sans", value: "inherit" },
  {
    key: "serif",
    label: "Serif",
    value: 'Georgia, Cambria, "Times New Roman", serif',
  },
];
const SPEECH_RATES = [0.85, 1, 1.25];
const READER_THEMES = {
  light: {
    label: "Light",
    swatch: "#ffffff",
    vars: {
      "--reader-page": "#ffffff",
      "--reader-card": "#f8fafc",
      "--reader-border": "#e2e8f0",
      "--reader-body": "#475569",
      "--reader-heading": "#0f172a",
      "--reader-link": "#059669",
      "--reader-muted": "#64748b",
      "--reader-quote": "#ecfdf5",
    },
  },
  sepia: {
    label: "Sepia",
    swatch: "#f6efe2",
    vars: {
      "--reader-page": "#f6efe2",
      "--reader-card": "#fbf7ee",
      "--reader-border": "#e6d9c2",
      "--reader-body": "#5b4636",
      "--reader-heading": "#3b2a1e",
      "--reader-link": "#9a5b13",
      "--reader-muted": "#8a7560",
      "--reader-quote": "#efe3cc",
    },
  },
  dark: {
    label: "Dark",
    swatch: "#0f172a",
    vars: {
      "--reader-page": "#0f172a",
      "--reader-card": "#1e293b",
      "--reader-border": "#334155",
      "--reader-body": "#cbd5e1",
      "--reader-heading": "#f8fafc",
      "--reader-link": "#34d399",
      "--reader-muted": "#94a3b8",
      "--reader-quote": "#13293d",
    },
  },
};
const DEFAULT_PREFS = {
  size: 1,
  spacing: "comfortable",
  font: "sans",
  theme: "light",
  rate: 1,
  voice: "",
};

const stripTags = (html = "") =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasContent = (html) =>
  stripTags(html).length > 0 || /<(img|iframe|video|table)/i.test(html);

// CMS HTML often carries inline font/colour styles and empty spacer paragraphs
// that fight the reader settings, so drop them before rendering.
const cleanBlogHtml = (html = "") =>
  html
    .replace(/\sstyle=("[^"]*"|'[^']*')/gi, "")
    .replace(/<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .trim();

// Split on headings so long articles read as separate parts. Falls back to
// grouping paragraphs when the article has no usable headings. Pure string
// work, so server and client produce identical markup.
const splitIntoSections = (html = "") => {
  const clean = cleanBlogHtml(html);
  if (!clean) return [];

  for (const tag of ["h2", "h3"]) {
    const parts = clean
      .split(new RegExp(`(?=<${tag}[\\s>])`, "i"))
      .map((part) => part.trim())
      .filter(hasContent);
    if (parts.length > 1) return parts;
  }

  const blocks = clean
    .split(/(?<=<\/(?:p|ul|ol|blockquote|table|figure|div)>)/i)
    .map((block) => block.trim())
    .filter(hasContent);
  if (blocks.length <= BLOCKS_PER_SECTION + 1) return [clean];

  const groups = [];
  for (let i = 0; i < blocks.length; i += BLOCKS_PER_SECTION) {
    groups.push(blocks.slice(i, i + BLOCKS_PER_SECTION).join(""));
  }
  return groups;
};

// Short utterances avoid Chrome cutting off long speechSynthesis text.
const toSpeechChunks = (text = "") => {
  // Split only where punctuation is followed by a space, so "7.5" stays whole.
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const chunks = [];
  let current = "";
  sentences.forEach((sentence) => {
    if ((current + sentence).length > 220 && current) {
      chunks.push(current.trim());
      current = "";
    }
    current += `${sentence} `;
  });
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

// Rewrites written shorthand into how a person would say it aloud.
const toSpokenText = (text = "") =>
  text
    .replace(/(?:https?:\/\/|www\.)\S+?(?=[.,;:!?]?(?:\s|$))/gi, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\be\.g\.,?/gi, "for example,")
    .replace(/\bi\.e\.,?/gi, "that is,")
    .replace(/\betc\./gi, "and so on.")
    .replace(/\bvs\.?\s/gi, "versus ")
    .replace(/(?:₹|\bRs\.?|\bINR)\s?([\d,]+(?:\.\d+)?)/gi, "$1 rupees")
    .replace(/(\d)\s?%/g, "$1 percent")
    .replace(/\s&\s/g, " and ")
    .replace(/[•▪►✓✔→]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Ranks browser voices so neural/"natural" voices win over robotic ones.
// Edge: "… Online (Natural)", Safari: Enhanced/Premium/Siri, Chrome: "Google …".
const NATURAL_VOICE = /natural|neural|online|premium|enhanced|siri/i;
const GOOD_SYSTEM_VOICES =
  /samantha|daniel|karen|moira|rishi|veena|ava|allison|serena|tessa|fiona|lekha|isha/i;
const ROBOTIC_VOICE =
  /desktop|espeak|compact|eloquence|zarvox|albert|bad news|bells|boing|bubbles|cellos|whisper|jester|organ|trinoids|wobble/i;

const scoreVoice = (voice) => {
  let score = 0;
  if (NATURAL_VOICE.test(voice.name)) score += 100;
  if (/^google/i.test(voice.name)) score += 60;
  if (GOOD_SYSTEM_VOICES.test(voice.name)) score += 40;
  if (ROBOTIC_VOICE.test(voice.name)) score -= 80;
  if (!voice.localService) score += 10;
  if (voice.lang === "en-IN") score += 15;
  else if (/^en-(GB|US)/i.test(voice.lang)) score += 8;
  return score;
};

const isNaturalVoice = (voice) => Boolean(voice) && scoreVoice(voice) >= 60;

const voiceLabel = (voice) => {
  const name = voice.name
    .replace(/^(Microsoft|Google|Apple)\s+/i, "")
    .replace(/\s*Online\s*\(Natural\)/i, "")
    .replace(/\s*-\s*English.*$/i, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .trim();
  const region = voice.lang?.split("-")[1] || "";
  return `${name}${region ? ` · ${region}` : ""}`;
};

const SPEAKABLE_BLOCKS =
  "h1, h2, h3, h4, p, li, blockquote, figcaption, td, th";

// Turns a rendered part into utterances with human-like pauses: a short
// breath between sentences, longer between paragraphs, longest after headings.
const buildSpeechQueue = (sectionElement) => {
  const reader = sectionElement?.querySelector(".aqua-reader");
  if (!reader) return [];

  const blocks = Array.from(reader.querySelectorAll(SPEAKABLE_BLOCKS)).filter(
    (block) => !block.parentElement?.closest(SPEAKABLE_BLOCKS),
  );
  const items = blocks.length
    ? blocks.map((block) => ({
        text: block.innerText,
        heading: /^H[1-4]$/.test(block.tagName),
      }))
    : reader.innerText.split(/\n+/).map((text) => ({ text, heading: false }));

  const queue = [];
  items.forEach(({ text, heading }) => {
    const chunks = toSpeechChunks(toSpokenText(text));
    chunks.forEach((chunk, index) => {
      const last = index === chunks.length - 1;
      queue.push({
        text: chunk,
        heading,
        pause: last ? (heading ? 650 : 420) : 140,
      });
    });
  });
  return queue;
};

const AquaDynamicBlogComponent = ({
  initialBlog = null,
  initialRelated = [],
  initialAttached = [],
  initialRelatedBlogs = [],
  initialError = "",
}) => {
  const router = useRouter();
  const { id } = router.query;
  const [blog, setBlog] = useState(initialBlog);
  const [related, setRelated] = useState(initialRelated);
  const [loading, setLoading] = useState(!initialBlog && !initialError);
  const [error, setError] = useState(initialError);
  const [toc, setToc] = useState([]);
  const [activeHeading, setActiveHeading] = useState("");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speech, setSpeech] = useState({ status: "idle", section: -1 });
  // `seen` drives the attention ring on the toolbar speaker; the banner can be
  // dismissed. Defaults avoid a flash before localStorage is read.
  const [listenPrefs, setListenPrefs] = useState({
    seen: true,
    bannerHidden: true,
  });

  // Right column scroll container (desktop) and the article body inside it.
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const sectionRefs = useRef([]);
  const speechTokenRef = useRef(0);
  const speechTimerRef = useRef(null);
  // Holding the live utterance stops Chrome garbage-collecting it mid-speech
  // (which silently drops its onend and stalls playback).
  const utteranceRef = useRef(null);
  // Pausing during the gap between utterances parks the next step here.
  const pausedRef = useRef(false);
  const pendingStepRef = useRef(null);
  const [voices, setVoices] = useState([]);
  const settingsRef = useRef(null);

  const sections = useMemo(
    () => splitIntoSections(blog?.description),
    [blog?.description],
  );

  useEffect(() => {
    setBlog(initialBlog);
    setRelated(initialRelated);
    setError(initialError);
    setLoading(!initialBlog && !initialError);
  }, [initialBlog, initialRelated, initialError]);

  // Reader preferences are per-device conveniences; load after mount so the
  // first render matches the server.
  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(READER_PREFS_KEY) || "null",
      );
      if (saved && typeof saved === "object")
        setPrefs((prev) => ({ ...prev, ...saved }));
    } catch {}
    let savedListen = null;
    try {
      savedListen = JSON.parse(
        window.localStorage.getItem(LISTEN_PREFS_KEY) || "null",
      );
    } catch {}
    setListenPrefs({
      seen: Boolean(savedListen?.seen),
      bannerHidden: Boolean(savedListen?.bannerHidden),
    });
    setSpeechSupported("speechSynthesis" in window);
  }, []);

  const rememberListen = (patch) => {
    setListenPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(LISTEN_PREFS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const updatePrefs = (patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(READER_PREFS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!settingsOpen) return;
    const close = (event) => {
      if (!settingsRef.current?.contains(event.target)) setSettingsOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setSettingsOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (
      !sections.length ||
      !contentRef.current ||
      typeof window === "undefined"
    ) {
      setToc([]);
      return;
    }

    const headings = Array.from(
      contentRef.current.querySelectorAll("h2, h3"),
    ).map((heading, index) => {
      const baseId =
        heading.textContent
          ?.toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || `section-${index}`;
      const uniqueId = heading.id || `${baseId}-${index}`;
      heading.id = uniqueId;
      return {
        id: uniqueId,
        text: heading.textContent || `Section ${index + 1}`,
        level: heading.tagName.toLowerCase(),
      };
    });

    setToc(headings);
  }, [sections]);

  // On desktop the right column scrolls; on mobile the window does.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const panel = scrollRef.current;

    const handleScroll = () => {
      const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
      let ratio = 1;

      if (isDesktop && panel) {
        const max = panel.scrollHeight - panel.clientHeight;
        ratio = max > 0 ? panel.scrollTop / max : 1;
      } else if (contentRef.current) {
        const element = contentRef.current;
        const elementTop = element.getBoundingClientRect().top + window.scrollY;
        const maxScroll = Math.max(
          elementTop + element.offsetHeight - window.innerHeight,
          0,
        );
        const currentScroll = Math.min(
          Math.max(window.scrollY - elementTop, 0),
          maxScroll,
        );
        ratio = maxScroll > 0 ? currentScroll / maxScroll : 1;
      }

      setProgress(Math.min(Math.max(ratio * 100, 0), 100));

      if (!contentRef.current) return;
      const offset =
        isDesktop && panel ? panel.getBoundingClientRect().top + 96 : 160;
      let current = "";
      contentRef.current
        .querySelectorAll("h2[id], h3[id]")
        .forEach((heading) => {
          if (heading.getBoundingClientRect().top - offset <= 0)
            current = heading.id;
        });
      setActiveHeading(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    panel?.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      panel?.removeEventListener("scroll", handleScroll);
    };
  }, [sections, loading]);

  // ── Listen (text-to-speech) ───────────────────────────
  // Voices load asynchronously in most browsers; keep English ones, best first.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const english = synth
        .getVoices()
        .filter((voice) => /^en/i.test(voice.lang))
        .sort((a, b) => scoreVoice(b) - scoreVoice(a));
      setVoices(english);
    };
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const activeVoice = useMemo(
    () =>
      voices.find((voice) => voice.voiceURI === prefs.voice) ||
      voices[0] ||
      null,
    [voices, prefs.voice],
  );

  const createUtterance = useCallback(
    (text, { heading = false } = {}) => {
      const utterance = new SpeechSynthesisUtterance(text);
      if (activeVoice) {
        utterance.voice = activeVoice;
        utterance.lang = activeVoice.lang;
      } else {
        utterance.lang = "en-IN";
      }
      // Headings slightly slower, like a narrator introducing a new topic.
      utterance.rate = prefs.rate * (heading ? 0.92 : 1);
      utterance.pitch = 1;
      utteranceRef.current = utterance;
      return utterance;
    },
    [activeVoice, prefs.rate],
  );

  const stopSpeech = useCallback(() => {
    speechTokenRef.current += 1;
    clearTimeout(speechTimerRef.current);
    pausedRef.current = false;
    pendingStepRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeech({ status: "idle", section: -1 });
  }, []);

  const speakFrom = useCallback(
    (sectionIndex) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;
      const synth = window.speechSynthesis;
      const element = sectionRefs.current[sectionIndex];

      speechTokenRef.current += 1;
      const token = speechTokenRef.current;
      clearTimeout(speechTimerRef.current);
      pausedRef.current = false;
      pendingStepRef.current = null;
      synth.cancel();

      if (!element) {
        setSpeech({ status: "idle", section: -1 });
        return;
      }

      const queue = buildSpeechQueue(element);
      setSpeech({ status: "playing", section: sectionIndex });
      element.scrollIntoView({ behavior: "smooth", block: "start" });

      const nextSection = () => {
        if (token !== speechTokenRef.current) return;
        if (sectionIndex + 1 < sections.length) {
          const goNext = () => speakFrom(sectionIndex + 1);
          speechTimerRef.current = setTimeout(() => {
            if (pausedRef.current) pendingStepRef.current = goNext;
            else goNext();
          }, 800);
        } else {
          setSpeech({ status: "idle", section: -1 });
        }
      };

      // One utterance at a time so we can breathe between sentences/paragraphs.
      const playItem = (index) => {
        if (token !== speechTokenRef.current) return;
        if (pausedRef.current) {
          pendingStepRef.current = () => playItem(index);
          return;
        }
        if (index >= queue.length) {
          nextSection();
          return;
        }
        const item = queue[index];
        const utterance = createUtterance(item.text, { heading: item.heading });
        const advance = () => {
          if (token !== speechTokenRef.current) return;
          speechTimerRef.current = setTimeout(
            () => playItem(index + 1),
            item.pause,
          );
        };
        utterance.onend = advance;
        utterance.onerror = (event) => {
          if (event.error !== "interrupted" && event.error !== "canceled")
            advance();
        };
        synth.speak(utterance);
      };

      playItem(0);
    },
    [createUtterance, sections.length],
  );

  const previewVoice = (voice) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(
      "Hi there! This is how I'll sound reading Aquakart articles to you.",
    );
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = prefs.rate;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = (sectionIndex = 0) => {
    if (!listenPrefs.seen) rememberListen({ seen: true });
    speakFrom(sectionIndex);
  };

  const togglePause = () => {
    const synth = window.speechSynthesis;
    if (speech.status === "playing") {
      pausedRef.current = true;
      synth.pause();
      setSpeech((prev) => ({ ...prev, status: "paused" }));
    } else if (speech.status === "paused") {
      pausedRef.current = false;
      synth.resume();
      setSpeech((prev) => ({ ...prev, status: "playing" }));
      const pending = pendingStepRef.current;
      pendingStepRef.current = null;
      pending?.();
    }
  };

  // Stop reading aloud when leaving or switching articles.
  useEffect(() => stopSpeech, [blog?._id, stopSpeech]);

  const estimatedReadMinutes = useMemo(() => {
    if (!blog?.description) return 3;
    const words = stripTags(blog.description)
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [blog?.description]);

  const listenMinutes = useMemo(() => {
    const words = stripTags(blog?.description || "")
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(
      1,
      Math.round(words / (SPOKEN_WORDS_PER_MINUTE * prefs.rate)),
    );
  }, [blog?.description, prefs.rate]);

  const sectionMinutes = useMemo(
    () =>
      sections.map((html) =>
        Math.max(
          1,
          Math.round(stripTags(html).split(/\s+/).filter(Boolean).length / 200),
        ),
      ),
    [sections],
  );

  const publishedDate = useMemo(() => {
    if (!blog?.createdAt) return "";
    try {
      return new Date(blog.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }, [blog?.createdAt]);

  const authorName =
    (typeof blog?.author === "string" && blog.author) ||
    blog?.author?.name ||
    "Aquakart Editorial";
  const authorRole = blog?.author?.role || "Water Solutions Team";
  const authorInitials = authorName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const copyToClipboard = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy link failed", err);
      setCopied(false);
    }
  };

  const handleShare = (platform) => {
    if (typeof window === "undefined") return;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(blog?.title || "Check this out!");

    let shareUrl = "";
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${title} - ${url}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleTocClick = (event, headingId) => {
    event.preventDefault();
    document
      .getElementById(headingId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleScrollToTop = () => {
    if (typeof window === "undefined") return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = async () => {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      // Route param is usually a slug; only the by-id endpoint returns products.
      let fetchedBlog = null;
      try {
        fetchedBlog =
          (await BlogServiceOperations.blogBySlug(id))?.data?.data || null;
      } catch {}
      const byId = await BlogServiceOperations.blogById(fetchedBlog?._id || id);
      setBlog(fetchedBlog || byId?.data?.data || null);
      setRelated(byId?.data?.relatedProduct || []);
      setError("");
    } catch (fetchError) {
      console.error("Retry fetching blog failed", fetchError);
      setBlog(null);
      setError("We couldn't load this story. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTopicLabel = (value, fallback = "Aquakart") => {
    if (!value || typeof value !== "string") return fallback;
    const cleaned = value.replace(/[._-]+/g, " ").trim();
    if (!cleaned) return fallback;
    return cleaned.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const categoryLabel = formatTopicLabel(
    getCategoryName(blog?.category),
    "Insights",
  );
  const coverImage =
    blog?.titleImages?.[0]?.secure_url || blog?.photos?.[0]?.secure_url || "";

  const keyHighlights = useMemo(() => {
    if (Array.isArray(blog?.keyHighlights)) {
      return blog.keyHighlights.filter(Boolean);
    }
    if (typeof blog?.keyHighlights === "string") {
      return blog.keyHighlights
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
    if (typeof blog?.summary === "string") {
      return blog.summary
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 5);
    }
    return [];
  }, [blog?.keyHighlights, blog?.summary]);

  const schemaBlog = blog || initialBlog || null;
  const ready = !loading && !error && blog;

  const theme = READER_THEMES[prefs.theme] || READER_THEMES.light;
  const fontSize = FONT_SIZES[prefs.size] ?? FONT_SIZES[DEFAULT_PREFS.size];
  const readerStyle = {
    ...theme.vars,
    "--reader-size": `${fontSize}px`,
    "--reader-leading": (
      LINE_SPACINGS.find((s) => s.key === prefs.spacing) || LINE_SPACINGS[1]
    ).value,
    "--reader-font": (FONTS.find((f) => f.key === prefs.font) || FONTS[0])
      .value,
  };

  const shareButtons = [
    {
      key: "whatsapp",
      label: "Share on WhatsApp",
      Icon: ChatBubbleOvalLeftEllipsisIcon,
    },
    { key: "facebook", label: "Share on Facebook", Icon: GlobeAltIcon },
    { key: "twitter", label: "Share on X", Icon: HashtagIcon },
  ];

  const segmentClass = (active) =>
    `flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <AquaLayout blogPageData={schemaBlog}>
      <div className="fixed inset-0 z-[-1] bg-slate-50" />

      {/* Reading progress */}
      <div
        className="fixed left-0 right-0 top-0 z-50 h-1 bg-slate-200/60"
        aria-hidden="true"
      >
        <div
          className="h-full bg-emerald-500 transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8 lg:pb-4">
        <div className="grid gap-6 lg:h-[calc(100dvh-7rem)] lg:grid-cols-[minmax(300px,380px)_1fr] lg:gap-8">
          {/* Left column: title + author, fixed in place on desktop */}
          <aside className="flex min-h-0 flex-col lg:h-full lg:overflow-hidden">
            <Link
              href="/blogs"
              className="mb-6 inline-flex w-fit items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-emerald-600"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              All insights
            </Link>

            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-5 w-24 rounded-full bg-slate-200" />
                <div className="h-9 w-full rounded-lg bg-slate-200" />
                <div className="h-9 w-4/5 rounded-lg bg-slate-200" />
                <div className="mt-6 h-14 w-full rounded-2xl bg-slate-200" />
              </div>
            ) : error ? null : (
              <>
                <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  {categoryLabel}
                </span>

                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-4xl">
                  {blog.title}
                </h1>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 border-y border-slate-200 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {authorInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {authorName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {authorRole}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                  {publishedDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-emerald-500" />
                      {publishedDate}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4 text-emerald-500" />
                    {estimatedReadMinutes} min read
                  </span>
                </div>

                {speechSupported && (
                  <button
                    type="button"
                    onClick={() =>
                      speech.status === "idle"
                        ? startListening(0)
                        : togglePause()
                    }
                    className="group mt-5 flex w-full items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-100/70"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                      {speech.status === "playing" ? (
                        <span className="aqua-eq scale-75">
                          <span />
                          <span />
                          <span />
                          <span />
                        </span>
                      ) : (
                        <SpeakerWaveIcon className="h-5 w-5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-emerald-900">
                        {speech.status === "idle"
                          ? "Listen to this article"
                          : speech.status === "playing"
                            ? "Listening… tap to pause"
                            : "Paused · tap to resume"}
                      </span>
                      <span className="block text-xs text-emerald-700/80">
                        {speech.status === "idle"
                          ? `About ${listenMinutes} min · hands-free`
                          : `Part ${speech.section + 1} of ${sections.length}`}
                      </span>
                    </span>
                    <PlayIcon className="h-5 w-5 shrink-0 text-emerald-600 transition group-hover:translate-x-0.5" />
                  </button>
                )}

                {related.length + initialAttached.length > 0 && (
                  <a
                    href={
                      initialAttached.length
                        ? "#featured-products"
                        : "#blog-products"
                    }
                    onClick={(event) =>
                      handleTocClick(
                        event,
                        initialAttached.length
                          ? "featured-products"
                          : "blog-products",
                      )
                    }
                    className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:text-emerald-700"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ShoppingBagIcon className="h-5 w-5 text-emerald-600" />
                      Products in this article
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      {related.length + initialAttached.length}
                    </span>
                  </a>
                )}

                {initialRelatedBlogs.length > 0 && (
                  <a
                    href="#related-blogs"
                    onClick={(event) => handleTocClick(event, "related-blogs")}
                    className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:text-emerald-700"
                  >
                    <span className="inline-flex items-center gap-2">
                      <BookOpenIcon className="h-5 w-5 text-emerald-600" />
                      Related articles
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      {initialRelatedBlogs.length}
                    </span>
                  </a>
                )}

                {/* Share */}
                <div className="mt-5 flex items-center gap-2">
                  {shareButtons.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleShare(key)}
                      aria-label={label}
                      title={label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                  >
                    {copied ? (
                      <ClipboardDocumentCheckIcon className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>

                {/* Contents (desktop only; fills remaining height) */}
                {toc.length > 0 && (
                  <nav className="mt-8 hidden min-h-0 flex-1 flex-col lg:flex">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      On this page
                    </p>
                    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto border-l border-slate-200">
                      {toc.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(event) => handleTocClick(event, item.id)}
                          className={`-ml-px block truncate border-l-2 py-1.5 text-sm transition-colors ${
                            item.level === "h3" ? "pl-7" : "pl-4"
                          } ${
                            activeHeading === item.id
                              ? "border-emerald-500 font-semibold text-emerald-700"
                              : "border-transparent text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {item.text}
                        </a>
                      ))}
                    </div>
                  </nav>
                )}
              </>
            )}
          </aside>

          {/* Right column: scrollable content, fits viewport height on desktop */}
          <main
            ref={scrollRef}
            style={readerStyle}
            className="min-h-0 rounded-3xl border border-[var(--reader-border)] bg-[var(--reader-page)] shadow-sm transition-colors duration-300 lg:h-full lg:overflow-y-auto lg:overscroll-contain"
          >
            {loading ? (
              <div className="animate-pulse space-y-4 p-6 sm:p-10">
                <div className="aspect-video w-full rounded-2xl bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-11/12 rounded bg-slate-200" />
                <div className="h-4 w-4/5 rounded bg-slate-200" />
              </div>
            ) : error ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center p-10 text-center">
                <p className="font-semibold text-rose-600">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-4 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Try again
                </button>
              </div>
            ) : ready ? (
              <>
                {/* Reader toolbar */}
                <div className="sticky top-20 z-20 flex items-center justify-between gap-3 border-b border-[var(--reader-border)] bg-[var(--reader-page)]/90 px-4 py-2.5 backdrop-blur-md sm:px-6 lg:top-0 lg:rounded-t-3xl">
                  <p className="truncate text-xs font-medium text-[var(--reader-muted)]">
                    {speech.section >= 0
                      ? `Reading part ${speech.section + 1} of ${sections.length}`
                      : `${sections.length} ${sections.length === 1 ? "part" : "parts"} · ${estimatedReadMinutes} min`}
                  </p>

                  <div className="flex items-center gap-2">
                    {speechSupported &&
                      (speech.status === "idle" ? (
                        <button
                          type="button"
                          onClick={() => startListening(0)}
                          title="Listen to this article"
                          className="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
                        >
                          {!listenPrefs.seen && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-500/50"
                            />
                          )}
                          <SpeakerWaveIcon className="h-4 w-4" />
                          Listen
                          <span className="hidden rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] sm:inline">
                            {listenMinutes} min
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full bg-emerald-600 p-1 text-white">
                          <button
                            type="button"
                            onClick={togglePause}
                            aria-label={
                              speech.status === "playing" ? "Pause" : "Resume"
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/20"
                          >
                            {speech.status === "playing" ? (
                              <PauseIcon className="h-4 w-4" />
                            ) : (
                              <PlayIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={stopSpeech}
                            aria-label="Stop"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/20"
                          >
                            <StopIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                    <div ref={settingsRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setSettingsOpen((open) => !open)}
                        aria-expanded={settingsOpen}
                        aria-label="Reading settings"
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--reader-border)] bg-[var(--reader-card)] px-3 text-xs font-semibold text-[var(--reader-heading)] transition hover:border-emerald-400"
                      >
                        <AdjustmentsHorizontalIcon className="h-4 w-4" />
                        Aa
                      </button>

                      {settingsOpen && (
                        <div className="no-scrollbar absolute right-0 top-full mt-2 max-h-[70vh] w-72 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              Text size
                            </p>
                            <div className="flex items-center justify-between rounded-xl bg-slate-100 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updatePrefs({
                                    size: Math.max(prefs.size - 1, 0),
                                  })
                                }
                                disabled={prefs.size === 0}
                                aria-label="Smaller text"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white disabled:opacity-30"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-semibold">
                                {fontSize}px
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updatePrefs({
                                    size: Math.min(
                                      prefs.size + 1,
                                      FONT_SIZES.length - 1,
                                    ),
                                  })
                                }
                                disabled={prefs.size === FONT_SIZES.length - 1}
                                aria-label="Larger text"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white disabled:opacity-30"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              Font
                            </p>
                            <div className="flex gap-1 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-100">
                              {FONTS.map((font) => (
                                <button
                                  key={font.key}
                                  type="button"
                                  onClick={() =>
                                    updatePrefs({ font: font.key })
                                  }
                                  style={{ fontFamily: font.value }}
                                  className={segmentClass(
                                    prefs.font === font.key,
                                  )}
                                >
                                  {font.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              Line spacing
                            </p>
                            <div className="flex gap-1 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-100">
                              {LINE_SPACINGS.map((spacing) => (
                                <button
                                  key={spacing.key}
                                  type="button"
                                  onClick={() =>
                                    updatePrefs({ spacing: spacing.key })
                                  }
                                  className={segmentClass(
                                    prefs.spacing === spacing.key,
                                  )}
                                >
                                  {spacing.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              Theme
                            </p>
                            <div className="flex gap-2">
                              {Object.entries(READER_THEMES).map(
                                ([key, option]) => (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => updatePrefs({ theme: key })}
                                    className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition ${
                                      prefs.theme === key
                                        ? "border-emerald-500 ring-1 ring-emerald-500"
                                        : "border-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    <span
                                      className="h-6 w-6 rounded-full border border-slate-300"
                                      style={{ background: option.swatch }}
                                    />
                                    {option.label}
                                  </button>
                                ),
                              )}
                            </div>
                          </div>

                          {speechSupported && voices.length > 0 && (
                            <div>
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Voice
                              </p>
                              <div className="no-scrollbar max-h-44 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-1 ring-1 ring-slate-100">
                                {voices.slice(0, 12).map((voice) => {
                                  const selected =
                                    activeVoice?.voiceURI === voice.voiceURI;
                                  return (
                                    <div
                                      key={voice.voiceURI}
                                      className={`flex items-center gap-1 rounded-lg transition ${
                                        selected
                                          ? "bg-slate-900 text-white"
                                          : "hover:bg-white"
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updatePrefs({ voice: voice.voiceURI })
                                        }
                                        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold"
                                      >
                                        <span className="truncate">
                                          {voiceLabel(voice)}
                                        </span>
                                        {isNaturalVoice(voice) && (
                                          <span
                                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                                              selected
                                                ? "bg-emerald-400 text-slate-900"
                                                : "bg-emerald-100 text-emerald-700"
                                            }`}
                                          >
                                            Natural
                                          </span>
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => previewVoice(voice)}
                                        aria-label={`Preview ${voiceLabel(voice)}`}
                                        title="Preview"
                                        className={`mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
                                          selected
                                            ? "hover:bg-white/20"
                                            : "text-slate-500 hover:bg-slate-200"
                                        }`}
                                      >
                                        <PlayIcon className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                              {!isNaturalVoice(voices[0]) && (
                                <p className="mt-2 text-[11px] leading-snug text-slate-500">
                                  Tip: for the most human-sounding voices, open
                                  this page in Microsoft Edge, Chrome or Safari.
                                </p>
                              )}
                            </div>
                          )}

                          {speechSupported && (
                            <div>
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Listening speed
                              </p>
                              <div className="flex gap-1 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-100">
                                {SPEECH_RATES.map((rate) => (
                                  <button
                                    key={rate}
                                    type="button"
                                    onClick={() => updatePrefs({ rate })}
                                    className={segmentClass(
                                      prefs.rate === rate,
                                    )}
                                  >
                                    {rate}x
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {speechSupported && listenPrefs.bannerHidden && (
                            <button
                              type="button"
                              onClick={() =>
                                rememberListen({ bannerHidden: false })
                              }
                              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <SpeakerWaveIcon className="h-4 w-4" />
                              Show &quot;Want to hear this?&quot; banner
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => updatePrefs(DEFAULT_PREFS)}
                            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-emerald-600"
                          >
                            Reset to default
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-8 xl:p-10">
                  {/* "Want to hear this?" banner / now-playing player */}
                  {speechSupported &&
                    (speech.status !== "idle" || !listenPrefs.bannerHidden) && (
                      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 p-5 text-white shadow-lg shadow-emerald-700/20 sm:p-6">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -bottom-12 right-24 h-28 w-28 rounded-full bg-white/5"
                        />

                        {speech.status === "idle" ? (
                          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-md">
                              <SpeakerWaveIcon className="h-7 w-7" />
                            </div>
                            <div className="min-w-0 flex-1 pr-6">
                              <p className="text-lg font-bold leading-tight">
                                Want to hear this?
                              </p>
                              <p className="mt-1 text-sm text-emerald-50/90">
                                Listen to the full article in about{" "}
                                {listenMinutes} min. Great while you&apos;re
                                cooking, driving or resting your eyes.
                              </p>
                              {activeVoice && (
                                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                                  Narrated by{" "}
                                  {voiceLabel(activeVoice).split(" · ")[0]}
                                  {isNaturalVoice(activeVoice) && (
                                    <span className="rounded-full bg-white px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                                      Natural
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => startListening(0)}
                              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-emerald-700 shadow-md transition hover:scale-[1.03] hover:bg-emerald-50"
                            >
                              <PlayIcon className="h-5 w-5" />
                              Play article
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                rememberListen({ bannerHidden: true })
                              }
                              aria-label="Hide listen banner"
                              title="Hide (you can still use Listen in the toolbar)"
                              className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-md">
                              <span
                                className="aqua-eq"
                                data-paused={speech.status === "paused"}
                              >
                                <span />
                                <span />
                                <span />
                                <span />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                                {speech.status === "paused"
                                  ? "Paused"
                                  : "Now playing"}{" "}
                                · {prefs.rate}x
                                {activeVoice
                                  ? ` · ${voiceLabel(activeVoice).split(" · ")[0]}`
                                  : ""}
                              </p>
                              <p className="mt-0.5 truncate text-lg font-bold leading-tight">
                                Part {speech.section + 1} of {sections.length}
                              </p>
                              {sections.length > 1 && (
                                <div
                                  className="mt-2.5 flex gap-1"
                                  aria-hidden="true"
                                >
                                  {sections.map((_, index) => (
                                    <span
                                      key={index}
                                      className={`h-1.5 flex-1 rounded-full ${
                                        index <= speech.section
                                          ? "bg-white"
                                          : "bg-white/25"
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={togglePause}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-emerald-700 shadow-md transition hover:bg-emerald-50"
                              >
                                {speech.status === "playing" ? (
                                  <>
                                    <PauseIcon className="h-5 w-5" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <PlayIcon className="h-5 w-5" />
                                    Resume
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={stopSpeech}
                                aria-label="Stop listening"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
                              >
                                <StopIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-2xl bg-[var(--reader-card)]">
                    {coverImage ? (
                      <AquaImage
                        customClass="h-full w-full object-cover"
                        src={coverImage}
                        alt={blog.title}
                        width={1280}
                        height={720}
                        shimmer
                      />
                    ) : (
                      <KnowledgeFallback size="lg" label={categoryLabel} />
                    )}
                  </div>

                  {/* Article split into readable parts */}
                  <div ref={contentRef} className="mx-auto max-w-3xl space-y-5">
                    {sections.map((html, index) => (
                      <section
                        key={index}
                        ref={(element) => {
                          sectionRefs.current[index] = element;
                        }}
                        className={`scroll-mt-20 rounded-2xl border bg-[var(--reader-card)] p-5 transition-shadow sm:p-8 ${
                          speech.section === index
                            ? "border-emerald-500 ring-2 ring-emerald-500/30"
                            : "border-[var(--reader-border)]"
                        }`}
                      >
                        {sections.length > 1 && (
                          <div className="mb-4 flex items-center justify-between gap-3 text-xs font-semibold text-[var(--reader-muted)]">
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--reader-link)] px-1.5 text-[11px] text-[var(--reader-page)]">
                                {index + 1}
                              </span>
                              Part {index + 1} of {sections.length} ·{" "}
                              {sectionMinutes[index]} min
                            </span>
                            {speechSupported && speech.section !== index && (
                              <button
                                type="button"
                                onClick={() => startListening(index)}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:text-[var(--reader-link)]"
                              >
                                <SpeakerWaveIcon className="h-3.5 w-3.5" />
                                Listen from here
                              </button>
                            )}
                          </div>
                        )}
                        <div
                          className="aqua-reader"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      </section>
                    ))}
                  </div>

                  {initialAttached.length > 0 && (
                    <section
                      id="featured-products"
                      aria-label="Products featured in this article"
                      className="mx-auto mt-8 max-w-3xl scroll-mt-20 rounded-2xl border border-[var(--reader-border)] bg-[var(--reader-quote)] p-4 sm:p-6"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <ShoppingBagIcon className="h-5 w-5 text-[var(--reader-link)]" />
                        <h2 className="text-lg font-bold text-[var(--reader-heading)]">
                          Featured in this article
                        </h2>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {initialAttached.map((product) => (
                          <ReusableProductCard
                            key={product._id}
                            product={product}
                            variant="standard"
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {keyHighlights.length > 0 && (
                    <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[var(--reader-border)] bg-[var(--reader-quote)] p-6 sm:p-8">
                      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[var(--reader-heading)]">
                        <SparklesIcon className="h-5 w-5 text-[var(--reader-link)]" />
                        Key takeaways
                      </h2>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {keyHighlights.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--reader-link)]" />
                            <span className="text-sm leading-relaxed text-[var(--reader-body)]">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {related.length > 0 && (
                    <section
                      id="blog-products"
                      className="mt-12 scroll-mt-20 border-t border-[var(--reader-border)] pt-10"
                    >
                      <div className="mb-6 flex items-end justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-[var(--reader-heading)]">
                            {initialAttached.length
                              ? "You may also like"
                              : "Recommended products"}
                          </h2>
                          <p className="mt-1 text-sm text-[var(--reader-muted)]">
                            Picked to go with what you just read.
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-[var(--reader-muted)]">
                          {related.length}{" "}
                          {related.length === 1 ? "product" : "products"}
                        </span>
                      </div>
                      <ProductCarousel products={related} />
                    </section>
                  )}

                  {initialRelatedBlogs.length > 0 && (
                    <section
                      id="related-blogs"
                      className="mt-12 scroll-mt-20 border-t border-[var(--reader-border)] pt-10"
                    >
                      <div className="mb-6 flex items-end justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-[var(--reader-heading)]">
                            Keep reading
                          </h2>
                          <p className="mt-1 text-sm text-[var(--reader-muted)]">
                            More guides on similar topics.
                          </p>
                        </div>
                        <Link
                          href="/blogs"
                          className="shrink-0 text-xs font-semibold text-[var(--reader-link)] hover:underline"
                        >
                          View all
                        </Link>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {initialRelatedBlogs.map((post) => (
                          <RelatedBlogCard key={post._id} post={post} />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </>
            ) : null}
          </main>
        </div>
      </div>

      {progress > 10 && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-emerald-600"
          aria-label="Back to top"
        >
          <ArrowUpIcon className="h-5 w-5" />
        </button>
      )}
    </AquaLayout>
  );
};

export default AquaDynamicBlogComponent;
