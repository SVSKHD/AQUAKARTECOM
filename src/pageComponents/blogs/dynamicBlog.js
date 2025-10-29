import { useEffect, useMemo, useRef, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import BlogServiceOperations from "@/services/blog";
import {
  CameraIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/20/solid";
import {
  ArrowUpIcon,
  ClockIcon,
  LinkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Head from "next/head";
import AquaProductCard from "@/components/cards/productCard";
import Link from "next/link";

import AquaImage from "@/components/images/AquaImage";

const AquaDynamicBlogComponent = ({
  initialBlog = null,
  initialRelated = [],
  initialError = "",
}) => {
  const router = useRouter();
  const { id } = router.query;
  const [blog, setBlog] = useState(initialBlog);
  const [related, setRelated] = useState(initialRelated);
  const [loading, setLoading] = useState(!initialBlog && !initialError);
  const [error, setError] = useState(initialError);
  const [toc, setToc] = useState([]);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const contentRef = useRef(null);

  useEffect(() => {
    setBlog(initialBlog);
    setRelated(initialRelated);
    setError(initialError);
    setLoading(!initialBlog && !initialError);
  }, [initialBlog, initialRelated, initialError]);

  useEffect(() => {
    if (
      !blog?.description ||
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
  }, [blog?.description]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      if (!contentRef.current) return;
      const element = contentRef.current;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(
        elementTop + elementHeight - viewportHeight,
        0,
      );
      const currentScroll = Math.min(
        Math.max(window.scrollY - elementTop, 0),
        maxScroll,
      );
      const ratio = maxScroll > 0 ? currentScroll / maxScroll : 1;
      setProgress(Math.min(Math.max(ratio * 100, 0), 100));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [blog?.description]);

  const estimatedReadMinutes = useMemo(() => {
    if (!blog?.description) return 3;
    const text = blog.description.replace(/<[^>]+>/g, " ");
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [blog?.description]);

  const publishedDate = useMemo(() => {
    if (!blog?.createdAt) return "";
    try {
      return new Date(blog.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }, [blog?.createdAt]);

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

  const handleScrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = async () => {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const response = await BlogServiceOperations.blogById(id);
      setBlog(response?.data?.data || null);
      setRelated(response?.data?.relatedProduct || []);
      setError("");
    } catch (fetchError) {
      console.error("Retry fetching blog failed", fetchError);
      setBlog(null);
      setError("We couldn't load this story. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  const seoData = {
    title: `${blog?.title || "Blog"} | Aquakart`,
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    image: blog?.titleImages?.[0]?.secure_url || "",
    keywords: `Aquakart Product | ${blog?.title || "Blog"}`,
  };

  const formatTopicLabel = (value, fallback = "Aquakart") => {
    if (!value || typeof value !== "string") return fallback;
    const cleaned = value.replace(/[._-]+/g, " ").trim();
    if (!cleaned) return fallback;
    return cleaned.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const categoryLabel = formatTopicLabel(
    blog?.category,
    blog?.title || "Aquakart",
  );

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

  return (
    <AquaLayout seo={seoData} blogPageData={schemaBlog}>
      <Head>
        <title>{seoData.title}</title>
        <link rel="canonical" href={seoData.canonical} />
        {seoData.image && <meta property="og:image" content={seoData.image} />}
        <meta name="keywords" content={seoData.keywords} />
      </Head>
      <div className="relative bg-white">
        <div
          className="pointer-events-none fixed inset-x-0 top-16 z-40 h-1 bg-emerald-100"
          aria-hidden="true"
        >
          <span
            className="block h-full w-0 bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-100"
            >
              ← Back to insights
            </Link>
            <span className="hidden text-slate-400 sm:inline">/</span>
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-emerald-600 sm:inline">
              {categoryLabel}
            </span>
          </div>

          <div className="mx-auto mt-6 max-w-3xl text-center">
            {loading ? (
              <div className="space-y-4">
                <div className="mx-auto h-10 w-40 animate-pulse rounded-full bg-slate-200" />
                <div className="mx-auto h-12 w-full max-w-xl animate-pulse rounded-lg bg-slate-200" />
                <div className="mx-auto h-6 w-1/2 animate-pulse rounded-full bg-slate-200" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-8 text-left">
                <div className="flex items-center gap-3 text-rose-600">
                  <SparklesIcon className="h-6 w-6" />
                  <p className="text-sm font-semibold">Something went wrong</p>
                </div>
                <p className="mt-3 text-sm text-rose-700">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-transparent bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="space-y-5 rounded-3xl border border-emerald-100 bg-emerald-50/60 px-6 py-8 text-left shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    <SparklesIcon className="h-4 w-4" />
                    {categoryLabel}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-700">
                    {publishedDate && (
                      <span className="inline-flex items-center gap-2">
                        <ClockIcon className="h-4 w-4" />
                        {publishedDate}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4" />
                      {estimatedReadMinutes} min read
                    </span>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      {copied ? (
                        <>
                          <ClipboardDocumentCheckIcon className="h-4 w-4" />
                          Link copied
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-4 w-4" />
                          Share
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Inspiration
                </span>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {blog.title}
                </h1>
                <p className="text-sm text-slate-600">
                  {blog?.excerpt ||
                    blog?.shortDescription ||
                    "Expert guidance to keep every drop of water in your space pure, soft, and reliable."}
                </p>
              </div>
            )}
          </div>

          {!loading && !error && (
            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
              <article
                ref={contentRef}
                className="space-y-10 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100"
              >
                <figure className="overflow-hidden rounded-3xl">
                  <AquaImage
                    customClass="h-full w-full object-cover"
                    src={
                      blog?.titleImages?.[0]?.secure_url || "/default-image.jpg"
                    }
                    alt={blog.title || "Aquakart blog"}
                    width={1280}
                    height={720}
                  />
                  <figcaption className="flex items-center gap-2 px-2 py-3 text-xs text-slate-500">
                    <CameraIcon className="h-4 w-4" aria-hidden="true" />
                    Aquakart Media Team
                  </figcaption>
                </figure>

                <div
                  className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-a:text-emerald-600 hover:prose-a:text-emerald-500"
                  dangerouslySetInnerHTML={{ __html: blog.description }}
                />

                {keyHighlights.length > 0 && (
                  <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 shadow-inner">
                    <h2 className="text-lg font-semibold text-emerald-900">
                      Key takeaways
                    </h2>
                    <ul className="mt-3 space-y-2 text-sm text-emerald-800">
                      {keyHighlights.map((highlight, index) => (
                        <li
                          key={`${highlight}-${index}`}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </article>

              <aside className="flex flex-col gap-8">
                {toc.length > 0 && (
                  <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 text-sm text-slate-600 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-slate-900">
                        On this page
                      </h2>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
                        onClick={handleScrollToTop}
                      >
                        Back to top
                      </button>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {toc.map((item) => (
                        <li key={item.id} className="leading-snug">
                          <a
                            href={`#${item.id}`}
                            className={`inline-flex items-start gap-2 rounded-lg px-2 py-1 transition hover:bg-white hover:text-emerald-600 ${
                              item.level === "h3" ? "pl-4 text-xs" : "text-sm"
                            }`}
                          >
                            <LinkIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{item.text}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Related products
                    </h2>
                    <span className="text-xs font-medium text-slate-500">
                      Curated for this guide
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Explore systems featured or recommended in this article.
                  </p>
                  {related.length > 0 ? (
                    <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-1 sm:gap-4 sm:overflow-visible sm:pb-0">
                      {related.map((item, index) => (
                        <div
                          key={item?._id || `${item?.name}-${index}`}
                          className="min-w-[260px] snap-start sm:min-w-0"
                        >
                          <AquaProductCard product={item} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                      We’ll update this section when matching products are
                      available.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>

        {progress > 10 && (
          <button
            type="button"
            onClick={handleScrollToTop}
            className="fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-400"
            aria-label="Back to top"
          >
            <ArrowUpIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </AquaLayout>
  );
};

export default AquaDynamicBlogComponent;
