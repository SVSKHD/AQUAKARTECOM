import { useState, useEffect } from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import ProductServiceOperations from "@/services/products";
import useCurrency from "@/utils/currency";
import useProduct from "@/utils/product";
import { FaHeart, FaCartPlus } from "react-icons/fa";
import { useSelector } from "react-redux";
import AquaProductCard from "@/components/cards/productCard";
import LOGO from "../../assests/Default.png";
import useScreenSize from "@/utils/screenSizer"; // Import the useScreenSize hook

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AquaDynamicProductComponent() {
  const [productData, setProductData] = useState(null);
  const [related, setRelatedData] = useState([]);
  const [cart, setCart] = useState(false);
  const [fav, setFav] = useState(false);
  const { formatCurrencyINR } = useCurrency;
  const { AddAndRemoveCart, AddAndRemoveFav } = useProduct();
  const screenSize = useScreenSize(); // Use the useScreenSize hook

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
      ProductServiceOperations.ProductsByQuery(id).then((res) => {
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

  const seo = {
    title: `Aquakart | ${productData.title}`,
    image: `${productData?.photos ? productData?.photos[0].secure_url : LOGO}`,
    keywords: `Aquakart Products ${productData?.keywords}`,
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.asPath}`,
  };

  console.log("productData", productData);
  return (
    <AquaLayout seo={seo}>
      <div className="bg-white">
        <main className="mx-auto max-w-7xl sm:px-6 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
              {/* Image gallery */}
              <div className={screenSize.width >= 1024 ? "sticky top-0" : ""}>
                <TabGroup className="flex flex-col-reverse">
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
                                  alt={`${productData.title} | Aquakart prodcuts`}
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
                          height={450}
                          width={300}
                        />
                        <button
                          onClick={() => AddAndRemoveFav(productData, setFav)}
                          className="absolute top-2 right-2 z-10 p-1 bg-gray-600 p-3 rounded-full  border-none focus:outline-none"
                        >
                          <FaHeart
                            aria-hidden="true"
                            size={30}
                            className={`${fav ? "text-red-500" : "text-gray-300"} hover:text-red-500 transition duration-300`}
                          />
                        </button>
                      </TabPanel>
                    ))}
                  </TabPanels>
                </TabGroup>
                <div className="mt-10 mb-5 flex flex-col sm:flex-row sm:space-x-4 items-center">
  {/* Add to Cart Button */}
  <button
    type="submit"
    className={`${
      cart ? "w-full sm:flex-1" : "w-full"
    } flex items-center justify-center rounded-full bg-[#0A3981] px-6 py-3 text-base font-medium text-white hover:bg-[#082c65] focus:outline-none focus:ring-2 focus:ring-[#0A3981] focus:ring-offset-2 transition duration-300 ease-in-out`}
    onClick={() => AddAndRemoveCart(productData, setCart)}
  >
    {cart ? (
      <h4 className="font-bold text-xl">Added to Cart</h4>
    ) : (
      <h4 className="font-bold text-xl">Add to Cart</h4>
    )}
  </button>

  {/* Checkout Button */}
  {cart && (
    <a
      type="button"
      className="mt-4 sm:mt-0 w-full sm:w-32 flex items-center justify-center rounded-full bg-[#6B7280] px-6 py-3 text-base font-medium text-white hover:bg-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#6B7280] focus:ring-offset-2 transition duration-300 ease-in-out"
      href="/checkout"
    >
      <FaCartPlus size={20} className="mr-2" />
      <span>Checkout</span>
    </a>
  )}
</div>

<div className="mt-5">
  <h1 className="text-2xl font-bold mb-4">Category</h1>
  <div
    className={`grid gap-4 ${
      true /* Condition for single card */
        ? "grid-cols-1"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    }`}
  >
    {/* Single Category Card */}
    <div
      className="relative group h-56 w-full rounded-lg overflow-hidden cursor-pointer shadow-lg"
      onClick={() => window.location.href = "/category/electronics"}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundImage: `url(${productData?.category?.photos[0]?.secure_url})` }}
      ></div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-40 transition-all duration-300"></div>

      {/* Category Title */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <h2 className="text-white text-lg font-semibold group-hover:text-2xl transition-all duration-300">
          {productData?.category?.title}
        </h2>
      </div>
    </div>
  </div>
</div>
              </div>

              {/* Product info */}
              <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0 lg:ml-8 lg:max-h-[calc(100vh-20px)] lg:overflow-y-auto no-scrollbar">
                <h1 className="text-3xl font-medium tracking-tight text-gray-900">
                  {productData.title}
                </h1>

                <div className="mt-3">
                  <h2 className="sr-only">Product information</h2>
                  <p className="text-3xl tracking-tight text-gray-900 font-semibold">
                    {formatCurrencyINR(productData.price)}
                  </p>
                </div>

                <div className="mt-6">
                  <div
                    className="space-y-6 text-base text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: productData.description,
                    }}
                  />
                </div>
              </div>
            </div>

            {related.length > 0 && (
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
            )}
          </div>
        </main>
      </div>
    </AquaLayout>
  );
}
