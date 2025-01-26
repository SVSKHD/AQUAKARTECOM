export const generateStructuredData = (pageType, data) => {
  const { blogs = [], products = [] } = data;

  switch (pageType) {
    case "home":
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Aquakart - Home",
        url: "https://www.aquakart.co.in",
        description: "Explore Aquakart for all your aquatic needs.",
        publisher: {
          "@type": "Organization",
          name: "Aquakart",
          logo: {
            "@type": "ImageObject",
            url: "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
          },
        },
      };

    case "product":
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: data.productName,
        image: data.productImage,
        description: data.productDescription,
        sku: data.productSku,
        brand: {
          "@type": "Brand",
          name: data.productBrand,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: data.productPrice,
          availability: "https://schema.org/InStock",
          url: "https://www.aquakart.co.in/product/" + data.productId,
        },
      };

    case "blog":
      return blogs.map((blog) => ({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog.title,
        image: blog.image,
        author: {
          "@type": "Person",
          name: blog.author,
        },
        publisher: {
          "@type": "Organization",
          name: "Aquakart",
          logo: {
            "@type": "ImageObject",
            url: "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
          },
        },
        datePublished: blog.datePublished,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": "https://www.aquakart.co.in/blog/" + blog.slug,
        },
      }));

    default:
      return null;
  }
};
