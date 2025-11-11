import AquaLayout from "@/components/Layout/Layout";
import useCart from "@/utils/cart";
import useCurrency from "@/utils/currency";
import {
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { FaSignInAlt } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { nanoid } from "nanoid";
import moment from "moment";
import { useState, useEffect, useMemo } from "react";
import orderServiceOperations from "@/services/order";
import { useRouter } from "next/router";
import AquaToast from "@/components/reusables/react-toastify";
import Image from "next/image";
import useDialog from "@/utils/dialog";
import useCartDrawer from "../../utils/drawer";
import useProduct from "@/utils/product";
import AquaPromptDialog from "@/components/common/promptDialogs/promtDialog";
import UserServiceOperations from "@/services/user";
import AquaSpinner from "@/components/common/spinner";
import ProfileDetailsDialog from "@/components/common/commonDialogs/profileDetailsDialog";

const addressesMatch = (addressA, addressB) => {
  if (!addressA || !addressB) {
    return false;
  }
  if (addressA._id && addressB._id) {
    return addressA._id === addressB._id;
  }
  return (
    addressA.street === addressB.street &&
    addressA.city === addressB.city &&
    addressA.state === addressB.state &&
    addressA.postalCode === addressB.postalCode
  );
};

const AddressHandHint = ({ text }) => (
  <div className="inline-flex w-full items-center gap-3 rounded-2xl bg-indigo-50/70 px-4 py-3 text-sm font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-100 sm:max-w-md">
    <span className="text-2xl animate-bounce" role="img" aria-hidden="true">
      👆
    </span>
    <span className="text-left">{text}</span>
  </div>
);

const AquaCheckoutComponent = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { cartData, userData } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINR } = useCurrency;
  const { getTotalPrice, changeItemQuantity } = useCart();
  const { closeCartDrawer } = useCartDrawer();
  const { EmptyCart, removeFromCart } = useProduct();
  const { openAuthDialog } = useDialog();

  const [buttonStatus, setButtonStatus] = useState({
    cod: false,
    gateway: false,
  });
  const [selectedAddress, setSelectedAddress] = useState(
    userData?.user?.selectedAddress,
  );
  const [prompt, setPrompt] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    closeCartDrawer();
  }, [closeCartDrawer]);

  const totalItems = cartData?.reduce(
    (count, item) => count + (item.quantity || 0),
    0,
  );
  const hasContactDetails = Boolean(
    userData?.user?.email && userData?.user?.phone,
  );
  const savedAddresses = useMemo(
    () => userData?.user?.addresses ?? [],
    [userData?.user?.addresses],
  );
  const hasAddresses = Boolean(savedAddresses.length);
  const hasSingleAddress = savedAddresses.length === 1;
  const hasMultipleAddresses = savedAddresses.length > 1;
  const payableTotal = Math.max(getTotalPrice() - discount, 0);
  const shouldPromptAddressSelection = hasMultipleAddresses && !selectedAddress;
  const showAddressHandHint = !hasAddresses || shouldPromptAddressSelection;
  const addressHandHintText = !hasAddresses
    ? "Tap “Add address” to unlock delivery options."
    : "Tap an address card to set it for this order.";

  useEffect(() => {
    if (!hasAddresses) return;
    const selectedExists = savedAddresses.some((address) =>
      addressesMatch(address, selectedAddress),
    );
    if (!selectedExists && hasSingleAddress) {
      setSelectedAddress(savedAddresses[0]);
    }
  }, [hasAddresses, hasSingleAddress, savedAddresses, selectedAddress]);

  const getPaymentDisabledReason = ({ processing, type }) => {
    if (processing) {
      return type === "cod"
        ? "We are finalising your COD order. Please wait…"
        : "Processing your payment. Please wait…";
    }
    if (!totalItems) {
      return "Add products to your cart to enable checkout.";
    }
    if (!hasContactDetails) {
      return "Add your email and phone number to continue.";
    }
    if (!hasAddresses) {
      return "Add a delivery address to continue.";
    }
    if (!selectedAddress) {
      return "Select a delivery address to continue.";
    }
    return undefined;
  };

  const payNowDisabledReason = getPaymentDisabledReason({
    processing: buttonStatus.gateway,
    type: "gateway",
  });
  const codDisabledReason = getPaymentDisabledReason({
    processing: buttonStatus.cod,
    type: "cod",
  });

  const steps = useMemo(() => {
    const baseSteps = [
      {
        name: "Cart",
        description: totalItems
          ? `${totalItems} ${totalItems > 1 ? "items" : "item"}`
          : "No products yet",
        done: Boolean(totalItems),
      },
      {
        name: "Contact",
        description: hasContactDetails
          ? "Contact details confirmed"
          : "Add email & phone",
        done: hasContactDetails,
      },
      {
        name: "Delivery",
        description: hasAddresses ? "Address ready" : "Add/select address",
        done: hasAddresses && Boolean(selectedAddress),
      },
      {
        name: "Payment",
        description: "Choose method",
        done: false,
      },
    ];

    const firstIncomplete = baseSteps.findIndex((step) => !step.done);
    return baseSteps.map((step, index) => {
      let status = "upcoming";
      if (step.done && (firstIncomplete === -1 || index < firstIncomplete)) {
        status = "complete";
      } else if (index === firstIncomplete || firstIncomplete === -1) {
        status = "current";
      }
      return { ...step, status };
    });
  }, [hasAddresses, hasContactDetails, selectedAddress, totalItems]);

  const stepStyles = {
    complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
    current: "border-indigo-200 bg-indigo-50 text-indigo-600",
    upcoming: "border-gray-200 bg-white text-gray-400",
  };

  const toDateInputValue = (dob) => {
    if (!dob) return "";
    const parsedDate = new Date(dob);
    if (Number.isNaN(parsedDate.getTime())) return "";
    const year = parsedDate.getFullYear();
    const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
    const day = `${parsedDate.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const profileDialogInitialValues = useMemo(
    () => ({
      email: `${userData?.user?.email ?? ""}`,
      phone: `${userData?.user?.phone ?? ""}`,
      alternatePhone: `${
        userData?.user?.alternatePhone ||
        userData?.user?.alternate_phone ||
        userData?.user?.altPhone ||
        ""
      }`,
      dob: toDateInputValue(userData?.user?.dob),
      address: `${selectedAddress?.street ?? ""}`,
    }),
    [selectedAddress?.street, userData?.user],
  );

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "DISCOUNT10") {
      setDiscount(100);
      setCouponError("");
    } else {
      setDiscount(0);
      setCouponError("Invalid coupon code.");
    }
  };

  const handleAddressChange = (address) => {
    setSelectedAddress(address);

    UserServiceOperations.UserUpdateDetails(
      userData.user._id,
      { newDetails: { selectedAddress: address } },
      userData.token,
    )
      .then(() => {
        AquaToast({
          message: "Successfully selected the address",
          type: "success",
        });
        dispatch({
          type: "UPDATE_SELECTED_ADDRESS",
          payload: { selectedAddress: address },
        });
      })
      .catch((err) => {
        console.error("Error updating selected address:", err);
        AquaToast({ message: "Failed to update address", type: "error" });
      });
  };

  const handleQuantityAdjust = (id, delta) => {
    const product = cartData.find((item) => item._id === id || item.id === id);
    if (!product) return;

    const nextQuantity = Math.min(
      Math.max((product.quantity || 1) + delta, 1),
      5,
    );
    changeItemQuantity(id, nextQuantity);
  };

  const productData = (data) =>
    data.map((item) => ({
      productId: item._id,
      name: item.title,
      price: item.price,
      quantity: item.quantity,
    }));

  const handleCashOnDelivery = () => {
    if (!totalItems) {
      AquaToast({ message: "Please add products to cart", type: "info" });
      return;
    }

    if (!hasContactDetails) {
      AquaToast({
        message: "Please update contact details to proceed",
        type: "error",
      });
      return;
    }

    if (!hasAddresses) {
      AquaToast({ message: "Please add an address", type: "error" });
      return;
    }

    if (!selectedAddress) {
      AquaToast({ message: "Please select an address", type: "error" });
      return;
    }

    setButtonStatus((prev) => ({ ...prev, cod: true }));

    const cashTransactionId = `AQTR-COD-${nanoid(5).toUpperCase()}D${moment(new Date()).format("DDMMYYYY")}`;
    const orderId = `AQOD${moment(new Date()).format("DDMMYYYY")}${nanoid(2).toUpperCase()}`;

    const newOrder = {
      user: userData?.user?._id,
      orderType: "Cash On Delivery",
      items: productData(cartData),
      transactionId: cashTransactionId,
      totalAmount: payableTotal,
      orderId,
      discountAmount: discount,
      paymentMethod: "Cash On Delivery",
      paymentStatus: "Pending",
      currency: "INR",
      billingAddress: selectedAddress,
      shippingAddress: selectedAddress,
      shippingMethod: "Standard",
      shippingCost: 50,
      estimatedDelivery: new Date(
        new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      orderStatus: "Processing",
    };

    orderServiceOperations
      .createCodOrder(newOrder)
      .then((res) => {
        AquaToast({
          message: "COD order created successfully",
          type: "success",
        });
        router.push(`/order/cod/${res.data.transactionId}`);
      })
      .catch((err) => {
        console.error("order", err);
        AquaToast({
          message: "Failed to create COD order",
          type: "error",
        });
      })
      .finally(() => {
        setButtonStatus((prev) => ({ ...prev, cod: false }));
      });
  };

  const handlePhonePayment = () => {
    if (!totalItems) {
      AquaToast({ message: "Please add products to cart", type: "info" });
      return;
    }

    if (!hasContactDetails) {
      AquaToast({
        message: "Please update contact details to proceed",
        type: "error",
      });
      return;
    }

    if (!hasAddresses) {
      AquaToast({ message: "Please add an address", type: "error" });
      return;
    }

    if (!selectedAddress) {
      AquaToast({ message: "Please select an address", type: "error" });
      return;
    }

    const transactionId = `AQTR-PGPP${nanoid(5).toUpperCase()}D${moment(new Date()).format("DDMMYYYY")}`;
    const orderId = `AQOD${moment(new Date()).format("DDMMYYYY")}${nanoid(2).toUpperCase()}`;

    const newOrder = {
      user: userData?.user?._id,
      transactionId,
      orderType: "Payment Method(Phone Pe Gateway)",
      orderId,
      items: cartData.map((item) => ({
        productId: item._id || item.id,
        name: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: payableTotal,
      discountAmount: discount,
      paymentMethod: "OTHER THAN CASH ON DELIVERY",
      paymentStatus: "Pending",
      currency: "INR",
      billingAddress: selectedAddress,
      shippingAddress: selectedAddress,
      shippingMethod: "Standard",
      shippingCost: 50,
      estimatedDelivery: new Date(
        new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      orderStatus: "Processing",
    };

    setButtonStatus((prev) => ({ ...prev, gateway: true }));

    orderServiceOperations
      .createPhonePePayOrder(newOrder)
      .then((res) => {
        setButtonStatus((prev) => ({ ...prev, gateway: false }));
        window.location.href = res.url;
      })
      .catch((err) => {
        console.error("order", err);
        setButtonStatus((prev) => ({ ...prev, gateway: false }));
        AquaToast({
          message: "Failed to initiate payment",
          type: "error",
        });
      });
  };

  const handleUpdateDetails = async (values) => {
    if (!userData?.user?._id) return;

    setIsProfileSaving(true);

    const sanitize = (value) => {
      if (value === null || value === undefined) {
        return "";
      }

      const stringValue =
        typeof value === "string" ? value : String(value ?? "");
      return stringValue.trim();
    };

    const payload = {
      newDetails: {
        email: sanitize(values.email),
        phone: sanitize(values.phone),
        alternatePhone: sanitize(values.alternatePhone),
        dob: sanitize(values.dob),
      },
    };

    try {
      const response = await UserServiceOperations.UserUpdateDetails(
        userData.user._id,
        payload,
        userData.token,
      );

      dispatch({
        type: "UPDATE_USER_DETAILS",
        payload: response.data,
      });
      AquaToast({ message: "Profile details updated", type: "success" });
      setProfileDialogOpen(false);
    } catch (error) {
      console.error("Failed to update details", error);
      AquaToast({
        message: "Unable to update details. Please try again",
        type: "error",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleEditAddress = (event, address) => {
    event.preventDefault();
    dispatch({ type: "SET_ADDRESS_DIALOG", payload: true });
    dispatch({ type: "SET_ADDRESS_DATA", payload: address });
  };

  const handleAddAddress = () => {
    dispatch({ type: "SET_ADDRESS_DIALOG", payload: true });
    dispatch({ type: "SET_ADDRESS_DATA", payload: null });
  };

  const handleDeleteAddress = (event, address) => {
    event.preventDefault();
    setPrompt(true);
    setDeleteId(address._id);
  };

  const handleRemoveProduct = (product) => {
    removeFromCart(product._id || product.id);
  };

  const handleDeleteAddressDialog = (event) => {
    event.preventDefault();
    const addresses = userData.user.addresses.filter(
      (item) => item._id !== deleteId,
    );
    const payload = {
      newDetails: {
        addresses,
      },
    };

    UserServiceOperations.UserUpdateDetails(
      userData.user._id,
      payload,
      userData.token,
    )
      .then((res) => {
        dispatch({
          type: "UPDATE_USER_ADDRESSES",
          payload: { addresses: res.data.addresses },
        });
        dispatch({ type: "SET_ADDRESS_DIALOG", payload: false });
        setPrompt(false);
        AquaToast({
          message: "Successfully updated address",
          type: "success",
        });
      })
      .catch(() => {
        AquaToast({
          message: "Please try adding a new address",
          type: "error",
        });
      });
  };

  const seo = {
    title: "Aquakart | Cart",
  };

  return (
    <AquaLayout seo={seo}>
      <AquaPromptDialog
        open={prompt}
        close={() => setPrompt(false)}
        title="Address Delete Confirmation"
        handleCancel={() => setPrompt(false)}
        handleOk={handleDeleteAddressDialog}
      />

      {!userData ? (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <div className="flex max-w-md flex-col items-center rounded-3xl bg-white p-10 text-center shadow-xl">
            <FaSignInAlt className="mb-4 h-16 w-16 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-800">Login required</h2>
            <p className="mt-3 text-sm text-gray-600">
              Please sign in to review your cart and finish checkout.
            </p>
            <button
              type="button"
              onClick={openAuthDialog}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              <FaSignInAlt className="mr-2 h-4 w-4" />
              Login to continue
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8">
              <div>
                <p className="text-sm font-medium text-indigo-600">
                  {totalItems
                    ? `Almost there — ${totalItems} ${totalItems > 1 ? "items" : "item"} in cart`
                    : "Your cart is waiting"}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                  Checkout
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-500">
                  Confirm your details, choose an address, and pick a payment
                  method.
                </p>
              </div>

              <nav className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                <ol className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {steps.map((step, index) => (
                    <li
                      key={step.name}
                      className="flex w-full items-center gap-3"
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${stepStyles[step.status]}`}
                      >
                        {step.status === "complete" ? (
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {step.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {step.description}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <div className="space-y-8">
                  <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Cart items
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Review your selections before moving to payment.
                        </p>
                      </div>
                      {totalItems > 1 && (
                        <button
                          type="button"
                          onClick={() => EmptyCart()}
                          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100"
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                          Clear cart
                        </button>
                      )}
                    </div>

                    {totalItems ? (
                      <ul className="mt-6 space-y-6">
                        {cartData.map((product) => {
                          const productId = product._id || product.id;
                          const imageSrc =
                            product?.photos?.[0]?.secure_url ||
                            product?.image ||
                            product?.thumbnail ||
                            "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png";
                          const resolvedSubtitle =
                            typeof product?.subtitle === "string"
                              ? product.subtitle
                              : product?.subtitle?.label ||
                                product?.subtitle?.title ||
                                "";
                          const resolvedCategory =
                            typeof product?.category === "string"
                              ? product.category
                              : product?.category?.title ||
                                product?.category?.name ||
                                "";
                          const secondaryLabel =
                            resolvedSubtitle ||
                            resolvedCategory ||
                            "Aquakart product";

                          return (
                            <li
                              key={productId}
                              className="flex flex-col gap-4 rounded-2xl border border-gray-100 p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:flex-row sm:items-start sm:gap-6"
                            >
                              <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-gray-100 sm:h-24 sm:w-28">
                                <Image
                                  src={imageSrc}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                  <h3 className="text-base font-semibold text-gray-900">
                                    {product.title}
                                  </h3>
                            
                                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                                    <CheckIcon
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                    {product.inStock || product.stock
                                      ? "In stock"
                                      : product.leadTime
                                        ? `Ships in ${product.leadTime}`
                                        : "Ships soon"}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                  <p className="text-lg font-semibold text-gray-900">
                                    {formatCurrencyINR(product.discountPrice)}
                                  </p>
                                  <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-900">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuantityAdjust(productId, -1)
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
                                    >
                                      -
                                    </button>
                                    <span className="min-w-[2ch] text-center">
                                      {product.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuantityAdjust(productId, 1)
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProduct(product)}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-red-600"
                                  >
                                    <XMarkIcon
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Your cart is empty
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Add products to your cart to see them here.
                        </p>
                        <button
                          type="button"
                          onClick={() => router.push("/shop")}
                          className="mt-4 inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                        >
                          Browse products
                        </button>
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Contact details
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          We’ll use these details for order updates and delivery
                          coordination.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileDialogOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100"
                      >
                        <PencilIcon className="h-4 w-4" aria-hidden="true" />
                        Update details
                      </button>
                    </div>

                    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-gray-100 p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Email
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {userData?.user?.email || "Not provided"}
                        </dd>
                        <span
                          className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            userData?.user?.email
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {userData?.user?.email ? "Verified" : "Required"}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-gray-100 p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Phone
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {userData?.user?.phone || "Not provided"}
                        </dd>
                        <span
                          className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            userData?.user?.phone
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {userData?.user?.phone ? "Verified" : "Required"}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-gray-100 p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Alternate phone
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {profileDialogInitialValues.alternatePhone ||
                            "Optional"}
                        </dd>
                      </div>
                      <div className="rounded-2xl border border-gray-100 p-4">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Date of birth
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {userData?.user?.dob
                            ? moment(userData.user.dob).format("DD MMM YYYY")
                            : "Add DOB for personalised offers"}
                        </dd>
                      </div>
                    </dl>

                    {!hasContactDetails && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        Add your email and phone number to enable payment
                        options.
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          Delivery address
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Select where you would like your order delivered.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddAddress}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100"
                      >
                        + Add address
                      </button>
                    </div>

                    {showAddressHandHint && (
                      <div className="mt-4 flex items-center justify-start">
                        <AddressHandHint text={addressHandHintText} />
                      </div>
                    )}

                    {hasSingleAddress && selectedAddress && (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        Using your saved address automatically. You can edit it
                        below if needed.
                      </div>
                    )}

                    {shouldPromptAddressSelection && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Multiple addresses found. Tap one of the cards to choose
                        where we should deliver this order.
                      </div>
                    )}

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {hasAddresses ? (
                        savedAddresses.map((address) => {
                          const isSelected = addressesMatch(
                            selectedAddress,
                            address,
                          );
                          return (
                            <label
                              key={address._id || address.street}
                              className={`relative flex cursor-default flex-col gap-3 rounded-2xl border p-4 transition duration-200 ease-out transform hover:-translate-y-0.5 hover:shadow-md hover:cursor-pointer ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                  : "border-gray-200 bg-white hover:border-indigo-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name="delivery-address"
                                className="sr-only"
                                checked={isSelected}
                                onChange={() => handleAddressChange(address)}
                              />
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {address?.label || "Saved address"}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {[
                                      address.street,
                                      address.city,
                                      address.state,
                                      address.postalCode,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                </div>
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-indigo-600">
                                    <CheckIcon
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={(event) =>
                                    handleEditAddress(event, address)
                                  }
                                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500"
                                >
                                  <PencilIcon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) =>
                                    handleDeleteAddress(event, address)
                                  }
                                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-500"
                                >
                                  <TrashIcon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Delete
                                </button>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                          <h3 className="text-lg font-semibold text-gray-900">
                            No address added
                          </h3>
                          <p className="mt-2 text-sm text-gray-500">
                            Add a delivery address to speed up checkout next
                            time.
                          </p>
                          <button
                            type="button"
                            onClick={handleAddAddress}
                            className="mt-4 inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                          >
                            Add your first address
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <aside className="space-y-6 lg:sticky lg:top-28">
                  <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Order summary
                    </h2>
                    <dl className="mt-6 space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <dt>Subtotal</dt>
                        <dd className="font-medium text-gray-900">
                          {formatCurrencyINR(getTotalPrice())}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <dt>Discount</dt>
                        <dd className="font-medium text-gray-900">
                          {discount > 0
                            ? `- ${formatCurrencyINR(discount)}`
                            : formatCurrencyINR(0)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <dt>Shipping</dt>
                        <dd className="font-medium text-gray-900">
                          Calculated at delivery
                        </dd>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-base font-semibold text-gray-900">
                        <dt>Total payable</dt>
                        <dd>{formatCurrencyINR(payableTotal)}</dd>
                      </div>
                    </dl>

                    <div className="mt-6">
                      <label
                        htmlFor="coupon-code"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Have a coupon?
                      </label>
                      <div className="mt-2 flex gap-2">
                        <input
                          id="coupon-code"
                          name="coupon-code"
                          type="text"
                          value={couponCode}
                          onChange={(event) =>
                            setCouponCode(event.target.value.toUpperCase())
                          }
                          placeholder="Enter coupon"
                          className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          {couponError}
                        </p>
                      )}
                      {discount > 0 && !couponError && (
                        <p className="mt-2 text-xs font-medium text-emerald-600">
                          Coupon applied! You saved{" "}
                          {formatCurrencyINR(discount)}.
                        </p>
                      )}
                    </div>

                    <div className="mt-6 grid gap-3">
                      <div className="group relative">
                        <button
                          type="button"
                          onClick={handlePhonePayment}
                          disabled={Boolean(payNowDisabledReason)}
                          title={payNowDisabledReason ?? undefined}
                          className={`inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold shadow-sm transition ${
                            payNowDisabledReason
                              ? "cursor-not-allowed bg-indigo-300 text-white"
                              : "bg-indigo-600 text-white hover:bg-indigo-500"
                          }`}
                        >
                          {buttonStatus.gateway ? (
                            <span className="flex items-center">
                              <AquaSpinner color="white" />
                              <span className="ml-2">Processing…</span>
                            </span>
                          ) : (
                            "Pay now"
                          )}
                        </button>
                        {payNowDisabledReason && (
                          <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                            {payNowDisabledReason}
                          </span>
                        )}
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={handleCashOnDelivery}
                          disabled={Boolean(codDisabledReason)}
                          title={codDisabledReason ?? undefined}
                          className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition ${
                            codDisabledReason
                              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                              : "border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                          }`}
                        >
                          {buttonStatus.cod ? (
                            <span className="flex items-center">
                              <AquaSpinner color="gray" />
                              <span className="ml-2">Processing…</span>
                            </span>
                          ) : (
                            "Cash on delivery"
                          )}
                        </button>
                        {codDisabledReason && (
                          <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                            {codDisabledReason}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push("/shop")}
                        className="inline-flex items-center justify-center rounded-full border border-transparent px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                      >
                        Continue shopping
                      </button>
                    </div>

                    {!hasContactDetails && (
                      <p className="mt-4 text-xs text-amber-600">
                        Update your contact details to enable payment options.
                      </p>
                    )}
                    {!selectedAddress && hasAddresses && (
                      <p className="mt-2 text-xs text-amber-600">
                        Select an address to complete your order.
                      </p>
                    )}
                  </section>

                  <section className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5 text-sm text-indigo-900">
                    <h3 className="text-base font-semibold">Need help?</h3>
                    <p className="mt-2 text-sm text-indigo-800">
                      Call or WhatsApp us at{" "}
                      <span className="font-semibold">+91 96186 06807</span> for
                      any assistance with your order.
                    </p>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfileDetailsDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        initialValues={profileDialogInitialValues}
        onSubmit={handleUpdateDetails}
        isSubmitting={isProfileSaving}
        focusField={
          !userData?.user?.email
            ? "email"
            : !userData?.user?.phone
              ? "phone"
              : undefined
        }
      />
    </AquaLayout>
  );
};

export default AquaCheckoutComponent;
