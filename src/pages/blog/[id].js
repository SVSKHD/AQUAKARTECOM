import AquaDynamicBlogComponent from "@/pageComponents/blogs/dynamicBlog";
import BlogServiceOperations from "@/services/blog";
import { getManagedSeoServerSide } from "@/services/seo";
import { getManagedSeoEntityKey } from "@/utils/managedSeo";

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
    const response = await BlogServiceOperations.blogBySlug(id);
    const blog = response?.data?.data;

    if (!blog) {
      return { notFound: true };
    }

    const pageKey = getManagedSeoEntityKey(
      "blog",
      blog?.slug || blog?.title || id,
    );
    const managedSeo = pageKey
      ? await getManagedSeoServerSide(pageKey)
      : null;

    return {
      props: {
        initialBlog: blog,
        initialRelated: response?.data?.relatedProduct || [],
        initialError: "",
        managedSeo,
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
        managedSeo: null,
      },
    };
  }
};

export default AquaBlogIndex;
