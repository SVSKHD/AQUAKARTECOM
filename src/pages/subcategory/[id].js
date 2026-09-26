import AquaDynamicSubCategoryComponent from "@/pageComponents/subcategories/dynamicSubCategory";
import SubCategoryServiceOperations from "@/services/subcategory";

const DynamicAquaSubCategory = ({ id, subcategory, related }) => (
  <AquaDynamicSubCategoryComponent
    id={id}
    initialCategory={subcategory}
    initialRelated={related}
  />
);

export async function getServerSideProps({ params, res }) {
  const { id } = params || {};
  if (!id) return { notFound: true };

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=900",
  );

  try {
    const response = await SubCategoryServiceOperations.SubCategoryByTitle(id);
    const subcategory = response?.data?.data || null;
    if (!subcategory) return { notFound: true };

    return {
      props: {
        id,
        subcategory,
        related: response?.data?.relatedProducts || [],
      },
    };
  } catch (error) {
    console.error(
      `Failed to fetch subcategory "${id}" on server:`,
      error?.message || error,
    );
    if (error?.response?.status === 404) return { notFound: true };

    res.statusCode = 503;
    res.setHeader("Retry-After", "60");
    return {
      props: {
        id,
        subcategory: null,
        related: [],
      },
    };
  }
}

export default DynamicAquaSubCategory;
