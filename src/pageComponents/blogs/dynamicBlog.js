import { useEffect, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import BlogServiceOperations from "@/services/blog";
import { CameraIcon } from "@heroicons/react/20/solid";
import Head from "next/head";
import AquaProductCard from "@/components/cards/productCard";
import Image from "next/image"
const AquaDynamicBlogComponent = () => {
  const router = useRouter();
  const { id } = router.query;
  const [blog, setBlog] = useState({});
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (id) {
      BlogServiceOperations.blogById(id).then((res) => {
        setBlog(res.data.data);
        setRelated(res.data.relatedProduct);
      });
    }
  }, [id]);

  const seoData = {
    title: `${blog.title || "Blog"} | Aquakart`,
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    image: blog?.titleImages?.[0]?.secure_url || "",
    keywords: `Aquakart Product | ${blog.title || "Blog"}`,
  };

  return (
    <AquaLayout seo={seoData}>
      <Head>
        <title>{seoData.title}</title>
        <link rel="canonical" href={seoData.canonical} />
        {seoData.image && <meta property="og:image" content={seoData.image} />}
        <meta name="keywords" content={seoData.keywords} />
      </Head>
      <div className="overflow-hidden bg-white">
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="absolute bottom-0 left-3/4 top-0 hidden w-screen bg-gray-50 lg:block" />
          <div className="mx-auto max-w-prose text-base lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-8">
            <div>
              <h2 className="text-lg font-semibold text-indigo-600">
                Use Cases
              </h2>
              <h3 className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
                {blog.title}
              </h3>
            </div>
          </div>
          <div className="mt-8 lg:grid lg:grid-cols-2 lg:gap-8">
            <div className="relative lg:col-start-2 lg:row-start-1">
              <svg
                className="absolute right-0 top-0 -mr-20 -mt-20 hidden lg:block"
                width={404}
                height={384}
                fill="none"
                viewBox="0 0 404 384"
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id="de316486-4a29-4312-bdfc-fbce2132a2c1"
                    x={0}
                    y={0}
                    width={20}
                    height={20}
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      x={0}
                      y={0}
                      width={4}
                      height={4}
                      className="text-gray-200"
                      fill="currentColor"
                    />
                  </pattern>
                </defs>
                <rect
                  width={404}
                  height={384}
                  fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c1)"
                />
              </svg>
              <div className="relative mx-auto max-w-prose text-base lg:max-w-none">
                <figure>
                  <div className="aspect-h-7 aspect-w-12 lg:aspect-none">
                    <Image
                      className="rounded-lg object-cover object-center shadow-lg"
                      src={
                        blog?.titleImages?.[0]?.secure_url ||
                        "/default-image.jpg"
                      }
                      alt="Aquakart"
                      width={1184}
                      height={1376}
                    />
                  </div>
                  <figcaption className="mt-3 flex text-sm text-gray-500">
                    <CameraIcon
                      className="h-5 w-5 flex-none text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="ml-2">Aquakart</span>
                  </figcaption>
                </figure>
              </div>
              <hr />
              <h2 className="text-2xl font-bold leading-7 text-black mb-3 mt-3 sm:truncate sm:text-3xl sm:tracking-tight">
                Related Products
              </h2>
              {related.map((r, i) => (
                <div key={i}>
                  <AquaProductCard product={r} />
                </div>
              ))}
            </div>
            <div className="mt-8 lg:mt-0">
              <div dangerouslySetInnerHTML={{ __html: blog.description }} />
            </div>
          </div>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaDynamicBlogComponent;
