import AquaBlogComponnet from "@/pageComponents/blogs";
import BlogServiceOperations from "@/services/blog";
import { getManagedSeoServerSide } from "@/services/seo";

const AquaBlogIndex = ({ initialBlogs, initialError, managedSeo }) => {
  return (
    <AquaBlogComponnet
      initialBlogs={initialBlogs}
      initialError={initialError}
      managedSeo={managedSeo}
    />
  );
};

export const getServerSideProps = async () => {
  try {
    const [response, managedSeo] = await Promise.all([
      BlogServiceOperations.AllBlogs(),
      getManagedSeoServerSide("blogs"),
    ]);
    const blogs = Array.isArray(response?.data?.data) ? response.data.data : [];

    return {
      props: {
        initialBlogs: blogs,
        initialError: "",
        managedSeo,
      },
    };
  } catch (error) {
    console.error("Failed to fetch blogs on server:", error?.message || error);

    return {
      props: {
        initialBlogs: [],
        initialError: "Unable to load blogs at the moment. Please try again.",
        managedSeo: await getManagedSeoServerSide("blogs"),
      },
    };
  }
};

export default AquaBlogIndex;
