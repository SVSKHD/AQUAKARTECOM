import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  Radio,
  RadioGroup,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import {
  Bars3Icon,
  HeartIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon, StarIcon } from "@heroicons/react/20/solid";
import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import ProductServiceOperations from "@/services/products";
import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { FaHeart, FaHeartBroken } from "react-icons/fa";
import { FaCartArrowDown, FaCartShopping } from "react-icons/fa6";
import { useSelector } from "react-redux";
import AquaProductCard from "@/components/cards/productCard";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AquaDynamicProductComponent() {
  const seo = { title: "product | Aquakart" };
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [productData, setProductData] = useState(null);
  const [related, setRelatedData] = useState([]);
  const [cart, setCart] = useState(false);
  const [fav, setFav] = useState(false);
  const { formatCurrencyINR } = useCurrency;
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();

  const router = useRouter();
  const { id } = router.query;
  const { cartData, favData } = useSelector((state) => ({ ...state }));

  useEffect(() => {
    const isProductInCart = cartData.some(
      (item) => item._id === productData?._id,
    );
    const isProductInFav = favData.some(
      (item) => item._id === productData?._id,
    );
    setCart(isProductInCart);
    setFav(isProductInFav);
  }, [cartData, productData?._id, favData]);

  useEffect(() => {
    if (id) {
      ProductServiceOperations.ProductById(id).then((res) => {
        setProductData(res.data.data);
        if (res.data.colors && res.data.colors.length > 0) {
          setSelectedColor(res.data.colors[0]);
        }
        if (res.data.sizes && res.data.sizes.length > 0) {
          setSelectedSize(res.data.sizes[2] || res.data.sizes[0]);
        }
        setRelatedData(res.data.related);
      });
    }
  }, [id]);

  if (!productData) {
    return <div>Loading...</div>;
  }

  const product = {
    name: "Zip Tote Basket",
    price: "$140",
    rating: 4,
    images: [
      {
        id: 1,
        name: "Angled view",
        src: "https://tailwindui.com/img/ecommerce-images/product-page-03-product-01.jpg",
        alt: "Angled front view with bag zipped and handles upright.",
      },
      // More images...
    ],
    colors: [
      {
        name: "Washed Black",
        bgColor: "bg-gray-700",
        selectedColor: "ring-gray-700",
      },
      { name: "White", bgColor: "bg-white", selectedColor: "ring-gray-400" },
      {
        name: "Washed Gray",
        bgColor: "bg-gray-500",
        selectedColor: "ring-gray-500",
      },
    ],
    description: `
      <p>The Zip Tote Basket is the perfect midpoint between shopping tote and comfy backpack. With convertible straps, you can hand carry, should sling, or backpack this convenient and spacious bag. The zip top and durable canvas construction keeps your goods protected for all-day use.</p>
    `,
    details: [
      {
        name: "Features",
        items: [
          "Multiple strap configurations",
          "Spacious interior with top zip",
          "Leather handle and tabs",
          "Interior dividers",
          "Stainless strap loops",
          "Double stitched construction",
          "Water-resistant",
        ],
      },
      // More sections...
    ],
  };
  const relatedProducts = [
    {
      id: 1,
      name: "Zip Tote Basket",
      color: "White and black",
      href: "#",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/product-page-03-related-product-01.jpg",
      imageAlt:
        "Front of zip tote bag with white canvas, black canvas straps and handle, and black zipper pulls.",
      price: "$140",
    },
    // More products...
  ];

  return (
    <AquaLayout seo={seo}>
      <div className="bg-white">
        <main className="mx-auto max-w-7xl sm:px-6 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            {/* Product */}
            <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
              {/* Image gallery */}
              <TabGroup className="flex flex-col-reverse">
                {/* Image selector */}
                <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                  <TabList className="grid grid-cols-4 gap-6">
                    {productData?.photos?.map((image) => (
                      <Tab
                        key={image.id}
                        className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4"
                      >
                        {({ selected }) => (
                          <>
                            <span className="sr-only">{image.id}</span>
                            <span className="absolute inset-0 overflow-hidden rounded-md">
                              <img
                                src={image.secure_url}
                                alt=""
                                className="h-full w-full object-cover object-center"
                              />
                            </span>
                            <span
                              className={classNames(
                                selected
                                  ? "ring-indigo-500"
                                  : "ring-transparent",
                                "pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-2",
                              )}
                              aria-hidden="true"
                            />
                          </>
                        )}
                      </Tab>
                    ))}
                  </TabList>
                </div>

                <TabPanels className="aspect-h-1 aspect-w-1 w-full">
                  {productData.photos.map((image) => (
                    <TabPanel key={image.id}>
                      <img
                        src={image.secure_url}
                        alt={image.alt}
                        className="h-full w-full object-cover object-center sm:rounded-lg"
                      />
                    </TabPanel>
                  ))}
                </TabPanels>
              </TabGroup>

              {/* Product info */}
              <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {productData.title}
                </h1>

                <div className="mt-3">
                  <h2 className="sr-only">Product information</h2>
                  <p className="text-3xl tracking-tight text-gray-900">
                    {formatCurrencyINR(productData.price)}
                  </p>
                </div>

                {/* Reviews */}
                {/* <div className="mt-3">
                  <h3 className="sr-only">Reviews</h3>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[0, 1, 2, 3, 4].map((rating) => (
                        <StarIcon
                          key={rating}
                          className={classNames(
                            product.rating > rating
                              ? "text-indigo-500"
                              : "text-gray-300",
                            "h-5 w-5 flex-shrink-0",
                          )}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="sr-only">{product.rating} out of 5 stars</p>
                  </div>
                </div> */}

                <div className="mt-6">
                  <h3 className="sr-only">Description</h3>
                  <div className="mt-10 mb-5 flex">
                    <button
                      type="submit"
                      className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full"
                      onClick={() => AddAndRemoveCart(productData, setCart)}
                    >
                      {cart ? <h4>Added to Cart</h4> : <h4>Add to Cart</h4>}
                    </button>

                    <button
                      type="button"
                      className="ml-4 flex items-center justify-center rounded-md px-3 py-3 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                      onClick={() => AddAndRemoveFav(productData, setFav)}
                    >
                      {fav ? (
                        <h4 className="text-red-700">Added to WishList</h4>
                      ) : (
                        <h4 className="text-red-400">Add to WishList</h4>
                      )}
                    </button>
                  </div>
                  <div
                    className="space-y-6 text-base text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: productData.description,
                    }}
                  />
                </div>

                <form className="mt-6">
                  {/* Colors */}
                  {/* <div>
                    <h3 className="text-sm text-gray-600">Color</h3>

                    <fieldset aria-label="Choose a color" className="mt-2">
                      <RadioGroup
                        value={selectedColor}
                        onChange={setSelectedColor}
                        className="flex items-center space-x-3"
                      >
                        {product.colors.map((color) => (
                          <Radio
                            key={color.name}
                            value={color}
                            aria-label={color.name}
                            className={({ focus, checked }) =>
                              classNames(
                                color.selectedColor,
                                focus && checked ? "ring ring-offset-1" : "",
                                !focus && checked ? "ring-2" : "",
                                "relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none",
                              )
                            }
                          >
                            <span
                              aria-hidden="true"
                              className={classNames(
                                color.bgColor,
                                "h-8 w-8 rounded-full border border-black border-opacity-10",
                              )}
                            />
                          </Radio>
                        ))}
                      </RadioGroup>
                    </fieldset>
                  </div> */}
                </form>

                {/* <section aria-labelledby="details-heading" className="mt-12">
                  <h2 id="details-heading" className="sr-only">
                    Additional details
                  </h2>

                  <div className="divide-y divide-gray-200 border-t">
                    {product.details.map((detail) => (
                      <Disclosure as="div" key={detail.name}>
                        {({ open }) => (
                          <>
                            <h3>
                              <DisclosureButton className="group relative flex w-full items-center justify-between py-6 text-left">
                                <span
                                  className={classNames(
                                    open ? "text-indigo-600" : "text-gray-900",
                                    "text-sm font-medium",
                                  )}
                                >
                                  {detail.name}
                                </span>
                                <span className="ml-6 flex items-center">
                                  {open ? (
                                    <MinusIcon
                                      className="block h-6 w-6 text-indigo-400 group-hover:text-indigo-500"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <PlusIcon
                                      className="block h-6 w-6 text-gray-400 group-hover:text-gray-500"
                                      aria-hidden="true"
                                    />
                                  )}
                                </span>
                              </DisclosureButton>
                            </h3>
                            <DisclosurePanel
                              as="div"
                              className="prose prose-sm pb-6"
                            >
                              <ul role="list">
                                {detail.items.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </DisclosurePanel>
                          </>
                        )}
                      </Disclosure>
                    ))}
                  </div>
                </section> */}
              </div>
            </div>

            <section
              aria-labelledby="related-heading"
              className="mt-10 border-t border-gray-200 px-4 py-16 sm:px-0"
            >
              <h2
                id="related-heading"
                className="text-xl font-bold text-gray-900"
              >
                Customers also bought
              </h2>

              <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
                {related.map((product) => (
                  <div key={product.id}>
                    <AquaProductCard product={product} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </AquaLayout>
  );
}
