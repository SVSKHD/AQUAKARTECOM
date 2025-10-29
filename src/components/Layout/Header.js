import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  HeartIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { FaUser } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

import LW from "@/assests/logo.png";
import useCartDrawer from "@/utils/drawer";
import useDialog from "@/utils/dialog";

const navigation = [
  { name: "Shop", href: "/shop" },
  { name: "Compare", href: "/compare" },
  { name: "Realtime", href: "/softeners_hyderabad" },
  { name: "Know More", href: "/blogs" },
];

const classNames = (...classes) => classes.filter(Boolean).join(" ");

const AquaHeader = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { openCartDrawer, openFavDrawer } = useCartDrawer();
  const { openAuthDialog } = useDialog();
  const { userData, cartData, favData } = useSelector((state) => ({
    ...state,
  }));

  const cartCount = Array.isArray(cartData) ? cartData.length : 0;
  const favCount = Array.isArray(favData) ? favData.length : 0;

  const isActiveRoute = (href) => router.pathname === href;

  return (
    <Disclosure
      as="nav"
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md"
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-2">
            <div className="relative flex h-16 items-center justify-between rounded-full border border-slate-200/70 bg-white px-3 text-slate-800 shadow-lg transition-all duration-300">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <DisclosureButton className="relative inline-flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-900/10 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2 focus:ring-offset-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </DisclosureButton>
              </div>

              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <Link
                  href="/"
                  className="flex flex-shrink-0 items-center gap-2"
                >
                  <Image
                    className="h-9 w-auto drop-shadow"
                    src={LW}
                    alt="Aquakart"
                    height={100}
                    width={100}
                  />
                  <span className="hidden text-lg font-semibold tracking-wide text-slate-900 sm:block">
                    Aquakart
                  </span>
                </Link>

                <div className="hidden sm:ml-10 sm:block">
                  <div className="flex items-center gap-2">
                    {navigation.map((item) => {
                      const active = isActiveRoute(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            "relative overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition duration-300 ease-out",
                            active
                              ? "text-slate-900"
                              : "text-slate-600 hover:text-slate-900",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            {item.name}
                          </span>
                          <span
                            aria-hidden="true"
                            className={classNames(
                              "absolute inset-0 rounded-full bg-slate-900/10 transition-transform duration-300 ease-out",
                              active
                                ? "scale-100 opacity-100"
                                : "scale-50 opacity-0",
                            )}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-1 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <button
                  onClick={openFavDrawer}
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/5 text-slate-600 transition hover:bg-slate-900/10 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2 focus:ring-offset-white"
                >
                  <span className="sr-only">Open favourites</span>
                  <HeartIcon className="h-6 w-6" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-xs text-white ring-2 ring-white">
                    {favCount}
                  </span>
                </button>

                <button
                  onClick={openCartDrawer}
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/5 text-slate-600 transition hover:bg-slate-900/10 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2 focus:ring-offset-white"
                >
                  <span className="sr-only">Open cart</span>
                  <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-xs text-white ring-2 ring-white">
                    {cartCount}
                  </span>
                </button>

                {userData ? (
                  <Menu as="div" className="relative ml-1">
                    <div>
                      <MenuButton className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white to-white/70 text-slate-700 shadow focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2 focus:ring-offset-white">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Open user menu</span>
                        <FaUser className="h-5 w-5" />
                      </MenuButton>
                    </div>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <MenuItems className="absolute right-0 z-10 mt-3 w-48 origin-top-right rounded-2xl bg-white py-2 shadow-2xl ring-1 ring-slate-900/10">
                        <MenuItem>
                          {({ focus }) => (
                            <Link
                              href="/dashboard"
                              className={classNames(
                                "block rounded-lg px-4 py-2 text-sm transition",
                                focus
                                  ? "bg-indigo-50 text-indigo-600"
                                  : "text-slate-700",
                              )}
                            >
                              Dashboard
                            </Link>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              type="button"
                              onClick={() =>
                                dispatch({
                                  type: "LOGOUT",
                                  payload: null,
                                })
                              }
                              className={classNames(
                                "block w-full rounded-lg px-4 py-2 text-left text-sm transition",
                                focus
                                  ? "bg-red-50 text-red-600"
                                  : "text-slate-700",
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Transition>
                  </Menu>
                ) : (
                  <button
                    type="button"
                    onClick={openAuthDialog}
                    className="relative ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/5 text-slate-600 transition hover:bg-slate-900/10 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2 focus:ring-offset-white"
                  >
                    <span className="sr-only">Open auth dialog</span>
                    <UserIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <DisclosurePanel className="sm:hidden">
            <div className="space-y-2 px-4 pb-4 pt-2">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={classNames(
                    "block rounded-full px-4 py-2 text-base font-medium transition",
                    isActiveRoute(item.href)
                      ? "bg-slate-900/10 text-slate-900"
                      : "text-slate-600 hover:bg-slate-900/10 hover:text-slate-900",
                  )}
                  aria-current={isActiveRoute(item.href) ? "page" : undefined}
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
};

export default AquaHeader;
