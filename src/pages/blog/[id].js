import AquaDynamicBlogComponent from "@/pageComponents/blogs/dynamicBlog";
import BlogServiceOperations from "@/services/blog";

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

const AquaBlogIndex = ({ initialBlog, initialRelated, initialError }) => (
  <AquaDynamicBlogComponent
    initialBlog={initialBlog}
    initialRelated={initialRelated}
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

    return {
      props: {
        initialBlog: blog,
        initialRelated: response?.data?.relatedProduct || [],
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
        initialError:
          "We couldn't load this story. Please refresh and try again.",
      },
    };
  }
};

export default AquaBlogIndex;
