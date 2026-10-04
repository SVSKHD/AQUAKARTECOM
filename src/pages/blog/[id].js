import AquaDynamicBlogComponent from "@/pageComponents/blogs/dynamicBlog";
import BlogServiceOperations from "@/services/blog";
import ProductServiceOperations from "@/services/products";
import {
  getCategoryId,
  getCategoryName,
  isObjectId,
} from "@/utils/blogCategory";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const resolveBlogRoute = async (id) => {
  try {
    const bySlug = await BlogServiceOperations.blogBySlug(id);
    if (bySlug?.data?.data) return bySlug;
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
  }

  if (!OBJECT_ID_PATTERN.test(String(id))) return null;
  return BlogServiceOperations.blogById(id);
};

const RELATED_BLOG_LIMIT = 4;

const normalizeTag = (tag) =>
  String(tag || "")
    .trim()
    .toLowerCase();

// No related-blogs endpoint exists, so rank the full list by shared tags and
// category, newest first on ties. Only card fields are sent to keep props small.
const pickRelatedBlogs = (allBlogs = [], blog) => {
  const tags = new Set((blog.tags || []).map(normalizeTag).filter(Boolean));
  const categoryId = getCategoryId(blog.category);

  return allBlogs
    .filter((post) => post?._id && post._id !== blog._id)
    .map((post) => {
      const sharedTags = (post.tags || []).filter((tag) =>
        tags.has(normalizeTag(tag)),
      ).length;
      const sameCategory =
        categoryId && getCategoryId(post.category) === categoryId ? 1 : 0;
      return { post, score: sharedTags * 2 + sameCategory };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.createdAt || 0) - new Date(a.post.createdAt || 0),
    )
    .slice(0, RELATED_BLOG_LIMIT)
    .map(({ post }) => ({
      _id: post._id,
      slug: post.slug || null,
      title: post.title || "Untitled",
      excerpt: (
        post.shortDescription ||
        String(post.description || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
      )
        .trim()
        .slice(0, 140),
      image:
        post.titleImages?.[0]?.secure_url ||
        post.photos?.[0]?.secure_url ||
        null,
      createdAt: post.createdAt || null,
      tags: (post.tags || [])
        .filter((tag) => tag && !isObjectId(tag))
        .slice(0, 2),
    }));
};

// `blog.product` is set in the admin as a product id (or, in future, several
// ids / populated objects). Resolve each to a full product; ids whose product
// was deleted are skipped.
const resolveAttachedProducts = async (blog) => {
  const entries = (
    Array.isArray(blog.product) ? blog.product : [blog.product]
  ).filter(Boolean);
  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      if (typeof entry === "object" && entry.title) return entry;
      const productId = typeof entry === "object" ? entry._id : entry;
      if (!productId) return null;
      const response = await ProductServiceOperations.ProductById(productId);
      return response?.data?.success ? response.data.data : null;
    }),
  );

  const seen = new Set();
  return results
    .map((result) => (result.status === "fulfilled" ? result.value : null))
    .filter(
      (product) =>
        product?._id && !seen.has(product._id) && seen.add(product._id),
    );
};

const AquaBlogIndex = ({
  initialBlog,
  initialRelated,
  initialAttached,
  initialRelatedBlogs,
  initialError,
}) => (
  <AquaDynamicBlogComponent
    initialBlog={initialBlog}
    initialRelated={initialRelated}
    initialAttached={initialAttached}
    initialRelatedBlogs={initialRelatedBlogs}
    initialError={initialError}
  />
);

export const getServerSideProps = async ({ params, res }) => {
  const { id } = params || {};

  if (!id) {
    return { notFound: true };
  }

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=900",
  );

  try {
    const response = await resolveBlogRoute(id);
    const blog = response?.data?.data;

    if (!blog) {
      return { notFound: true };
    }

    // The slug endpoint omits relatedProduct; only the by-id endpoint has it.
    // Fetch that and the blog list together; either failing only hides its section.
    let relatedProducts = response?.data?.relatedProduct;
    const [byIdResult, allBlogsResult, attachedResult] =
      await Promise.allSettled([
        !Array.isArray(relatedProducts) && blog._id
          ? BlogServiceOperations.blogById(blog._id)
          : Promise.resolve(null),
        BlogServiceOperations.AllBlogs(),
        resolveAttachedProducts(blog),
      ]);
    const attachedProducts =
      attachedResult.status === "fulfilled" ? attachedResult.value : [];

    if (byIdResult.status === "fulfilled" && byIdResult.value) {
      relatedProducts = byIdResult.value?.data?.relatedProduct;
    } else if (byIdResult.status === "rejected") {
      console.error(
        `Failed to fetch related products for blog ${blog._id}:`,
        byIdResult.reason?.message || byIdResult.reason,
      );
    }

    let relatedBlogs = [];
    let resolvedBlog = blog;
    if (allBlogsResult.status === "fulfilled") {
      const allBlogs = allBlogsResult.value?.data?.data || [];
      relatedBlogs = pickRelatedBlogs(allBlogs, blog);

      // The single-blog endpoints return category as a bare id; the list has
      // it populated, so borrow the name from there.
      if (!getCategoryName(blog.category)) {
        const listed = allBlogs.find((post) => post?._id === blog._id);
        if (getCategoryName(listed?.category)) {
          resolvedBlog = { ...blog, category: listed.category };
        }
      }
    } else {
      console.error(
        "Failed to fetch blogs for related articles:",
        allBlogsResult.reason?.message || allBlogsResult.reason,
      );
    }

    return {
      props: {
        initialBlog: resolvedBlog,
        initialAttached: attachedProducts,
        // Don't repeat attached products in the "related" carousel.
        initialRelated: (Array.isArray(relatedProducts)
          ? relatedProducts
          : []
        ).filter(
          (product) =>
            !attachedProducts.some((attached) => attached._id === product?._id),
        ),
        initialRelatedBlogs: relatedBlogs,
        initialError: "",
      },
    };
  } catch (error) {
    console.error(
      `Failed to fetch blog ${id} on server:`,
      error?.message || error,
    );

    if (error?.response?.status === 404) {
      return { notFound: true };
    }

    return {
      props: {
        initialBlog: null,
        initialRelated: [],
        initialAttached: [],
        initialRelatedBlogs: [],
        initialError:
          "We couldn't load this story. Please refresh and try again.",
      },
    };
  }
};

export default AquaBlogIndex;
