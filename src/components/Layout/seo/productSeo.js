import Head from 'next/head';
const AquaProductSeo = ({product}) => {
    const {title, description, photos, keyphrases, keywords, follow, url} = product;
return(
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
</Head>
)
}
export default AquaProductSeo;