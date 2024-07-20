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
  ShoppingCartIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import orderServiceOperations from "@/services/order";
import useCurrency from "@/utils/currency";
import moment from "moment";
import Link from "next/link";

const currencies = ["CAD", "USD", "AUD", "EUR", "GBP"];
const navigation = {
  categories: [
    {
      name: "Women",
      featured: [
        { name: "Sleep", href: "#" },
        { name: "Swimwear", href: "#" },
        { name: "Underwear", href: "#" },
      ],
      collection: [
        { name: "Everything", href: "#" },
        { name: "Core", href: "#" },
        { name: "New Arrivals", href: "#" },
        { name: "Sale", href: "#" },
      ],
      categories: [
        { name: "Basic Tees", href: "#" },
        { name: "Artwork Tees", href: "#" },
        { name: "Bottoms", href: "#" },
        { name: "Underwear", href: "#" },
        { name: "Accessories", href: "#" },
      ],
      brands: [
        { name: "Full Nelson", href: "#" },
        { name: "My Way", href: "#" },
        { name: "Re-Arranged", href: "#" },
        { name: "Counterfeit", href: "#" },
        { name: "Significant Other", href: "#" },
      ],
    },
    {
      name: "Men",
      featured: [
        { name: "Casual", href: "#" },
        { name: "Boxers", href: "#" },
        { name: "Outdoor", href: "#" },
      ],
      collection: [
        { name: "Everything", href: "#" },
        { name: "Core", href: "#" },
        { name: "New Arrivals", href: "#" },
        { name: "Sale", href: "#" },
      ],
      categories: [
        { name: "Artwork Tees", href: "#" },
        { name: "Pants", href: "#" },
        { name: "Accessories", href: "#" },
        { name: "Boxers", href: "#" },
        { name: "Basic Tees", href: "#" },
      ],
      brands: [
        { name: "Significant Other", href: "#" },
        { name: "My Way", href: "#" },
        { name: "Counterfeit", href: "#" },
        { name: "Re-Arranged", href: "#" },
        { name: "Full Nelson", href: "#" },
      ],
    },
  ],
  pages: [
    { name: "Company", href: "#" },
    { name: "Stores", href: "#" },
  ],
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState({});
  const { formatCurrencyINR } = useCurrency;
  const formattedDate = moment(order.createdAt).format("DD MMM YYYY");
  useEffect(() => {
    orderServiceOperations
      .getOrder(id)
      .then((res) => {
        setOrder(res.data.data);
      })
      .catch(() => {
        console.log("err");
      });
  }, [id]);
  const Seo = {
    title: "Aquakart | orders",
  };
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-50">
      {/* Mobile menu */}
      <Dialog open={open} onClose={setOpen} className="relative z-40 lg:hidden">
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
                onClick={() => setOpen(false)}
                className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>

            {/* Links */}
            <TabGroup className="mt-2">
              <div className="border-b border-gray-200">
                <TabList className="-mb-px flex space-x-8 px-4">
                  {navigation.categories.map((category) => (
                    <Tab
                      key={category.name}
                      className="flex-1 whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-base font-medium text-gray-900 data-[selected]:border-indigo-600 data-[selected]:text-indigo-600"
                    >
                      {category.name}
                    </Tab>
                  ))}
                </TabList>
              </div>
              <TabPanels as={Fragment}>
                {navigation.categories.map((category, categoryIdx) => (
                  <TabPanel
                    key={category.name}
                    className="space-y-12 px-4 pb-6 pt-10"
                  >
                    <div className="grid grid-cols-1 items-start gap-x-6 gap-y-10">
                      <div className="grid grid-cols-1 gap-x-6 gap-y-10">
                        <div>
                          <p
                            id={`mobile-featured-heading-${categoryIdx}`}
                            className="font-medium text-gray-900"
                          >
                            Featured
                          </p>
                          <ul
                            role="list"
                            aria-labelledby={`mobile-featured-heading-${categoryIdx}`}
                            className="mt-6 space-y-6"
                          >
                            {category.featured.map((item) => (
                              <li key={item.name} className="flex">
                                <a href={item.href} className="text-gray-500">
                                  {item.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p
                            id="mobile-categories-heading"
                            className="font-medium text-gray-900"
                          >
                            Categories
                          </p>
                          <ul
                            role="list"
                            aria-labelledby="mobile-categories-heading"
                            className="mt-6 space-y-6"
                          >
                            {category.categories.map((item) => (
                              <li key={item.name} className="flex">
                                <a href={item.href} className="text-gray-500">
                                  {item.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-x-6 gap-y-10">
                        <div>
                          <p
                            id="mobile-collection-heading"
                            className="font-medium text-gray-900"
                          >
                            Collection
                          </p>
                          <ul
                            role="list"
                            aria-labelledby="mobile-collection-heading"
                            className="mt-6 space-y-6"
                          >
                            {category.collection.map((item) => (
                              <li key={item.name} className="flex">
                                <a href={item.href} className="text-gray-500">
                                  {item.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p
                            id="mobile-brand-heading"
                            className="font-medium text-gray-900"
                          >
                            Brands
                          </p>
                          <ul
                            role="list"
                            aria-labelledby="mobile-brand-heading"
                            className="mt-6 space-y-6"
                          >
                            {category.brands.map((item) => (
                              <li key={item.name} className="flex">
                                <a href={item.href} className="text-gray-500">
                                  {item.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
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
                        aria-hidden="true"
                        className="h-5 w-5 text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <AquaLayout seo={Seo}>
        <main className="mx-auto max-w-2xl pb-24 pt-8 sm:px-6 sm:pt-16 lg:max-w-7xl lg:px-8">
          <div className="space-y-2 px-4 sm:flex sm:items-baseline sm:justify-between sm:space-y-0 sm:px-0">
            <div className="flex sm:items-baseline sm:space-x-4">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Order #{order.orderId} -{" "}
                {order.orderType === "Cash On Delivery"
                  ? "Cash On Delivery"
                  : "Online Payment"}
              </h1>
              {/* {JSON.stringify(order)} */}
              <Link
                href="#"
                className="hidden text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:block"
              >
                View invoice
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              Order placed{" "}
              <time dateTime="2021-03-22" className="font-medium text-gray-900">
                {formattedDate}
              </time>
            </p>
            <a
              href="#"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:hidden"
            >
              View invoice
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </div>

          {/* Products */}
          <section aria-labelledby="products-heading" className="mt-6">
            <h2 id="products-heading" className="sr-only">
              Products purchased
            </h2>

            <div className="space-y-8">
              {order?.items?.map((product) => (
                <div
                  key={product.id}
                  className="border-b border-t border-gray-200 bg-white shadow-sm sm:rounded-lg sm:border"
                >
                  <div className="px-4 py-6 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-8">
                    <div className="sm:flex lg:col-span-7">
                      <div className="mt-6 sm:ml-6 sm:mt-0">
                        <h3 className="text-base font-medium text-gray-900">
                          <Link href={`/product/${product.productId}`}>
                            {product.name}
                          </Link>
                        </h3>
                        <p className="mt-2 text-sm font-medium text-green-900">
                          {formatCurrencyINR(product.price)}
                        </p>
                        <p className="mt-3 text-sm text-gray-500">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 lg:col-span-5 lg:mt-0">
                      <dl className="grid grid-cols-2 gap-x-6 text-sm">
                        <div>
                          <dt className="font-medium text-gray-900">
                            Delivery address
                          </dt>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-900">
                            Shipping updates
                          </dt>
                          <dd className="mt-3 space-y-3 text-gray-500">
                            <p>{product.email}</p>
                            <p>{product.phone}</p>
                            <button
                              type="button"
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              Edit
                            </button>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 px-4 py-6 sm:px-6 lg:p-8">
                    <h4 className="sr-only">Status</h4>
                    <p className="text-sm font-medium text-gray-900">
                      {product.status} on{" "}
                      <time dateTime={product.datetime}>{product.date}</time>
                    </p>
                    <div aria-hidden="true" className="mt-6">
                      <div className="overflow-hidden rounded-full bg-gray-200">
                        <div
                          style={{
                            width: `calc((${product.step} * 2 + 1) / 8 * 100%)`,
                          }}
                          className="h-2 rounded-full bg-indigo-600"
                        />
                      </div>
                      <div className="mt-6 hidden grid-cols-4 text-sm font-medium text-gray-600 sm:grid">
                        <div className="text-indigo-600">Order placed</div>
                        <div
                          className={classNames(
                            product.step > 0 ? "text-indigo-600" : "",
                            "text-center",
                          )}
                        >
                          Processing
                        </div>
                        <div
                          className={classNames(
                            product.step > 1 ? "text-indigo-600" : "",
                            "text-center",
                          )}
                        >
                          Shipped
                        </div>
                        <div
                          className={classNames(
                            product.step > 2 ? "text-indigo-600" : "",
                            "text-right",
                          )}
                        >
                          Delivered
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Billing */}
          {order.orderType === "Cash On Delivery" ? (
            <dl className="space-y-6 border-t border-gray-200 pt-10 text-sm">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-900">Total</dt>
                <dd className="text-gray-900 font-bold text-green-600">
                  {formatCurrencyINR(order.totalAmount)}
                </dd>
              </div>
            </dl>
          ) : (
            <section aria-labelledby="summary-heading" className="mt-16">
              <h2 id="summary-heading" className="sr-only">
                Billing Summary
              </h2>

              <div className="bg-gray-100 px-4 py-6 sm:rounded-lg sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8 lg:py-8">
                <dl className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-2 md:gap-x-8 lg:col-span-7">
                  <div>
                    <dt className="font-medium text-gray-900">
                      Billing address
                    </dt>
                    <dd className="mt-3 text-gray-500">
                      <span className="block">Floyd Miles</span>
                      <span className="block">7363 Cynthia Pass</span>
                      <span className="block">Toronto, ON N3Y 4H8</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">
                      Payment information
                    </dt>
                    <dd className="-ml-4 -mt-1 flex flex-wrap">
                      <div className="ml-4 mt-4 flex-shrink-0">
                        <svg
                          width={36}
                          height={24}
                          viewBox="0 0 36 24"
                          aria-hidden="true"
                          className="h-6 w-auto"
                        >
                          <rect rx={4} fill="#224DBA" width={36} height={24} />
                          <path
                            d="M10.925 15.673H8.874l-1.538-6c-.073-.276-.228-.52-.456-.635A6.575 6.575 0 005 8.403v-.231h3.304c.456 0 .798.347.855.75l.798 4.328 2.05-5.078h1.994l-3.076 7.5zm4.216 0h-1.937L14.8 8.172h1.937l-1.595 7.5zm4.101-5.422c.057-.404.399-.635.798-.635a3.54 3.54 0 011.88.346l.342-1.615A4.808 4.808 0 0020.496 8c-1.88 0-3.248 1.039-3.248 2.481 0 1.097.969 1.673 1.653 2.02.74.346 1.025.577.968.923 0 .519-.57.75-1.139.75a4.795 4.795 0 01-1.994-.462l-.342 1.616a5.48 5.48 0 002.108.404c2.108.057 3.418-.981 3.418-2.539 0-1.962-2.678-2.077-2.678-2.942zm9.457 5.422L27.16 8.172h-1.652a.858.858 0 00-.798.577l-2.848 6.924h1.994l.398-1.096h2.45l.228 1.096h1.766zm-2.905-5.482l.57 2.827h-1.596l1.026-2.827z"
                            fill="#fff"
                          />
                        </svg>
                        <p className="sr-only">Visa</p>
                      </div>
                      <div className="ml-4 mt-4">
                        <p className="text-gray-900">Ending with 4242</p>
                        <p className="text-gray-600">Expires 02 / 24</p>
                      </div>
                    </dd>
                  </div>
                </dl>

                <dl className="mt-8 divide-y divide-gray-200 text-sm lg:col-span-5 lg:mt-0">
                  <div className="flex items-center justify-between pb-4">
                    <dt className="text-gray-600">Subtotal</dt>
                    <dd className="font-medium text-gray-900">$72</dd>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-gray-600">Shipping</dt>
                    <dd className="font-medium text-gray-900">$5</dd>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-gray-600">Tax</dt>
                    <dd className="font-medium text-gray-900">$6.16</dd>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <dt className="font-medium text-gray-900">Order total</dt>
                    <dd className="font-medium text-indigo-600">$83.16</dd>
                  </div>
                </dl>
              </div>
            </section>
          )}
        </main>
      </AquaLayout>
    </div>
  );
}
