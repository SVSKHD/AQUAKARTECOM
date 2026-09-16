import AquaDynamicSubCategoryComponent from "@/pageComponents/subcategories/dynamicSubCategory";
import SubCategoryServiceOperations from "@/services/subcategory";
import { getManagedSeoServerSide } from "@/services/seo";
import { getManagedSeoEntityKey } from "@/utils/managedSeo";

const DynamicAquaSubCategory = ({ id, subcategory, related, managedSeo }) => (
  <AquaDynamicSubCategoryComponent
    id={id}
    initialCategory={subcategory}
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
    const response = await SubCategoryServiceOperations.SubCategoryByTitle(id);
    const subcategory = response?.data?.data || null;
    if (!subcategory) return { notFound: true };

    const pageKey = getManagedSeoEntityKey(
      "subcategory",
      subcategory.title || id,
    );
    const managedSeo = pageKey
      ? await getManagedSeoServerSide(pageKey)
      : null;

    return {
      props: {
        id,
        subcategory,
        related: response?.data?.relatedProducts || [],
        managedSeo,
      },
    };
  } catch (error) {
    console.error(
      `Failed to fetch subcategory "${id}" on server:`,
      error?.message || error,
    );
    if (error?.response?.status === 404) return { notFound: true };
    return { notFound: true };
  }
}

export default DynamicAquaSubCategory;
