import AquaDynamicCategoryComponent from "@/pageComponents/categories/dynamicCategory";
import CategoryServiceOperations from "@/services/category";

const DynamicAquaCategory = ({ id, category, related }) => (
  <AquaDynamicCategoryComponent
    id={id}
    initialCategory={category}
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
    const categoryResponse = await CategoryServiceOperations.CategoyByTitle(id);
    const category = categoryResponse?.data?.data || null;
    if (!category) return { notFound: true };

    return {
      props: {
        id,
        category,
        related: categoryResponse?.data?.relatedProducts || [],
      },
    };
  } catch (error) {
    console.error(
      `Failed to fetch category "${id}" on server:`,
      error?.message || error,
    );
    if (error?.response?.status === 404) return { notFound: true };

    res.statusCode = 503;
    res.setHeader("Retry-After", "60");
    return {
      props: {
        id,
        category: null,
        related: [],
      },
    };
  }
}

export default DynamicAquaCategory;
