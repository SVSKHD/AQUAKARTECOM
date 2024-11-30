import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TabGroup,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import AquaLayout from "@/components/Layout/Layout";
import AquaSpinner from "@/components/common/spinner";
import { useRouter } from "next/router";
import CategoryServiceOperations from "@/services/category";
import ProductServiceOperations from "@/services/products";
import Link from "next/link";
import AquaProducts from "./products";

const AquaHomeComponent = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState({
    category: false,
    subcategory: false,
    product: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading((prevData) => ({ ...prevData, category: true }));
        // Set category loading to true after 3000ms delay
        const timer = setTimeout(() => {
          setLoading((prevData) => ({ ...prevData, category: true }));
        }, 3000);

        // Fetch category data
        const categoryRes = await CategoryServiceOperations.Allcategories();
        setCategoryData(categoryRes.data.data);

        // Fetch product data
        const productRes = await ProductServiceOperations.AllProducts();
        setProductData(productRes.data.data);

        // Clear timeout and update loading states
        clearTimeout(timer);
        setLoading((prevData) => ({
          ...prevData,
          category: false,
          product: false,
        }));
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Optionally set loading states to false in case of an error
        setLoading((prevData) => ({
          ...prevData,
          category: false,
          product: false,
        }));
      }
    };

    fetchData();
  }, []);

  const router = useRouter();
  const SeoData = {
    title: "Aquakart | Online Shopping for Softeners purifiers and many more",
    description:
      "Aquakart is renowned for revolutionizing water softening solutions in the e-commerce sphere, offering an array of top-tier water softeners designed to tackle hard water woes effectively. Their innovative range is meticulously engineered to enhance water quality, ensuring that every drop is pure, soft, and conducive to a healthy lifestyle. Aquakart's softeners stand out for their efficiency, durability, and ease of use, making them a prime choice for discerning homeowners seeking to safeguard their appliances from the ravages of hard water.",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
    keywords:
      "Aquakart Ecom Store ,Aquakart,  water softeners, Aquakart water softeners, Aquakart ro water purifiers, Aquakart geysers, water softener system for home  , water Ro  , ro machines , Salt Free Water Softener , Water Softener System , Water Softener Installation",
    keyphrases:
      "Water Softener Salt Prices , Salt Water Softener, bathtoom water softeners, automatic bathroom water softeners",
  };

  return (
    <>
      <AquaLayout seo={SeoData}>
        <div>
          <div className="bg-white">
            {/* Mobile menu */}
            <Dialog
              className="relative z-40 lg:hidden"
              open={mobileMenuOpen}
              onClose={setMobileMenuOpen}
            >
              <DialogBackdrop
                transition
                className="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
              />

              <div className="fixed inset-0 z-40 flex">
                <DialogPanel
                  transition
                  className="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl transition duration-300 ease-in-out data-[closed]:-translate-x-full"
                >
                  <div className="flex px-4 pb-2 pt-5">
                    <button
                      type="button"
                      className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sr-only">Close menu</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Links */}
                  <TabGroup className="mt-2">
                    <TabPanels as={Fragment}>
                      {categoryData.map((category) => (
                        <TabPanel
                          key={category.name}
                          className="space-y-12 px-4 py-6"
                        >
                          {/* <div className="grid grid-cols-2 gap-x-4 gap-y-10">
                            {category.featured.map((item) => (
                              <div key={item.name} className="group relative">
                                <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-md bg-gray-100 group-hover:opacity-75">
                                  <Image
                                    src={item.imageSrc}
                                    alt={item.imageAlt}
                                    height={100}
                                    width={100}
                                    className="object-cover object-center"
                                  />
                                </div>
                                <a
                                  href={item.href}
                                  className="mt-6 block text-sm font-medium text-gray-900"
                                >
                                  <span
                                    className="absolute inset-0 z-10"
                                    aria-hidden="true"
                                  />
                                  {item.name}
                                </a>
                                <p
                                  aria-hidden="true"
                                  className="mt-1 text-sm text-gray-500"
                                >
                                  Shop now
                                </p>
                              </div>
                            ))}
                          </div> */}
                        </TabPanel>
                      ))}
                    </TabPanels>
                  </TabGroup>

                  <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                    <div className="flow-root">
                      <a
                        href="#"
                        className="-m-2 block p-2 font-medium text-gray-900"
                      >
                        Create an account
                      </a>
                    </div>
                    <div className="flow-root">
                      <a
                        href="#"
                        className="-m-2 block p-2 font-medium text-gray-900"
                      >
                        Sign in
                      </a>
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>

            {/* Hero section */}
            <div className="relative bg-gray-900">
              {/* Decorative image and overlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0 overflow-hidden"
              >
                <img
                  src="https://res.cloudinary.com/aquakartproducts/image/upload/v1707838737/products/jbtrssziykp98iiklslk.jpg"
                  alt="Aquakart"
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gray-900 opacity-50"
              />

              {/* Navigation */}

              <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center sm:py-64 lg:px-0">
                <h1 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
                  New arrivals are here
                </h1>
                <p className="mt-4 text-xl text-white">
                  The new arrivals have, well, newly arrived. Check out the
                  latest options
                </p>
                <Link
                  href="/shop"
                  className="mt-8 inline-block rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100"
                >
                  Shop New Arrivals
                </Link>
              </div>
            </div>

            <main>
              <AquaProducts />

              <section
                aria-labelledby="category-heading"
                className="pt-2 sm:pt-2 xl:mx-auto xl:max-w-7xl xl:px-8"
              >
                <div className="px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-0">
                  <h2
                    id="category-heading"
                    className="text-2xl font-bold tracking-tight text-gray-900"
                  >
                    Shop by Category
                  </h2>
                  <Link
                    href="/categories"
                    className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block"
                  >
                    Browse All categories
                    <span aria-hidden="true"> &rarr;</span>
                  </Link>
                </div>

                <div className="mt-4 flow-root">
                  <div className="-my-2">
                    <div className="relative box-content h-80 overflow-x-auto py-2 xl:overflow-visible">
                      <div className="absolute flex space-x-8 px-4 sm:px-6 lg:px-8 xl:relative xl:grid xl:grid-cols-5 xl:gap-x-8 xl:space-x-0 xl:px-0">
                        {loading.category ? (
                          <>
                            <div className="flex items-center text-center justify-center p-20">
                              <div className="text-center">
                                <AquaSpinner color="blue" size="lg" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {categoryData.map((category) => (
                              <Link
                                key={category.title}
                                href={`/category/${category.title}`}
                                className="relative flex h-80 w-56 flex-col overflow-hidden rounded-lg p-6 hover:opacity-75 xl:w-auto"
                              >
                                <span
                                  aria-hidden="true"
                                  className="absolute inset-0"
                                >
                                  <img
                                    src={category.photos[0].secure_url}
                                    alt={category.title}
                                    className="h-full w-full object-cover object-center"
                                  />
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-800 opacity-50"
                                />
                                <Link
                                  href={`/category/${category._id}`}
                                  className="relative mt-auto text-center text-xl font-bold text-white"
                                >
                                  {category.title}
                                </Link>
                              </Link>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 px-4 sm:hidden">
                  <a
                    href="/categories"
                    className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Browse All categories
                    <span aria-hidden="true"> &rarr;</span>
                  </a>
                </div>
              </section>

              {/* Featured section */}
              <section
                aria-labelledby="social-impact-heading"
                className="mx-auto p-10 max-w-7xl px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0">
                    <img
                      src="https://res.cloudinary.com/aquakartproducts/image/upload/v1717355833/Blogs/TitleImages/z5sqkhkvawe0xcaliiei.jpg"
                      alt="Aquakart | Blogs"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="relative bg-gray-900 bg-opacity-75 px-6 py-32 sm:px-12 sm:py-40 lg:px-16">
                    <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
                      <h2
                        id="social-impact-heading"
                        className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                      >
                        <span className="block sm:inline">Level up Water </span>
                      </h2>
                      <p className="mt-3 text-xl text-white">
                        Softeners are chemical agents used to reduce the
                        hardness of water by removing or neutralizing minerals
                        such as calcium and magnesium. These minerals can cause
                        scaling, buildup, and inefficiency in plumbing and
                        appliances, as well as less effective cleaning with
                        soaps and detergents. By replacing the hard minerals
                        with sodium or potassium ions through a process called
                        ion exchange, water softeners improve water quality,
                      </p>
                      <Link
                        href="/blogs"
                        className="mt-8 block w-full rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 sm:w-auto"
                      >
                        Know More
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* Collection section */}
              {/* <section
                aria-labelledby="collection-heading"
                className="mx-auto p-10 max-w-xl px-4 pt-24 sm:px-6 sm:pt-32 lg:max-w-7xl lg:px-8"
              >
                <h2
                  id="collection-heading"
                  className="text-2xl font-bold tracking-tight text-gray-900"
                >
                  Shop by Collection
                </h2>
                <p className="mt-4 text-base text-gray-500">
                  Each season, we collaborate with world-class designers to
                  create a collection inspired by the natural world.
                </p>

                <div className="mt-10 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:space-y-0">
                  {collections.map((collection) => (
                    <a
                      key={collection.name}
                      href={collection.href}
                      className="group block"
                    >
                      <div
                        aria-hidden="true"
                        className="aspect-h-2 aspect-w-3 overflow-hidden rounded-lg lg:aspect-h-6 lg:aspect-w-5 group-hover:opacity-75"
                      >
                        <img
                          src={collection.imageSrc}
                          alt={collection.imageAlt}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-gray-900">
                        {collection.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {collection.description}
                      </p>
                    </a>
                  ))}
                </div>
              </section> */}

              {/* Featured section */}
              {/* <section
                aria-labelledby="comfort-heading"
                className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0">
                    <img
                      src="https://tailwindui.com/img/ecommerce-images/home-page-01-feature-section-02.jpg"
                      alt=""
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="relative bg-gray-900 bg-opacity-75 px-6 py-32 sm:px-12 sm:py-40 lg:px-16">
                    <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
                      <h2
                        id="comfort-heading"
                        className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                      >
                        Simple productivity
                      </h2>
                      <p className="mt-3 text-xl text-white">
                        Endless tasks, limited hours, a single piece of paper.
                        Not really a haiku, but we're doing our best here. No
                        kanban boards, burndown charts, or tangled flowcharts
                        with our Focus system. Just the undeniable urge to fill
                        empty circles.
                      </p>
                      <a
                        href="#"
                        className="mt-8 block w-full rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 sm:w-auto"
                      >
                        Shop Focus
                      </a>
                    </div>
                  </div>
                </div>
              </section> */}
            </main>
          </div>
        </div>
      </AquaLayout>
    </>
  );
};
export default AquaHomeComponent;
