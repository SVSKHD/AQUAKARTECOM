import { useEffect, useMemo, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import BlogServiceOperations from "@/services/blog";
import AQ from "@/assests/logo-white.png";
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

const AquaBlogComponnet = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    BlogServiceOperations.AllBlogs()
      .then((res) => {
        if (!isMounted) return;
        setBlogs(res.data.data || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load blogs at the moment. Please try again.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const topics = useMemo(() => {
    const unique = new Set();
    blogs.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.filter(Boolean).forEach((tag) => unique.add(tag));
      } else if (item.category) {
        unique.add(item.category);
      }
    });
    return ["All", ...Array.from(unique).slice(0, 12)];
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const byTopic = topic === "All"
      ? blogs
      : blogs.filter((item) => {
          if (Array.isArray(item.tags) && item.tags.includes(topic)) return true;
          return item.category === topic;
        });

    if (!query.trim()) return byTopic;

    const lower = query.trim().toLowerCase();
    return byTopic.filter((item) => {
      const title = item?.title?.toLowerCase() || "";
      const excerpt = item?.shortDescription?.toLowerCase() || item?.description?.replace(/<[^>]+>/g, " ").toLowerCase() || "";
      return title.includes(lower) || excerpt.includes(lower);
    });
  }, [blogs, query, topic]);

  const featured = useMemo(() => filteredBlogs.slice(0, 3), [filteredBlogs]);
  const moreStories = useMemo(() => filteredBlogs.slice(3), [filteredBlogs]);

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
  return (
    <AquaLayout seo={seoData}>
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
              Explore expert guides, maintenance tips, and success stories to keep your water systems running flawlessly.
            </p>
            <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-lg sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Search articles, products, topics..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  aria-label="Search blogs"
                />
              </div>
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
              {error}
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="mt-14 text-center text-slate-500">
              No articles found. Try a different keyword or filter.
            </div>
          ) : (
            <div className="mt-14 space-y-16">
              <section>
                <h2 className="text-lg font-semibold text-slate-900">Featured reads</h2>
                <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((post) => {
                    const image = post?.photos?.[0]?.secure_url || post?.titleImages?.[0]?.secure_url;
                    const readTime = computeReadingTime(post?.description || post?.content || "");
                    const dateLabel = formatDate(post?.createdAt || post?.publishedAt);

                    return (
                      <article
                        key={post?._id || post?.id}
                        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative h-48 overflow-hidden">
                          {image ? (
                            <Image
                              src={image}
                              alt={post?.title || "Aquakart blog"}
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                              priority={false}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
                              Image coming soon
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-4 p-6">
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {dateLabel && <span>{dateLabel}</span>}
                            <span>•</span>
                            <span>{readTime} min read</span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            <Link href={`/blog/${post?._id ?? post?.id}`}>
                              <span className="absolute inset-0" />
                              {post?.title || "Untitled story"}
                            </Link>
                          </h3>
                          <p className="line-clamp-3 text-sm text-slate-600">
                            {post?.shortDescription ||
                              post?.description?.replace(/<[^>]+>/g, " ")?.slice(0, 160) ||
                              "Dive into AquaKart’s perspective on water treatment."}
                          </p>
                          <div className="mt-auto">
                            <Link
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
                              href={`/blog/${post?._id ?? post?.id}`}
                            >
                              Continue reading
                              <span aria-hidden="true">→</span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {moreStories.length > 0 && (
                <section>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">More stories</h2>
                    <Link
                      href="#top"
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                    >
                      Back to top
                    </Link>
                  </div>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {moreStories.map((post) => {
                      const image = post?.photos?.[0]?.secure_url || post?.titleImages?.[0]?.secure_url;
                      const readTime = computeReadingTime(post?.description || post?.content || "");
                      const dateLabel = formatDate(post?.createdAt || post?.publishedAt);

                      return (
                        <article
                          key={post?._id || post?.id}
                          className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                          <div className="relative h-40 overflow-hidden">
                            {image ? (
                              <Image
                                src={image}
                                alt={post?.title || "Aquakart blog"}
                                fill
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="object-cover transition duration-500 hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-400">
                                Image coming soon
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-3 p-5">
                            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-slate-500">
                              {dateLabel && <span>{dateLabel}</span>}
                              <span>•</span>
                              <span>{readTime} min read</span>
                            </div>
                            <h3 className="text-base font-semibold text-slate-900">
                              <Link href={`/blog/${post?._id ?? post?.id}`}>
                                <span className="absolute inset-0" />
                                {post?.title || "Untitled story"}
                              </Link>
                            </h3>
                            <p className="line-clamp-2 text-sm text-slate-600">
                              {post?.shortDescription ||
                                post?.description?.replace(/<[^>]+>/g, " ")?.slice(0, 120) ||
                                "Quick takeaways from Aquakart’s experts."}
                            </p>
                            <div className="mt-auto flex items-center justify-between pt-2">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Image
                                  src={AQ}
                                  alt="Aquakart"
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 rounded-full bg-slate-100"
                                />
                                Aquakart Team
                              </div>
                              <Link
                                href={`/blog/${post?._id ?? post?.id}`}
                                className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                              >
                                Read →
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
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
