import Head from "next/head";
const AquaProductSeo = ({ product }) => {
  const {
    title,
    description,
    photos,
    keyphrases,
    keywords,
    follow,
    url,
    sku,
    brand,
    priceCurrency,
    price,
    reviews,
    itemCondition,
    stock,
    rating,
  } = product;
  return (
    <Head>
      <title>{title}</title>
      <meta name="keywords" content={keywords} />
      <meta name="description" content={description} />
      <meta name="keyphrases" content={keyphrases} />
      <meta
        name="robots"
        content={`index, ${follow ? "follow" : "nofollow"}, max-image-preview:large`}
      />
      {/* Open Graph (Facebook & LinkedIn) */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Aquakart" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={photos} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@aquakart8" />{" "}
      {/* Replace with your handle */}
      <meta name="twitter:creator" content="@aquakart8" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={photos} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
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
              url: url,
              priceCurrency: priceCurrency,
              price: price,
              itemCondition: itemCondition,
              availability: stock,
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: rating?.value,
              reviewCount: rating?.count,
            },
            review: reviews?.map((review) => ({
              "@type": "Review",
              author: {
                "@type": "Person",
                name: review?.author,
              },
              datePublished: review.datePublished,
              reviewBody: review.body,
              reviewRating: {
                "@type": "Rating",
                ratingValue: review?.ratingValue,
                bestRating: review.bestRating || "5",
                worstRating: review.worstRating || "1",
              },
            })),
          }),
        }}
      />
    </Head>
  );
};
export default AquaProductSeo;
