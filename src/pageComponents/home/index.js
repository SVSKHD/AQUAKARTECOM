import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import AquaLayout from "@/components/Layout/Layout";
import AquaProductCard from "@/components/cards/productCard";
import { useRouter } from "next/router";
import CategoryServiceOperations from "@/services/category";
import ProductServiceOperations from "@/services/products";
import Image from "next/image";
import Link from "next/link";

const AquaHomeComponent = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    CategoryServiceOperations.Allcategories().then((res) => {
      setCategoryData(res.data.data);
    });
    ProductServiceOperations.AllProducts().then((res) => {
      setProductData(res.data.data);
    });
  }, []);

  const router = useRouter();
  const SeoData = {
    title: "Aquakart | Online Shopping for Softeners purifiers and many more",
    description:
      "Aquakart is renowned for revolutionizing water softening solutions in the e-commerce sphere, offering an array of top-tier water softeners designed to tackle hard water woes effectively. Their innovative range is meticulously engineered to enhance water quality, ensuring that every drop is pure, soft, and conducive to a healthy lifestyle. Aquakart's softeners stand out for their efficiency, durability, and ease of use, making them a prime choice for discerning homeowners seeking to safeguard their appliances from the ravages of hard water.",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.pathname}`,
    keywords:
      "Aquakart Ecom Store , water softeners  , water Ro  , ro machines , Salt Free Water Softener , Water Softener System , Water Softener Installation",
    keyphrases: "Water Softener Salt Prices , Salt Water Softener",
  };

  const currencies = ["CAD", "USD", "AUD", "EUR", "GBP"];
  const navigation = {
    categories: [
      {
        name: "Women",
        featured: [
          {
            name: "New Arrivals",
            href: "#",
            imageSrc:
              "https://tailwindui.com/img/ecommerce-images/mega-menu-category-01.jpg",
            imageAlt:
              "Models sitting back to back, wearing Basic Tee in black and bone.",
          },
          {
            name: "Basic Tees",
            href: "#",
            imageSrc:
              "https://tailwindui.com/img/ecommerce-images/mega-menu-category-02.jpg",
            imageAlt:
              "Close up of Basic Tee fall bundle with off-white, ochre, olive, and black tees.",
          },
          {
            name: "Accessories",
            href: "#",
            imageSrc:
              "https://tailwindui.com/img/ecommerce-images/mega-menu-category-03.jpg",
            imageAlt:
              "Model wearing minimalist watch with black wristband and white watch face.",
          },
          {
            name: "Carry",
            href: "#",
            imageSrc:
              "https://tailwindui.com/img/ecommerce-images/mega-menu-category-04.jpg",
            imageAlt:
              "Model opening tan leather long wallet with credit card pockets and cash pouch.",
          },
        ],
      },
      {
        name: "Men",
        featured: [
          {
            name: "New Arrivals",
            href: "#",
            imageSrc:
              "https://tailwindui.com/img/ecommerce-images/mega-menu-01-men-category-01.jpg",
            imageAlt:
              "Hats and sweaters on wood shelves next to various colors of t-shirts on hangers.",
          },
          {
            name: "Basic Tees",
            href: "#",
            imageSrc:
              "https://tailwindui.com/img/ecommerce-images/mega-menu-01-men-category-02.jpg",
            imageAlt: "Model wearing light heather gray t-shirt.",
          },
          {
            name: "Accessories",
            href: "#",
            imageSrc:
              "https://tailwindui.com/img/ecommerce-images/mega-menu-01-men-category-03.jpg",
            imageAlt:
              "Grey 6-panel baseball hat with black brim, black mountain graphic on front, and light heather gray body.",
          },
          {
            name: "Carry",
            href: "#",
            imageSrc:
              "https://tailwindui.com/img/ecommerce-images/mega-menu-01-men-category-04.jpg",
            imageAlt:
              "Model putting folded cash into slim card holder olive leather wallet with hand stitching.",
          },
        ],
      },
    ],
    pages: [
      { name: "Company", href: "#" },
      { name: "Stores", href: "#" },
    ],
  };
  const categories = [
    {
      name: "New Arrivals",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/home-page-01-category-01.jpg",
    },
    {
      name: "Productivity",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/home-page-01-category-02.jpg",
    },
    {
      name: "Workspace",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/home-page-01-category-04.jpg",
    },
    {
      name: "Accessories",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/home-page-01-category-05.jpg",
    },
    {
      name: "Sale",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/home-page-01-category-03.jpg",
    },
  ];
  const collections = [
    {
      name: "Handcrafted Collection",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/home-page-01-collection-01.jpg",
      imageAlt:
        "Brown leather key ring with brass metal loops and rivets on wood table.",
      description:
        "Keep your phone, keys, and wallet together, so you can lose everything at once.",
    },
    {
      name: "Organized Desk Collection",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/home-page-01-collection-02.jpg",
      imageAlt:
        "Natural leather mouse pad on white desk next to porcelain mug and keyboard.",
      description:
        "The rest of the house will still be a mess, but your desk will look great.",
    },
    {
      name: "Focus Collection",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/home-page-01-collection-03.jpg",
      imageAlt:
        "Person placing task list card into walnut card holder next to felt carrying case on leather desk pad.",
      description:
        "Be more productive than enterprise project managers with a single piece of paper.",
    },
  ];
  const footerNavigation = {
    shop: [
      { name: "Bags", href: "#" },
      { name: "Tees", href: "#" },
      { name: "Objects", href: "#" },
      { name: "Home Goods", href: "#" },
      { name: "Accessories", href: "#" },
    ],
    company: [
      { name: "Who we are", href: "#" },
      { name: "Sustainability", href: "#" },
      { name: "Press", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Terms & Conditions", href: "#" },
      { name: "Privacy", href: "#" },
    ],
    account: [
      { name: "Manage Account", href: "#" },
      { name: "Returns & Exchanges", href: "#" },
      { name: "Redeem a Gift Card", href: "#" },
    ],
    connect: [
      { name: "Contact Us", href: "#" },
      { name: "Facebook", href: "#" },
      { name: "Instagram", href: "#" },
      { name: "Pinterest", href: "#" },
    ],
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }
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
                    <div className="border-b border-gray-200">
                      <TabList className="-mb-px flex space-x-8 px-4">
                        {navigation.categories.map((category) => (
                          <Tab
                            key={category.name}
                            className={({ selected }) =>
                              classNames(
                                selected
                                  ? "border-indigo-600 text-indigo-600"
                                  : "border-transparent text-gray-900",
                                "flex-1 whitespace-nowrap border-b-2 px-1 py-4 text-base font-medium",
                              )
                            }
                          >
                            {category.name}
                          </Tab>
                        ))}
                      </TabList>
                    </div>
                    <TabPanels as={Fragment}>
                      {navigation.categories.map((category) => (
                        <TabPanel
                          key={category.name}
                          className="space-y-12 px-4 py-6"
                        >
                          <div className="grid grid-cols-2 gap-x-4 gap-y-10">
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
                          </div>
                        </TabPanel>
                      ))}
                    </TabPanels>
                  </TabGroup>

                  <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                    {navigation.pages.map((page) => (
                      <div key={page.name} className="flow-root">
                        <a
                          href={page.href}
                          className="-m-2 block p-2 font-medium text-gray-900"
                        >
                          {page.name}
                        </a>
                      </div>
                    ))}
                  </div>

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

                  <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                    {/* Currency selector */}
                    <form>
                      <div className="inline-block">
                        <label htmlFor="mobile-currency" className="sr-only">
                          Currency
                        </label>
                        <div className="group relative -ml-2 rounded-md border-transparent focus-within:ring-2 focus-within:ring-white">
                          <select
                            id="mobile-currency"
                            name="currency"
                            className="flex items-center rounded-md border-transparent bg-none py-0.5 pl-2 pr-5 text-sm font-medium text-gray-700 focus:border-transparent focus:outline-none focus:ring-0 group-hover:text-gray-800"
                          >
                            {currencies.map((currency) => (
                              <option key={currency}>{currency}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                            <ChevronDownIcon
                              className="h-5 w-5 text-gray-500"
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      </div>
                    </form>
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
                <Image
                  height={100}
                  width={100}
                  src="https://tailwindui.com/img/ecommerce-images/home-page-01-hero-full-width.jpg"
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
                  latest options from our summer small-batch release while
                  they're still in stock.
                </p>
                <Link
                  href="#"
                  className="mt-8 inline-block rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100"
                >
                  Shop New Arrivals
                </Link>
              </div>
            </div>

            <main>
              {/* Category section */}
              <section
                aria-labelledby="category-heading"
                className="pt-24 sm:pt-32 xl:mx-auto xl:max-w-7xl xl:px-8"
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
                    Browse all categories
                    <span aria-hidden="true"> &rarr;</span>
                  </Link>
                </div>

                <div className="mt-4 flow-root">
                  <div className="-my-2">
                    <div className="relative box-content h-80 overflow-x-auto py-2 xl:overflow-visible">
                      <div className="absolute flex space-x-8 px-4 sm:px-6 lg:px-8 xl:relative xl:grid xl:grid-cols-5 xl:gap-x-8 xl:space-x-0 xl:px-0">
                        {categoryData.map((category) => (
                          <Link
                            key={category.title}
                            href={`/category/${category._id}`}
                            className="relative flex h-80 w-56 flex-col overflow-hidden rounded-lg p-6 hover:opacity-75 xl:w-auto"
                          >
                            <span
                              aria-hidden="true"
                              className="absolute inset-0"
                            >
                              <Image
                                src={category.photos[0].secure_url}
                                alt={category.title}
                                height={100}
                                width={100}
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
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 px-4 sm:hidden">
                  <a
                    href="#"
                    className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Browse all categories
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
                    <Image
                      height={100}
                      width={100}
                      src="https://res.cloudinary.com/aquakartproducts/image/upload/v1717355833/Blogs/TitleImages/z5sqkhkvawe0xcaliiei.jpg"
                      alt=""
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
