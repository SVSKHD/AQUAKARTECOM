import Head from "next/head";
import config from "./config";

const DEFAULT_LOGO =
  "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";

const stripHtml = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const toAbsoluteUrl = (baseUrl, value) => {
  if (!value) return baseUrl;
  if (/^https?:\/\//i.test(value)) return value;
  return `${baseUrl}${value.startsWith("/") ? value : `/${value}`}`;
};

const collectImages = (photos) => {
  if (!photos) return [];
  if (Array.isArray(photos)) {
    return photos
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.secure_url) return item.secure_url;
        if (item?.url) return item.url;
        return null;
      })
      .filter(Boolean);
  }
  if (typeof photos === "string") return [photos];
  if (photos?.secure_url) return [photos.secure_url];
  return [];
};

const AquaSeoRevamp = ({
  path,
  category,
  categoryData,
  subcategory,
  subcategoryData,
  data,
  product,
  productData,
  productList = [],
  blogList = [],
  blogPage,
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in";

  let metaData = data;
  if (path && config[path]) {
    metaData = config[path];
  }
  if (product) {
    metaData = productData || metaData;
  }
  if (category) {
    metaData = categoryData || metaData;
  }
  if (subcategory) {
    metaData = subcategoryData || metaData;
  }

  if (!metaData && blogPage) {
    const slug = blogPage?.slug || blogPage?._id || "";
    const blogUrl = toAbsoluteUrl(baseUrl, `/blog/${slug}`);
    const blogImage =
      blogPage?.titleImages?.[0]?.secure_url ||
      blogPage?.photos?.[0]?.secure_url ||
      blogPage?.coverImage ||
      DEFAULT_LOGO;

    metaData = {
      title: `${blogPage?.title || "Aquakart Blog"}`,
      description:
        stripHtml(
          blogPage?.shortDescription || blogPage?.description || "",
        ).slice(0, 160) || "Latest insights from Aquakart.",
      keywords: Array.isArray(blogPage?.keywords)
        ? blogPage.keywords.join(", ")
        : blogPage?.keywords || "",
      keyphrases: blogPage?.keyphrases || "",
      url: blogUrl,
      photos: blogImage,
      follow: true,
    };
  }

  const inferredPath = (() => {
    if (blogPage) {
      const slug = blogPage?.slug || blogPage?._id;
      return slug ? `/blog/${slug}` : "/blogs";
    }
    if (product) {
      const slug =
        productData?.slug || productData?._id || product?._id || product;
      return slug ? `/product/${slug}` : "/shop";
    }
    if (subcategory) {
      const slug = subcategoryData?.slug || subcategoryData?._id || subcategory;
      return slug ? `/subcategory/${slug}` : "/shop";
    }
    if (category) {
      const slug = categoryData?.slug || categoryData?._id || category;
      return slug ? `/category/${slug}` : "/shop";
    }
    if (path && path !== "home") {
      return `/${String(path).replace(/^\/+/, "")}`;
    }
    return "/";
  })();

  const {
    title = "Aquakart",
    keywords = "",
    keyphrases = "",
    url: rawUrl,
    description = "",
    follow = true,
    photos,
  } = metaData || {};

  const canonicalUrl = toAbsoluteUrl(
    baseUrl,
    rawUrl || inferredPath || baseUrl,
  );
  const photoCandidates = collectImages(photos);
  const primaryImage = photoCandidates[0] || DEFAULT_LOGO;

  // Determine og:type based on page context
  const ogType = blogPage ? "article" : product ? "product" : "website";

  const graphNodes = [];

  // Organization (every page)
  const publisherNode = {
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: "Aquakart",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: DEFAULT_LOGO,
      width: 384,
      height: 384,
    },
    sameAs: [
      "https://www.facebook.com/AquaKart.co.in/",
      "https://www.instagram.com/aquakart.co.in/",
      "https://x.com/aquakart.co.in",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi", "Telugu"],
    },
  };
  graphNodes.push(publisherNode);

  // WebSite (every page — enables sitelinks search box in Google)
  graphNodes.push({
    "@type": "WebSite",
    "@id": `${baseUrl}#website`,
    url: baseUrl,
    name: "Aquakart",
    publisher: { "@id": `${baseUrl}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });

  // BreadcrumbList (every page)
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl,
    },
  ];

  if (path && path !== "home") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: title,
      item: canonicalUrl,
    });
  } else if (product && productData) {
    breadcrumbItems.push(
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${baseUrl}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productData?.title || "Product",
        item: canonicalUrl,
      },
    );
  } else if (category) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: categoryData?.title || "Category",
      item: canonicalUrl,
    });
  } else if (subcategory) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: subcategoryData?.title || "Subcategory",
      item: canonicalUrl,
    });
  }

  if (breadcrumbItems.length > 1) {
    graphNodes.push({
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumb`,
      itemListElement: breadcrumbItems,
    });
  }

  const productNodeFromData = (productRecord) => {
    if (!productRecord) return null;
    const slug = productRecord?.slug || productRecord?._id;
    if (!slug) return null;
    const productUrl = toAbsoluteUrl(baseUrl, `/product/${slug}`);
    const productImages = collectImages(productRecord?.photos);
    const price =
      productRecord?.discountPriceStatus && productRecord?.discountPrice
        ? productRecord.discountPrice
        : productRecord?.price;
    const availability =
      productRecord?.stock && Number(productRecord.stock) > 0
        ? "http://schema.org/InStock"
        : "http://schema.org/OutOfStock";

    const node = {
      "@type": "Product",
      "@id": `${productUrl}#product`,
      name: productRecord?.title,
      image: productImages.length ? productImages : undefined,
      description:
        stripHtml(
          productRecord?.metaDescription ||
            productRecord?.shortDescription ||
            productRecord?.description,
        ) || undefined,
      sku: productRecord?.sku || slug,
      brand: productRecord?.brand
        ? {
            "@type": "Brand",
            name: productRecord.brand,
          }
        : undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: productRecord?.currency || "INR",
        price: price || undefined,
        availability,
        itemCondition: "https://schema.org/NewCondition",
        url: productUrl,
      },
    };

    if (productRecord?.rating?.value) {
      node.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: productRecord.rating.value,
        reviewCount: productRecord.rating.count,
      };
    }

    if (Array.isArray(productRecord?.reviews) && productRecord.reviews.length) {
      node.review = productRecord.reviews
        .map((review) => ({
          "@type": "Review",
          author: review?.author
            ? { "@type": "Person", name: review.author }
            : undefined,
          datePublished: review?.datePublished,
          reviewBody: stripHtml(review?.body),
          reviewRating: review?.ratingValue
            ? {
                "@type": "Rating",
                ratingValue: review.ratingValue,
                bestRating: review?.bestRating || "5",
                worstRating: review?.worstRating || "1",
              }
            : undefined,
        }))
        .filter(
          (review) =>
            review.reviewBody ||
            (review.reviewRating && review.reviewRating.ratingValue),
        );
    }

    return node;
  };

  // Primary product node (detail pages)
  if (product && productData) {
    const detailNode = productNodeFromData(productData);
    if (detailNode) {
      detailNode.publisher = { "@id": `${baseUrl}#organization` };
      graphNodes.push(detailNode);
    }
  }

  // Product listing (shop/category pages)
  const productListItems = [];
  if (Array.isArray(productList) && productList.length) {
    productList.forEach((productRecord, index) => {
      const productNode = productNodeFromData(productRecord);
      if (!productNode) return;
      const existing = graphNodes.find(
        (node) => node["@id"] === productNode["@id"],
      );
      if (!existing) {
        productNode.publisher = { "@id": `${baseUrl}#organization` };
        graphNodes.push(productNode);
      }
      productListItems.push({
        "@type": "ListItem",
        position: index + 1,
        url: productNode["@id"].replace("#product", ""),
        item: {
          "@type": "Product",
          "@id": productNode["@id"],
        },
      });
    });

    if (productListItems.length) {
      graphNodes.push({
        "@type": "ItemList",
        "@id": `${canonicalUrl}#product-list`,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: productListItems,
      });
    }
  }

  // Blog list (blogs page)
  const blogListItems = [];
  if (Array.isArray(blogList) && blogList.length) {
    blogList.forEach((blogRecord, index) => {
      const slug = blogRecord?.slug || blogRecord?._id;
      if (!slug) return;
      const blogUrl = toAbsoluteUrl(baseUrl, `/blog/${slug}`);
      const blogId = `${blogUrl}#blogposting`;
      const blogImages = collectImages(
        blogRecord?.titleImages ||
          blogRecord?.photos ||
          (blogRecord?.image ? [blogRecord.image] : undefined),
      );

      const blogNode = {
        "@type": "BlogPosting",
        "@id": blogId,
        headline: blogRecord?.title,
        image: blogImages.length ? blogImages : undefined,
        description:
          stripHtml(blogRecord?.shortDescription || blogRecord?.description) ||
          undefined,
        articleBody: stripHtml(blogRecord?.description),
        keywords: Array.isArray(blogRecord?.keywords)
          ? blogRecord.keywords.join(", ")
          : blogRecord?.keywords,
        datePublished: blogRecord?.createdAt
          ? new Date(blogRecord.createdAt).toISOString()
          : undefined,
        dateModified: blogRecord?.updatedAt
          ? new Date(blogRecord.updatedAt).toISOString()
          : undefined,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": blogUrl,
        },
        author: {
          "@type": "Organization",
          name: "Aquakart",
        },
        publisher: { "@id": `${baseUrl}#organization` },
      };

      const existing = graphNodes.find((node) => node["@id"] === blogId);
      if (!existing) {
        graphNodes.push(blogNode);
      }

      blogListItems.push({
        "@type": "ListItem",
        position: index + 1,
        url: blogUrl,
        item: {
          "@type": "BlogPosting",
          "@id": blogId,
        },
      });
    });

    if (blogListItems.length) {
      graphNodes.push({
        "@type": "ItemList",
        "@id": `${canonicalUrl}#blog-list`,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: blogListItems,
      });
    }
  }

  // Blog detail page
  if (blogPage) {
    const slug = blogPage?.slug || blogPage?._id;
    if (slug) {
      const blogUrl = toAbsoluteUrl(baseUrl, `/blog/${slug}`);
      const blogId = `${blogUrl}#blogposting`;
      const blogImages = collectImages(
        blogPage?.titleImages ||
          blogPage?.photos ||
          (blogPage?.coverImage ? [blogPage.coverImage] : undefined),
      );
      const blogNode = {
        "@type": "BlogPosting",
        "@id": blogId,
        headline: blogPage?.title,
        image: blogImages.length ? blogImages : undefined,
        description:
          stripHtml(
            blogPage?.shortDescription ||
              blogPage?.excerpt ||
              blogPage?.description,
          ) || undefined,
        articleBody: stripHtml(blogPage?.description),
        keywords: Array.isArray(blogPage?.keywords)
          ? blogPage.keywords.join(", ")
          : blogPage?.keywords,
        datePublished: blogPage?.createdAt
          ? new Date(blogPage.createdAt).toISOString()
          : undefined,
        dateModified: blogPage?.updatedAt
          ? new Date(blogPage.updatedAt).toISOString()
          : undefined,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": blogUrl,
        },
        author: {
          "@type": "Organization",
          name: blogPage?.author || "Aquakart",
        },
        publisher: { "@id": `${baseUrl}#organization` },
      };

      const existing = graphNodes.find((node) => node["@id"] === blogId);
      if (!existing) {
        graphNodes.push(blogNode);
      }

      graphNodes.push({
        "@type": "BreadcrumbList",
        "@id": `${blogUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            item: {
              "@id": baseUrl,
              name: "Home",
            },
          },
          {
            "@type": "ListItem",
            position: 2,
            item: {
              "@id": `${baseUrl}/blogs`,
              name: "Blogs",
            },
          },
          {
            "@type": "ListItem",
            position: 3,
            item: {
              "@id": blogUrl,
              name: blogPage?.title || "Blog",
            },
          },
        ],
      });
    }
  }

  const shouldRenderMeta = Boolean(metaData);

  return (
    <>
      <Head>
        {shouldRenderMeta && (
          <>
            <title>{title}</title>
            <meta name="keywords" content={keywords} />
            <meta name="description" content={description} />
            <meta name="keyphrases" content={keyphrases} />
            <meta
              name="robots"
              content={`index, ${follow ? "follow" : "nofollow"}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`}
            />
            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content="Aquakart" />
            <meta property="og:locale" content="en_IN" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {primaryImage && (
              <meta property="og:image" content={primaryImage} />
            )}
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            {primaryImage && <meta property="og:image:alt" content={title} />}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@aquakart8" />
            <meta name="twitter:creator" content="@aquakart8" />
            <meta name="twitter:url" content={canonicalUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            {primaryImage && (
              <meta name="twitter:image" content={primaryImage} />
            )}
            <meta name="author" content="Aquakart" />
            <meta httpEquiv="content-language" content="en" />
            <link rel="canonical" href={canonicalUrl} />
          </>
        )}
        {graphNodes.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": graphNodes,
              }),
            }}
          />
        )}
      </Head>
    </>
  );
};

export default AquaSeoRevamp;
