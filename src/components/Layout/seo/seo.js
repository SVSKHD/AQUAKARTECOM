import Head from "next/head";

const AquaSeo = ({ seo, blogs = [], products = [] }) => {
  const {
    title,
    description,
    keywords,
    keyphrases,
    canonical,
    image,
    noindex,
    organization = {
      "@type": "Organization",
      "@id": "https://www.aquakart.co.in#organization",
      "name": "Aquakart",
      "url": "https://www.aquakart.co.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png"
      }
    },
  } = seo;

  const graphData = [
    organization,
    {
      "@type": "WebSite",
      "@id": "https://www.aquakart.co.in#website",
      "url": "https://www.aquakart.co.in",
      "name": "Aquakart",
      "publisher": {
        "@id": "https://www.aquakart.co.in#organization"
      }
    },
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      "url": canonical,
      "name": title,
      "isPartOf": {
        "@id": "https://www.aquakart.co.in#website"
      },
      "description": description
    }
  ];

  // Add breadcrumbs
  graphData.push({
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@id": "https://www.aquakart.co.in",
          "name": "Home"
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@id": canonical,
          "name": title
        }
      }
    ]
  });

  // Add blogs dynamically
  blogs.forEach((blog) => {
    graphData.push({
      "@type": "BlogPosting",
      "@id": `${canonical}#blogposting`,
      "mainEntityOfPage": {
        "@id": `${canonical}/blog/${blog._id}#webpage`
      },
      "headline": blog.title,
      "description": blog.description.replace(/<[^>]+>/g, ""), // Remove HTML tags
      "articleBody": blog.description,
      "keywords": blog.keywords,
      "image": {
        "@type": "ImageObject",
        "url": blog.titleImages[0]?.secure_url || image,
        "width": 1200,
        "height": 800
      },
      "author": {
        "@type": "Organization",
        "name": "Aquakart"
      },
      "publisher": {
        "@id": "https://www.aquakart.co.in#organization"
      },
      "datePublished": new Date(blog.createdAt).toISOString(),
      "dateModified": new Date(blog.createdAt).toISOString()
    });
  });

  // Add products dynamically
  products.forEach((product) => {
    graphData.push({
      "@type": "Product",
      "@id": `https://www.aquakart.co.in/product/${product._id}#product`,
      "name": product.title,
      "image": product.photos.map((photo) => photo.secure_url),
      "description": product.description.replace(/<[^>]+>/g, ""),
      "sku": product.slug || product.title.replace(/\s+/g, "-").toLowerCase(),
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Aquakart"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://www.aquakart.co.in/product/${product.slug}`,
        "priceCurrency": "INR",
        "price": product.price,
        "availability": product.stock > 0 ? "http://schema.org/InStock" : "http://schema.org/OutOfStock",
        "itemCondition": "http://schema.org/NewCondition"
      }
    });
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": graphData
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="canonical" href={canonical} />

        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="keyphrases" content={keyphrases} />
        <meta
          name="robots"
          content={noindex ? "noindex, nofollow" : "index, follow"}
        />

        {/* Open Graph Meta */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="Aquakart" />

        {/* Twitter Meta */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
    </>
  );
};

export default AquaSeo;
