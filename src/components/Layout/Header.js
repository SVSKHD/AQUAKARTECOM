import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "@heroicons/react/24/outline";
import { FaUser } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

import LW from "@/assests/logo.png";
import useCartDrawer from "@/utils/drawer";
import useDialog from "@/utils/dialog";
import { getFestivalWish } from "@/utils/festival";
import LazyImage from "../image/LazyImage";

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

  const [festival, setFestival] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  const cartCount = Array.isArray(cartData) ? cartData.length : 0;
  const favCount = Array.isArray(favData) ? favData.length : 0;

  const isActiveRoute = useCallback(
    (href) => router.pathname === href,
    [router.pathname],
  );

  // Festival wish only on mount (or when you decide to change it)
  useEffect(() => {
    setFestival(getFestivalWish());
  }, []);

  // Scroll handler optimized: no state updates per scroll tick, no re-binding listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        const current = window.scrollY;
        const last = lastScrollYRef.current;

        const nextVisible = current < 10 || current < last;

        setIsVisible((prev) => (prev === nextVisible ? prev : nextVisible));

        lastScrollYRef.current = current;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Disclosure
      as="nav"
      className={`fixed inset-x-4 z-50 mx-auto max-w-7xl top-4 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-[150%]"
      }`}
    >
      {({ open }) => (
        <>
          <div className="relative rounded-full border border-white/40 bg-white/70 backdrop-blur-2xl shadow-xl shadow-indigo-500/5 transition-colors duration-500 hover:bg-white/80 hover:shadow-indigo-500/10 hover:border-white/60">
            <div className="relative flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Mobile Menu Button */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden pl-2">
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-white hover:text-indigo-600 focus:outline-none">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon
                      className="block h-6 w-6 transition-transform duration-300 group-hover:rotate-90"
                      aria-hidden="true"
                    />
                  ) : (
                    <Bars3Icon
                      className="block h-6 w-6 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    />
                  )}
                </DisclosureButton>
              </div>

              {/* Logo & Desktop Nav */}
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <Link
                  href="/"
                  className="flex flex-shrink-0 items-center gap-3 group"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <LazyImage
                      imgClassName="h-full w-full object-contain p-1"
                      src={LW}
                      alt="Aquakart"
                      height={100}
                      width={100}
                      priority
                    />
                  </div>
                  <span className="hidden text-xl font-bold tracking-tight text-slate-900 sm:block">
                    Aquakart<span className="text-indigo-600">.</span>
                  </span>

                  {/* Header Festival Pill */}
                  {festival && (
                    <div
                      className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${festival.gradient} bg-opacity-10 opacity-90 transition-transform hover:scale-105 ml-2 cursor-pointer`}
                    >
                      <span className="text-xs">{festival.icon}</span>
                      <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 uppercase tracking-wider">
                        {festival.text}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="hidden sm:ml-10 sm:block">
                  <div className="flex items-center gap-1">
                    {navigation.map((item) => {
                      const active = isActiveRoute(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            "relative rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300",
                            active
                              ? "text-indigo-900 bg-white shadow-md shadow-indigo-100 ring-1 ring-slate-900/5"
                              : "text-slate-500 hover:text-slate-900 hover:bg-white/50",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Icons & User Menu */}
              <div className="absolute inset-y-0 right-0 flex items-center space-x-3 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <button
                  onClick={openFavDrawer}
                  type="button"
                  aria-label="Open favourites"
                  name="Open favourites"
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-slate-500 transition-all duration-300 hover:bg-white hover:text-rose-500 hover:shadow-md hover:scale-105 focus:outline-none"
                >
                  <span className="sr-only">Open favourites</span>
                  <HeartIcon className="h-6 w-6" aria-hidden="true" />
                  {favCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white shadow-sm animate-bounce">
                      {favCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={openCartDrawer}
                  type="button"
                  aria-label="Open cart"
                  name="Open cart"
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-slate-500 transition-all duration-300 hover:bg-white hover:text-emerald-600 hover:shadow-md hover:scale-105 focus:outline-none"
                >
                  <span className="sr-only">Open cart</span>
                  <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-white shadow-sm animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                {userData ? (
                  <Menu as="div" className="relative ml-2">
                    <MenuButton className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95">
                      <span className="sr-only">Open user menu</span>
                      <FaUser className="h-4 w-4" />
                    </MenuButton>

                    <Transition
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95 translate-y-2"
                      enterTo="transform opacity-100 scale-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="transform opacity-100 scale-100 translate-y-0"
                      leaveTo="transform opacity-0 scale-95 translate-y-2"
                    >
                      <MenuItems className="absolute right-0 z-20 mt-4 w-56 origin-top-right rounded-[1.5rem] bg-white/90 backdrop-blur-xl py-2 shadow-2xl ring-1 ring-slate-900/5 focus:outline-none border border-white/50">
                        <div className="px-4 py-3 border-b border-indigo-50 mb-1">
                          <p className="text-xs font-semibold text-slate-400">
                            Signed in as
                          </p>
                          <p className="truncate text-sm font-bold text-slate-800">
                            {userData?.user?.name || "User"}
                          </p>
                        </div>

                        <MenuItem>
                          {({ focus }) => (
                            <Link
                              href="/dashboard"
                              className={classNames(
                                "mx-2 block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                                focus
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-slate-600 hover:bg-slate-50",
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
                              aria-label="Logout"
                              name="Logout"
                              onClick={() =>
                                dispatch({
                                  type: "LOGOUT",
                                  payload: null,
                                })
                              }
                              className={classNames(
                                "mx-2 block w-[calc(100%-16px)] rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors",
                                focus
                                  ? "bg-red-50 text-red-600"
                                  : "text-slate-600 hover:bg-slate-50",
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
                    className="group relative ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-slate-800 focus:outline-none active:scale-95"
                  >
                    <span className="sr-only">Open auth dialog</span>
                    <FaUser className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <Transition
            enter="transition duration-300 ease-out"
            enterFrom="transform scale-95 opacity-0 -translate-y-2"
            enterTo="transform scale-100 opacity-100 translate-y-0"
            leave="transition duration-200 ease-out"
            leaveFrom="transform scale-100 opacity-100 translate-y-0"
            leaveTo="transform scale-95 opacity-0 -translate-y-2"
          >
            <DisclosurePanel className="sm:hidden mt-2">
              <div className="rounded-[2rem] border border-white/40 bg-white/80 backdrop-blur-3xl shadow-2xl p-4 space-y-2 ring-1 ring-black/5">
                {navigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as={Link}
                    href={item.href}
                    className={classNames(
                      "block rounded-2xl px-5 py-4 text-base font-bold transition-all duration-200",
                      isActiveRoute(item.href)
                        ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100 ring-1 ring-indigo-50"
                        : "text-slate-500 hover:bg-white/50 hover:text-slate-900",
                    )}
                    aria-current={isActiveRoute(item.href) ? "page" : undefined}
                  >
                    <div className="flex items-center justify-between">
                      {item.name}
                      {isActiveRoute(item.href) && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  </DisclosureButton>
                ))}
              </div>
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};

export default AquaHeader;
