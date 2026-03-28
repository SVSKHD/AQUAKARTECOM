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
  ArrowRightIcon,
  CalendarIcon,
  ShareIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  GlobeAltIcon,
  HashtagIcon,
} from "@heroicons/react/24/outline";
import AquaProductCard from "@/components/cards/productCard";
import Link from "next/link";
import Image from "next/image";
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
  const [showShareMenu, setShowShareMenu] = useState(false);

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
        month: "long",
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
    setShowShareMenu(false);
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
    blog?.title || "Story",
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
      {/* Global Background */}
      <div className="fixed inset-0 bg-slate-50 z-[-1]">
        <div className="absolute top-[0%] left-[0%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] rounded-full bg-indigo-100/40 blur-[120px]" />
      </div>

      <div className="relative min-h-screen">
        <div
          className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-slate-100/50"
          aria-hidden="true"
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          {/* Breadcrumb / Navigation */}
          <div className="mb-8 flex items-center gap-2 text-sm font-medium">
            <Link
              href="/blogs"
              className="text-slate-500 hover:text-emerald-600 transition-colors"
            >
              Insights
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-emerald-700 font-semibold">
              {categoryLabel}
            </span>
          </div>

          <div className="mx-auto text-center max-w-4xl">
            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-4 w-32 mx-auto bg-slate-200 rounded-full" />
                <div className="h-12 w-3/4 mx-auto bg-slate-200 rounded-xl" />
                <div className="h-6 w-1/2 mx-auto bg-slate-200 rounded-full" />
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-12 backdrop-blur-sm">
                <p className="text-rose-600 font-semibold">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-full text-sm font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 backdrop-blur-md shadow-sm mb-6">
                  <SparklesIcon className="h-4 w-4" />
                  {categoryLabel}
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-tight mb-8">
                  {blog.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm font-medium text-slate-500 mb-12">
                  {publishedDate && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-emerald-500" />
                      {publishedDate}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-emerald-500" />
                    {estimatedReadMinutes} min read
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-2 hover:text-emerald-600 transition-colors"
                    >
                      <ShareIcon className="w-5 h-5 text-emerald-500" />
                      Share
                    </button>

                    {showShareMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/50 bg-white/80 backdrop-blur-xl shadow-xl z-50 overflow-hidden">
                        <div className="p-1 flex flex-col gap-1">
                          <button
                            onClick={() => handleShare("whatsapp")}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors text-left w-full"
                          >
                            <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4" />
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleShare("facebook")}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left w-full"
                          >
                            <GlobeAltIcon className="w-4 h-4" />
                            Facebook
                          </button>
                          <button
                            onClick={() => handleShare("twitter")}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-left w-full"
                          >
                            <HashtagIcon className="w-4 h-4" />X (Twitter)
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                          <button
                            onClick={() => {
                              copyToClipboard();
                              setShowShareMenu(false);
                            }}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left w-full"
                          >
                            {copied ? (
                              <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            )}
                            {copied ? "Copied!" : "Copy Link"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!loading && !error && (
            <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
              <article className="min-w-0">
                {/* Main Image with Glass Effect */}
                <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] shadow-2xl mb-12 group">
                  <AquaImage
                    customClass="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={
                      blog?.titleImages?.[0]?.secure_url || "/default-image.jpg"
                    }
                    alt={blog.title}
                    width={1280}
                    height={720}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <p className="text-white/90 text-xs font-medium flex items-center gap-2">
                      <CameraIcon className="w-4 h-4" /> Aquakart Editorial
                    </p>
                  </div>
                </div>

                <div
                  ref={contentRef}
                  className="prose prose-lg prose-slate max-w-none 
                    prose-headings:font-bold prose-headings:text-slate-900 
                    prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-3 prose-h2:text-3xl
                    prose-h3:mt-8 prose-h3:mb-4 prose-h3:text- emerald-900 prose-h3:text-2xl
                    prose-p:text-slate-600 prose-p:leading-8 prose-p:my-6
                    prose-a:text-emerald-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                    prose-strong:font-extrabold prose-strong:text-slate-900
                    prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
                    prose-li:my-2 prose-li:marker:text-emerald-500 prose-li:text-slate-700
                    prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-8
                    prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50/50 prose-blockquote:px-8 prose-blockquote:py-6 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:text-slate-700 prose-blockquote:shadow-sm"
                  dangerouslySetInnerHTML={{ __html: blog.description }}
                />

                {/* Key Highlights Glass Card */}
                {keyHighlights.length > 0 && (
                  <div className="mt-12 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-8 shadow-sm backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
                      <SparklesIcon className="w-6 h-6 text-emerald-600" />
                      Key Takeaways
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {keyHighlights.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                          <p className="text-sm font-medium text-emerald-800 leading-snug">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              {/* Sticky Sidebar */}
              <aside className="space-y-8 lg:sticky lg:top-32 lg:h-fit lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto no-scrollbar">
                {/* TOC Glass Card */}
                {toc.length > 0 && (
                  <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Contents
                    </h3>
                    <nav className="flex flex-col gap-1">
                      {toc.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={`text-sm font-medium transition-all duration-200 py-1.5 px-3 rounded-lg block truncate
                                    ${item.level === "h3" ? "pl-6 text-slate-500" : "text-slate-700"}
                                    hover:bg-emerald-50 hover:text-emerald-700
                                    `}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}

                {/* Related Products */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    Recommended Gear
                  </h3>
                  <div className="space-y-4">
                    {related.length > 0 ? (
                      related.map((item, idx) => (
                        <div
                          key={idx}
                          className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"
                        >
                          <AquaProductCard product={item} />
                        </div>
                      ))
                    ) : (
                      <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center text-sm text-slate-500">
                        No specific recommendations for this article yet.
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>

        {progress > 10 && (
          <button
            type="button"
            onClick={handleScrollToTop}
            className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/30 transition hover:scale-110 hover:bg-emerald-600"
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
