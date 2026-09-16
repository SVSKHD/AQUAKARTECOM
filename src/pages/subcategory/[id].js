import AquaDynamicSubCategoryComponent from "@/pageComponents/subcategories/dynamicSubCategory";
import SubCategoryServiceOperations from "@/services/subcategory";
import { getManagedSeoServerSide } from "@/services/seo";
import {
  getManagedSeoEntityKey,
  mergeManagedSeo,
} from "@/utils/managedSeo";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in";

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

    const entityUrl = `${SITE_URL}/subcategory/${encodeURIComponent(id)}`;
    const fallbackSeo = {
      title: `Aquakart | ${subcategory.title || id}`,
      description: `Aquakart - ${
        subcategory.description || "Browse our specialized water collection."
      }`,
      keywords: subcategory.keywords || "",
      url: entityUrl,
      canonical: entityUrl,
      photos: subcategory?.photos?.[0]?.secure_url || "",
      follow: true,
    };

    const pageKey = getManagedSeoEntityKey(
      "subcategory",
      subcategory.title || id,
    );
    const managedRecord = pageKey
      ? await getManagedSeoServerSide(pageKey)
      : null;
    const managedSeo = mergeManagedSeo(fallbackSeo, managedRecord);

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

    res.statusCode = 503;
    res.setHeader("Retry-After", "60");
    return {
      props: {
        id,
        subcategory: null,
        related: [],
        managedSeo: null,
      },
    };
  }
}

export default DynamicAquaSubCategory;
