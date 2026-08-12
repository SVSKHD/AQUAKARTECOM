import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import AquaLayout from "@/components/Layout/Layout";
import LazyImage from "@/components/image/LazyImage";
import BlogServiceOperations from "@/services/blog";
import styles from "@/styles/knowledge.module.css";

const stripHtml = (value = "") =>
  typeof value === "string"
    ? value
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

const computeReadingTime = (content) => {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 200));
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const looksLikeId = (value = "") =>
  value.replace(/[^0-9a-f]/gi, "").length >= 16;

const formatTopic = (value, fallback = "Water guide") => {
  if (!value || typeof value !== "string") return fallback;
  const cleaned = value.replace(/[._-]+/g, " ").trim();
  if (!cleaned || looksLikeId(cleaned)) return fallback;
  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getPostImage = (post = {}) =>
  post?.photos?.[0]?.secure_url ||
  post?.titleImages?.[0]?.secure_url ||
  post?.image?.secure_url ||
  "";

const getPostHref = (post = {}) => {
  const reference = post.slug || post._id || post.id;
  return reference ? `/blog/${encodeURIComponent(reference)}` : "/blogs";
};

const getExcerpt = (post = {}, length = 155) =>
  (
    post.shortDescription ||
    stripHtml(post.description || post.content) ||
    "Practical guidance from Aquakart for making better water decisions."
  ).slice(0, length);

const getTopicValues = (post = {}) =>
  [...(Array.isArray(post.tags) ? post.tags : []), post.category].filter(
    Boolean,
  );

const ArticleImage = ({ post, priority = false }) => {
  const image = getPostImage(post);

  return image ? (
    <LazyImage
      src={image}
      alt={post?.title || "Aquakart water guide"}
      className={styles.imageFill}
      fill
      priority={priority}
      sizes={
        priority
          ? "(max-width: 800px) 100vw, 58vw"
          : "(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
      }
      imgClassName={styles.articleImage}
    />
  ) : (
    <div className={styles.imageFallback}>
      <BookOpenIcon />
      <span>Aquakart knowledge</span>
    </div>
  );
};

const ArticleCard = ({ post }) => (
  <Link href={getPostHref(post)} className={styles.articleCard}>
    <div className={styles.cardImage}>
      <ArticleImage post={post} />
      <span className={styles.topicBadge}>
        {formatTopic(post.category, "Water guide")}
      </span>
    </div>
    <div className={styles.cardBody}>
      <div className={styles.articleMeta}>
        <span>{formatDate(post.createdAt || post.publishedAt)}</span>
        <span>
          {computeReadingTime(post.description || post.content)} min read
        </span>
      </div>
      <h3>{post.title || "Aquakart water guide"}</h3>
      <p>{getExcerpt(post, 125)}</p>
      <span className={styles.readLink}>
        Read guide <ArrowRightIcon />
      </span>
    </div>
  </Link>
);

const AquaBlogComponent = ({
  initialBlogs = [],
  initialError = "",
  managedSeo = null,
}) => {
  const router = useRouter();
  const [blogs, setBlogs] = useState(initialBlogs);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const topics = useMemo(() => {
    const unique = new Map();
    blogs.forEach((post) => {
      getTopicValues(post).forEach((value) => {
        const label = formatTopic(value, post.title || "Guide");
        unique.set(label.toLowerCase(), label);
      });
    });
    return ["All", ...Array.from(unique.values()).slice(0, 8)];
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return blogs.filter((post) => {
      const matchesTopic =
        topic === "All" ||
        getTopicValues(post).some(
          (value) =>
            formatTopic(value, post.title || "Guide").toLowerCase() ===
            topic.toLowerCase(),
        );
      const searchable =
        `${post.title || ""} ${getExcerpt(post, 500)}`.toLowerCase();
      return matchesTopic && (!search || searchable.includes(search));
    });
  }, [blogs, query, topic]);

  const featuredPost = filteredBlogs[0];
  const remainingPosts = filteredBlogs.slice(1);

  const handleRetry = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await BlogServiceOperations.AllBlogs();
      setBlogs(response?.data?.data || []);
    } catch {
      setError("We could not load the knowledge library. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setTopic("All");
  };

  const seoData = {
    title: "Know More | Aquakart Water Knowledge",
    description:
      "Clear, practical guides about hard water, water softeners, RO purifiers, filtration and maintenance from Aquakart.",
    canonical: `${process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in"}${router.asPath}`,
    keywords:
      "water guides, hard water advice, water softener guide, RO purifier maintenance, Aquakart knowledge",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
  };

  return (
    <AquaLayout seo={seoData} blogListData={blogs} managedSeo={managedSeo}>
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>Aquakart knowledge</span>
              <h1>
                Understand your water.
                <span>Choose with confidence.</span>
              </h1>
              <p>
                Straightforward guidance on hard water, purification,
                maintenance and choosing the right system for your home.
              </p>
            </div>
            <div className={styles.heroFacts}>
              <div>
                <CheckBadgeIcon />
                <span>
                  <strong>Expert reviewed</strong>
                  Practical, product-aware advice
                </span>
              </div>
              <div>
                <WrenchScrewdriverIcon />
                <span>
                  <strong>Built for real homes</strong>
                  Indian water conditions explained
                </span>
              </div>
            </div>
          </header>

          <section className={styles.discovery} aria-label="Find a water guide">
            <label className={styles.search}>
              <MagnifyingGlassIcon />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search hard water, RO, filters, maintenance..."
                aria-label="Search water guides"
              />
            </label>
            <div className={styles.topicList}>
              {topics.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTopic(item)}
                  className={topic === item ? styles.activeTopic : ""}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {loading ? (
            <div className={styles.loadingGrid} aria-label="Loading guides">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} />
              ))}
            </div>
          ) : error ? (
            <section className={styles.emptyState}>
              <BookOpenIcon />
              <h2>Knowledge is temporarily unavailable</h2>
              <p>{error}</p>
              <button type="button" onClick={handleRetry}>
                Try again
              </button>
            </section>
          ) : !featuredPost ? (
            <section className={styles.emptyState}>
              <MagnifyingGlassIcon />
              <h2>No matching guides</h2>
              <p>Try another search or browse every topic.</p>
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </section>
          ) : (
            <>
              <section className={styles.featuredSection}>
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Start here</span>
                    <h2>Featured water guide</h2>
                  </div>
                  <span>{filteredBlogs.length} guides available</span>
                </div>

                <Link
                  href={getPostHref(featuredPost)}
                  className={styles.featuredCard}
                >
                  <div className={styles.featuredImage}>
                    <ArticleImage post={featuredPost} priority />
                  </div>
                  <div className={styles.featuredBody}>
                    <span className={styles.eyebrow}>
                      {formatTopic(featuredPost.category, "Essential guide")}
                    </span>
                    <h2>{featuredPost.title || "Aquakart water guide"}</h2>
                    <p>{getExcerpt(featuredPost, 210)}</p>
                    <div className={styles.articleMeta}>
                      <span>
                        {formatDate(
                          featuredPost.createdAt || featuredPost.publishedAt,
                        )}
                      </span>
                      <span>
                        {computeReadingTime(
                          featuredPost.description || featuredPost.content,
                        )}{" "}
                        min read
                      </span>
                    </div>
                    <strong className={styles.featuredAction}>
                      Read the complete guide <ArrowRightIcon />
                    </strong>
                  </div>
                </Link>
              </section>

              {remainingPosts.length > 0 && (
                <section className={styles.librarySection}>
                  <div className={styles.sectionHeading}>
                    <div>
                      <span className={styles.eyebrow}>Explore more</span>
                      <h2>Water knowledge library</h2>
                    </div>
                  </div>
                  <div className={styles.articleGrid}>
                    {remainingPosts.map((post) => (
                      <ArticleCard
                        key={post._id || post.id || post.slug || post.title}
                        post={post}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <section className={styles.expertCta}>
            <div>
              <span className={styles.eyebrow}>Need a specific answer?</span>
              <h2>Turn what you learned into the right water solution.</h2>
              <p>
                Tell us about your source water, household and concern. An
                Aquakart expert can help narrow the options.
              </p>
            </div>
            <div>
              <Link href="/contact-us" className={styles.primaryAction}>
                Ask a water expert <ArrowRightIcon />
              </Link>
              <Link href="/softener-planner" className={styles.secondaryAction}>
                Use the softener planner
              </Link>
            </div>
          </section>
        </div>
      </main>
    </AquaLayout>
  );
};

export default AquaBlogComponent;
