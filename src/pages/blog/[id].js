import AquaDynamicBlogComponent from "@/pageComponents/blogs/dynamicBlog";
import BlogServiceOperations from "@/services/blog";

const AquaBlogIndex = ({ initialBlog, initialRelated, initialError }) => (
  <AquaDynamicBlogComponent
    initialBlog={initialBlog}
    initialRelated={initialRelated}
    initialError={initialError}
  />
);

export const getServerSideProps = async ({ params }) => {
  const { id } = params || {};

  if (!id) {
    return { notFound: true };
  }

  try {
    const response = await BlogServiceOperations.blogById(id);
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
