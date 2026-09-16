import AquaDynamicCategoryComponent from "@/pageComponents/categories/dynamicCategory";
import CategoryServiceOperations from "@/services/category";
import { getManagedSeoServerSide } from "@/services/seo";
import {
  getManagedSeoEntityKey,
  mergeManagedSeo,
} from "@/utils/managedSeo";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in";

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

    const entityUrl = `${SITE_URL}/category/${encodeURIComponent(id)}`;
    const fallbackSeo = {
      title: `Aquakart | ${category.title || id}`,
      description: `Aquakart - ${
        category.description ||
        "Explore premium quality products tailored for your water needs."
      }`,
      keywords: category.keywords || "",
      url: entityUrl,
      canonical: entityUrl,
      photos: category?.photos?.[0]?.secure_url || "",
      follow: true,
    };

    const pageKey = getManagedSeoEntityKey("category", category.title || id);
    const managedRecord = pageKey
      ? await getManagedSeoServerSide(pageKey)
      : null;
    const managedSeo = mergeManagedSeo(fallbackSeo, managedRecord);

    return {
      props: {
        id,
        category,
        related: categoryResponse?.data?.relatedProducts || [],
        managedSeo,
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
        managedSeo: null,
      },
    };
  }
}

export default DynamicAquaCategory;
