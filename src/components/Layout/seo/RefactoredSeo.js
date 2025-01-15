import Head from "next/head";
import config from "./config";

const AquaSeoRevamp = ({ path, data, product, productData, blog, shop }) => {
  if (path) {
    data = config[path];
  }
  if (product) {
    data = productData;
    console.log("product", data);
  }
  if (!data) return null;

  const { title, keywords, keyphrases, url, images, description, follow } =
    data;

  return (
    <>
      <Head>
        {/* Standard SEO Tags */}
        <title>{title}</title>
        <meta name="keywords" content={keywords} />
        <meta name="description" content={description} />
        <meta name="keyphrases" content={keyphrases} />
        <meta
          name="robots"
          content={`index, ${follow ? "follow" : "nofollow"}`}
        />

        {/* Open Graph (Facebook & LinkedIn) */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={images} />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={url} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={images} />

        {/* Additional Meta Tags */}
        <meta name="author" content="Your Website Name" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="content-language" content="en" />
        <link rel="canonical" href={url} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              name: data?.title,
              image: data?.photos[0]?.secure_url,
              description: data?.description,
              sku: data?.sku,
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                  "@type": "MonetaryAmount",
                  value: data?.shippingCost,
                  currency: data?.priceCurrency,
                },
                shippingDestination: {
                  "@type": "DefinedRegion",
                  addressCountry: data?.shippingCountry,
                  addressRegion: data?.shippingRegion,
                },
                deliveryTime: {
                  "@type": "ShippingDeliveryTime",
                  handlingTime: {
                    "@type": "QuantitativeValue",
                    minValue: data?.handlingTimeMin,
                    maxValue: data?.handlingTimeMax,
                    unitCode: "DAY",
                  },
                  transitTime: {
                    "@type": "QuantitativeValue",
                    minValue: data?.transitTimeMin,
                    maxValue: data?.transitTimeMax,
                    unitCode: "DAY",
                  },
                },
              },
              brand: {
                "@type": "Brand",
                name: data?.brand,
              },
              offers: {
                "@type": "Offer",
                url: url,
                priceCurrency: data?.priceCurrency,
                price: data?.price,
                itemCondition: data?.itemCondition,
                availability: data?.stock,
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: data?.rating?.value,
                reviewCount: data?.rating?.count,
              },
              review: data?.reviews?.map((review) => ({
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

        {/* {path && data && (
    <>
    </>
)} */}
      </Head>
    </>
  );
};

export default AquaSeoRevamp;
