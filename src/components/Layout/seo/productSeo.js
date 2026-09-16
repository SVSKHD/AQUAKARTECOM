import Head from "next/head";

const AquaProductSeo = ({ product }) => {
  const {
    title,
    description,
    photos = [],
    keywords,
    follow,
    url,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    twitterTitle,
    twitterDescription,
    twitterImage,
    schemaJson,
    priceCurrency,
    price,
    brand = "Aquakart",
    sku,
    itemCondition = "https://schema.org/NewCondition",
    stock = "https://schema.org/InStock",
    rating = {},
    reviews = [],
  } = product;

  const primaryImage = photos[0]?.secure_url || photos[0] || "";
  const resolvedOgImage = ogImage || primaryImage;
  const resolvedTwitterImage = twitterImage || resolvedOgImage;
  const robotsContent =
    robots || `index, ${follow ? "follow" : "nofollow"}, max-image-preview:large`;
  const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    image: primaryImage ? [primaryImage] : undefined,
    description,
    sku,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    offers: {
      "@type": "Offer",
      priceCurrency,
      price,
      itemCondition,
      availability: stock,
      url,
    },
    aggregateRating: rating.value
      ? {
          "@type": "AggregateRating",
          ratingValue: rating.value,
          reviewCount: rating.count,
        }
      : undefined,
    review: reviews.length
      ? reviews.map((review) => ({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: review.author,
          },
          datePublished: review.datePublished,
          reviewBody: review.body,
          reviewRating: {
            "@type": "Rating",
            ratingValue: review.ratingValue,
            bestRating: review.bestRating || "5",
            worstRating: review.worstRating || "1",
          },
        }))
      : undefined,
  };

  return (
    <Head>
      <title>{title}</title>
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      {description ? <meta name="description" content={description} /> : null}
      <meta name="robots" content={robotsContent} />
      {url ? <link rel="canonical" href={url} /> : null}

      <meta property="og:type" content="product" />
      <meta property="og:site_name" content="Aquakart" />
      {url ? <meta property="og:url" content={url} /> : null}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      {resolvedOgImage ? <meta property="og:image" content={resolvedOgImage} /> : null}
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@aquakart8" />
      <meta name="twitter:title" content={twitterTitle || ogTitle || title} />
      <meta
        name="twitter:description"
        content={twitterDescription || ogDescription || description}
      />
      {resolvedTwitterImage ? (
        <meta name="twitter:image" content={resolvedTwitterImage} />
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(productSchema) }}
      />
      {schemaJson ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(schemaJson) }}
        />
      ) : null}
    </Head>
  );
};

export default AquaProductSeo;
