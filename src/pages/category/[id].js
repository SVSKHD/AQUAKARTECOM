import AquaDynamicCategoryComponent from "@/pageComponents/categories/dynamicCategory";
import CategoryServiceOperations from "@/services/category";
import { getManagedSeoServerSide } from "@/services/seo";
import { getManagedSeoEntityKey } from "@/utils/managedSeo";

const DynamicAquaCategory = ({ id, category, related, managedSeo }) => (
  <AquaDynamicCategoryComponent
    id={id}
    initialCategory={category}
    initialRelated={related}
    managedSeo={managedSeo}
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

    const pageKey = getManagedSeoEntityKey("category", category.title || id);
    const managedSeo = pageKey
      ? await getManagedSeoServerSide(pageKey)
      : null;

    return {
      props: {
        id,
        category,
        related: categoryResponse?.data?.relatedProducts || [],
        managedSeo,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch category "${id}" on server:`, error?.message || error);
    if (error?.response?.status === 404) return { notFound: true };
    return { notFound: true };
  }
}

export default DynamicAquaCategory;
