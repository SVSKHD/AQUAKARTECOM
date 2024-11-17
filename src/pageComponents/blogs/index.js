import { useState, useEffect } from "react";
import AquaLayout from "@/components/Layout/Layout";
import BlogServiceOperations from "@/services/blog";
import AQ from "@/assests/logo-white.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AquaBlogComponnet = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  useEffect(() => {
    BlogServiceOperations.AllBlogs().then((res) => {
      setBlogs(res.data.data);
    });
  }, []);

  const seoData = {
    title: "Aquakart | Know More About Water Softeners and Filters",
    description:
      "Aquakart's product comparison tool empowers shoppers to make informed decisions by offering side-by-side comparisons of features, prices, and customer reviews. Easily evaluate multiple products, discover the best deals, and find the perfect fit for your needs.",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    keyords: "Aquakart kent softeners, sand-filters, iron-filters, water purifiers, water filters, households",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
  };
  return (
    <AquaLayout seo={seoData}>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              From Our Blog
            </h2>
            <p className="mt-2 text-lg leading-8 text-gray-600">
              More Thoughts on Why Softener is required.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl auto-rows-fr grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {blogs.map((post) => (
              <article
                key={post.id}
                className="relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 px-8 pb-8 pt-80 sm:pt-48 lg:pt-80"
              >
                <img
                  src={post.photos[0].secure_url}
                  alt={`${post.title | "Aquakart Blogs"}`}
                  className="absolute inset-0 -z-10 h-full w-full object-cover"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-900 via-gray-900/40" />
                <div className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-gray-900/10" />

                <div className="flex flex-wrap items-center gap-y-1 overflow-hidden text-sm leading-6 text-gray-300">
                  <time dateTime={post.datetime} className="mr-8">
                    {post.date}
                  </time>
                  <div className="-ml-4 flex items-center gap-x-4">
                    <svg
                      viewBox="0 0 2 2"
                      className="-ml-0.5 h-0.5 w-0.5 flex-none fill-white/50"
                    >
                      <circle cx={1} cy={1} r={1} />
                    </svg>
                    <div className="flex gap-x-2.5">
                      <Image
                        src={AQ}
                        alt=""
                        height={100}
                        width={100}
                        className="h-6 w-6 flex-none rounded-full bg-white/10"
                      />
                      Aquakart
                    </div>
                  </div>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-6 text-white">
                  <Link href={`/blog/${post._id}`}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </Link>
                </h3>
              </article>
            ))}
          </div>
        </div>
      </div>
    </AquaLayout>
  );
};
export default AquaBlogComponnet;
