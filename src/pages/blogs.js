import AquaBlogComponnet from "@/pageComponents/blogs";
import BlogServiceOperations from "@/services/blog";

const AquaBlogIndex = ({ initialBlogs, initialError }) => {
  return (
    <AquaBlogComponnet
      initialBlogs={initialBlogs}
      initialError={initialError}
    />
  );
};

export const getServerSideProps = async () => {
  try {
    const response = await BlogServiceOperations.AllBlogs();
    const blogs = Array.isArray(response?.data?.data) ? response.data.data : [];

    return {
      props: {
        initialBlogs: blogs,
        initialError: "",
      },
    };
  } catch (error) {
    console.error("Failed to fetch blogs on server:", error?.message || error);

    return {
      props: {
        initialBlogs: [],
        initialError: "Unable to load blogs at the moment. Please try again.",
      },
    };
  }
};

export default AquaBlogIndex;
