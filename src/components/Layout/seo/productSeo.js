import Head from "next/head";

const AquaProductSeo = ({ product }) => {
  const {
    title,
    description,
    photos = [],
    keywords,
    follow,
    url,
    priceCurrency,
    price,
    brand = "Aquakart",
    sku,
    itemCondition = "https://schema.org/NewCondition",
    stock = "https://schema.org/InStock",
    rating = {},
    reviews = [],
  } = product;

  return (
    <Head>
      {/* General Meta */}
      <title>{title}</title>
      <meta name="keywords" content={keywords} />
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={`index, ${follow ? "follow" : "nofollow"}, max-image-preview:large`}
      />

      {/* Open Graph Metadata */}
      <meta property="og:type" content="product" />
      <meta property="og:site_name" content="Aquakart" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={photos[0]?.secure_url || photos[0] || ""} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter Card Metadata */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@aquakart8" /> {/* Replace with your handle */}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={photos[0]?.secure_url || photos[0] || ""} />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: title,
            image: photos[0]?.secure_url,
            description: description,
            sku: sku,
            brand: {
              "@type": "Brand",
              name: brand,
            },
            offers: {
              "@type": "Offer",
              priceCurrency: priceCurrency,
              price: price,
              itemCondition: itemCondition,
              availability: stock,
              url: url,
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
          }),
        }}
      />
    </Head>
  );
};

export default AquaProductSeo;