import { useEffect, useMemo, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import BlogServiceOperations from "@/services/blog";
import Image from "next/image";
import { useRouter } from "next/router";
import Link from "next/link";

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
      month: "short",
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

const formatTopicLabel = (value, fallback = "Featured") => {
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
    const topicLabel = formatTopicLabel(post?.category, post?.title || "story");
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
        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
          variant === "featured" ? "" : "sm:text-sm"
        }`}
      >
        <div
          className={`relative overflow-hidden ${variant === "featured" ? "h-48" : "h-40"}`}
        >
          {image ? (
            <Image
              src={image}
              alt={post?.title || "Aquakart blog"}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
              Image coming soon
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/80 to-transparent px-4 pb-3 pt-6 text-xs font-semibold uppercase tracking-wide text-white/80">
            <span>{topicLabel}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white">
              {readTime} min read
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {dateLabel && <span>{dateLabel}</span>}
            {dateLabel && <span>•</span>}
            <span>Insights</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-emerald-600">
            {post?.title || "Untitled story"}
          </h3>
          <p
            className={`${variant === "featured" ? "line-clamp-3" : "line-clamp-2"} text-sm text-slate-600`}
          >
            {excerpt}
          </p>
          <div className="mt-auto flex items-center justify-between text-sm text-emerald-600">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
              Aquakart Team
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold">
              Read article
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </Link>
    );
  };

  const seoData = {
    title: "Aquakart | Know More About Water Softeners and Filters",
    description:
      "Aquakart's product comparison tool empowers shoppers to make informed decisions by offering side-by-side comparisons of features, prices, and customer reviews. Easily evaluate multiple products, discover the best deals, and find the perfect fit for your needs.",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    keyords:
      "Aquakart kent softeners, sand-filters, iron-filters, water purifiers, water filters, households",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
  };
  const schemaBlogs = useMemo(
    () => (blogs.length ? blogs : initialBlogs),
    [blogs, initialBlogs],
  );

  return (
    <AquaLayout seo={seoData} blogListData={schemaBlogs}>
      <div className="relative bg-white">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8">
          <header id="top" className="space-y-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Latest water wisdom
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Insights on water care, softeners, and filtration
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600">
              Explore expert guides, maintenance tips, and success stories to
              keep your water systems running flawlessly.
            </p>
            <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-lg sm:flex-row sm:items-start">
              <div className="relative flex w-full sm:w-52">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Search articles, products, topics..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  aria-label="Search blogs"
                />
              </div>
              {query.trim() && filteredBlogs.length > 0 && (
                <div className="w-full flex-1 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-left text-sm text-emerald-800 shadow-sm">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Matching articles
                  </p>
                  <ul className="space-y-2 overflow-y-auto text-sm max-h-40">
                    {filteredBlogs.slice(0, 6).map((item) => (
                      <li key={item?._id || item?.id} className="truncate">
                        <Link
                          href={`/blog/${item?._id ?? item?.id}`}
                          className="inline-flex items-center gap-2 text-emerald-700 transition hover:text-emerald-500"
                        >
                          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {item?.title || "Untitled story"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {topics.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTopic(item)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${
                      topic === item
                        ? "bg-emerald-500 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {loading ? (
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="h-40 rounded-2xl bg-slate-200" />
                  <div className="h-4 w-24 rounded-full bg-slate-200" />
                  <div className="h-5 w-full rounded-full bg-slate-200" />
                  <div className="h-5 w-3/4 rounded-full bg-slate-200" />
                  <div className="h-8 w-28 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mt-14 rounded-3xl border border-rose-100 bg-rose-50 p-8 text-center text-rose-600">
              <p>{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-transparent bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                Try again
              </button>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="mt-14 text-center text-slate-500">
              No articles found. Try a different keyword or filter.
            </div>
          ) : (
            <div className="mt-14 space-y-16">
              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Featured reads
                </h2>
                <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((post) => buildBlogCard(post, "featured"))}
                </div>
              </section>

              {moreStories.length > 0 && (
                <section>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      More stories
                    </h2>
                    <Link
                      href="#top"
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                    >
                      Back to top
                    </Link>
                  </div>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {moreStories.map((post) => buildBlogCard(post, "compact"))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </AquaLayout>
  );
};
export default AquaBlogComponnet;
