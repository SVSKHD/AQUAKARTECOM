import { useEffect, useMemo, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import BlogServiceOperations from "@/services/blog";
import Image from "next/image";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowRightIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";

const computeReadingTime = (content) => {
  if (!content) return 3;
  const text = content.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const looksLikeId = (value = "") => {
  const compact = value.replace(/[^0-9a-f]/gi, "");
  return compact.length >= 16;
};

const formatTopicLabel = (value, fallback = "General") => {
  if (!value || typeof value !== "string") {
    return fallback;
  }
  const cleaned = value.replace(/[._-]+/g, " ").trim();
  if (!cleaned || looksLikeId(cleaned)) {
    return fallback;
  }
  return cleaned.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const topicKey = (value, fallback) =>
  formatTopicLabel(value, fallback).toLowerCase();

const AquaBlogComponnet = ({ initialBlogs = [], initialError = "" }) => {
  const router = useRouter();
  const [blogs, setBlogs] = useState(initialBlogs);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const [error, setError] = useState(initialError);

  useEffect(() => {
    setBlogs(initialBlogs);
  }, [initialBlogs]);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  const handleRetry = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await BlogServiceOperations.AllBlogs();
      setBlogs(response?.data?.data || []);
    } catch (fetchError) {
      console.error("Retry fetching blogs failed", fetchError);
      setError("Unable to load blogs at the moment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const topics = useMemo(() => {
    const unique = new Map();
    blogs.forEach((item) => {
      const fallback = item?.title || item?.heading || item?.slug || "Featured";
      if (Array.isArray(item.tags)) {
        item.tags.filter(Boolean).forEach((tag) => {
          const label = formatTopicLabel(tag, fallback);
          const key = label.toLowerCase();
          if (!unique.has(key)) unique.set(key, label);
        });
      }
      if (item?.category) {
        const label = formatTopicLabel(item.category, fallback);
        const key = label.toLowerCase();
        if (!unique.has(key)) unique.set(key, label);
      }
    });
    return ["All", ...Array.from(unique.values()).slice(0, 12)];
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const byTopic =
      topic === "All"
        ? blogs
        : blogs.filter((item) => {
            const fallback =
              item?.title || item?.heading || item?.slug || "Featured";
            const targetKey = topic.toLowerCase();
            if (
              Array.isArray(item.tags) &&
              item.tags.some((tag) => topicKey(tag, fallback) === targetKey)
            ) {
              return true;
            }
            const categoryMatch =
              item?.category && topicKey(item.category, fallback) === targetKey;
            return Boolean(categoryMatch);
          });

    if (!query.trim()) return byTopic;
    const lower = query.trim().toLowerCase();
    return byTopic.filter((item) => {
      const title = item?.title?.toLowerCase() || "";
      const excerpt =
        item?.shortDescription?.toLowerCase() ||
        item?.description?.replace(/<[^>]+>/g, " ").toLowerCase() ||
        "";
      return title.includes(lower) || excerpt.includes(lower);
    });
  }, [blogs, query, topic]);

  const featured = useMemo(() => filteredBlogs.slice(0, 3), [filteredBlogs]);
  const moreStories = useMemo(() => filteredBlogs.slice(3), [filteredBlogs]);

  const toPlainText = (html) =>
    typeof html === "string"
      ? html
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

  const buildBlogCard = (post, variant = "featured") => {
    const id = post?._id ?? post?.id;
    const href = id ? `/blog/${id}` : "/blogs";
    const image =
      post?.photos?.[0]?.secure_url ||
      post?.titleImages?.[0]?.secure_url ||
      null;
    const readTime = computeReadingTime(
      post?.description || post?.content || "",
    );
    const dateLabel = formatDate(post?.createdAt || post?.publishedAt);
    const topicLabel = formatTopicLabel(post?.category, "Insight");
    const excerpt =
      post?.shortDescription ||
      toPlainText(post?.description)?.slice(
        0,
        variant === "featured" ? 160 : 120,
      ) ||
      "Dive into Aquakart’s perspective on water treatment.";

    return (
      <Link
        key={id || post?.title || Math.random()}
        href={href}
        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300/50 hover:bg-white/80 ${
          variant === "featured" ? "" : "sm:text-sm"
        }`}
      >
        <div
          className={`relative overflow-hidden bg-slate-100 ${variant === "featured" ? "h-56" : "h-48"}`}
        >
          {image ? (
            <Image
              src={image}
              alt={post?.title || "Aquakart blog"}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
              <BookOpenIcon className="w-12 h-12 text-indigo-300" />
            </div>
          )}

          {/* Glass Overlay on Image Bottom */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/20">
                {topicLabel}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">
              {readTime} min
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {dateLabel}
          </div>

          <h3 className="mb-3 text-lg font-bold leading-tight text-slate-900 transition-colors group-hover:text-emerald-700">
            {post?.title || "Untitled story"}
          </h3>

          <p
            className={`mb-6 text-sm leading-relaxed text-slate-600 ${variant === "featured" ? "line-clamp-3" : "line-clamp-2"}`}
          >
            {excerpt}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-slate-200/50 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700">
                  AQ
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Aquakart Team
              </span>
            </div>

            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 opacity-60 transition-opacity group-hover:opacity-100">
              Read Article <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    );
  };

  const seoData = {
    title: "Aquakart | Water Wisdom & Insights",
    description:
      "Explore expert guides, maintenance tips, and latest trends in water softeners and purification technology.",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    keywords:
      "Aquakart blog, water softeners, water filters, purification guide, water hardness tips",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
  };

  const schemaBlogs = useMemo(
    () => (blogs.length ? blogs : initialBlogs),
    [blogs, initialBlogs],
  );

  return (
    <AquaLayout seo={seoData} blogListData={schemaBlogs}>
      {/* Global Background */}
      <div className="fixed inset-0 bg-slate-50 z-[-1]">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-300/20 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="mb-16 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 backdrop-blur-md mb-6 shadow-sm">
            <SparklesIcon className="w-4 h-4" /> Water Wisdom
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Insights on{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Pure Water.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Expert guides, technical deep-dives, and success stories to help you
            master your home's water quality.
          </p>
        </header>

        {/* Search & Filter Glass Bar */}
        <div className="sticky top-24 z-30 mb-12 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="mx-auto max-w-4xl rounded-2xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-lg shadow-slate-200/50 p-2 sm:p-3 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search for hard water, maintenance..."
                className="h-12 w-full rounded-xl border-none bg-slate-50/80 pl-11 pr-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 px-1 sm:px-0">
              {topics.map((item) => (
                <button
                  key={item}
                  onClick={() => setTopic(item)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                    topic === item
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-96 rounded-3xl bg-white/50 animate-pulse border border-white/60"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 rounded-3xl border border-rose-100 bg-rose-50/50">
            <p className="text-rose-600 font-semibold">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 text-sm underline text-rose-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border border-dashed border-slate-300 bg-white/30">
            <p className="text-slate-500 font-medium">
              No stories found matching your criteria.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setTopic("All");
              }}
              className="mt-2 text-sm text-emerald-600 font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            <section>
              <div className="mb-6 flex items-center gap-2">
                <span className="h-8 w-1 rounded-full bg-emerald-500" />
                <h2 className="text-xl font-bold text-slate-900">
                  Latest Stories
                </h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((post) => buildBlogCard(post, "featured"))}
              </div>
            </section>

            {moreStories.length > 0 && (
              <section>
                <div className="mb-6 flex items-center gap-2">
                  <span className="h-8 w-1 rounded-full bg-indigo-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    More Insights
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {moreStories.map((post) => buildBlogCard(post, "compact"))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AquaLayout>
  );
};

export default AquaBlogComponnet;
