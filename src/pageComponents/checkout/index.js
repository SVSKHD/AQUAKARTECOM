import AquaLayout from "@/components/Layout/Layout";
import useCart from "@/utils/cart";
import useCurrency from "@/utils/currency";
import {
  CheckIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useSelector, useDispatch } from "react-redux";
import { nanoid } from "nanoid";
import moment from "moment";
import { useState, useEffect } from "react";
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
import AquaInput from "@/components/common/input";

const AquaCheckoutComponent = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { cartData, userData } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINR } = useCurrency;

  const { getTotalPrice, changeItemQuantity } = useCart();
  const [selectedAddress, setSelectedAddress] = useState(
    userData?.user?.selectedAddress,
  );
  const { openAuthDialog } = useDialog();
  const [prompt, setPromt] = useState(false);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [bulkUpdate, setBulkUpdate] = useState({
    firstName: userData?.user.firstName,
    lastName: userData?.user.lastName,
    email: userData?.user.email,
    phone: userData?.user.phone,
    dob: userData?.user.dob,
  });
  const [loading, setLoading] = useState({ cod: false, gateway: true });
  const [selectedtAddressChange, setSelectedAddressChange] = useState({});
  const { closeCartDrawer } = useCartDrawer();
  const { EmptyCart, removeFromCart } = useProduct();

  const handleAddressChange = (address) => {
    setSelectedAddress(address);

    UserServiceOperations.UserUpdateDetails(
      userData.user._id,
      { newDetails: { selectedAddress: address } },
      userData.token,
    )
      .then((res) => {
        AquaToast({
          message: "Successfully selected the address",
          type: "success",
        });
        console.log("Updated selected address:", res.data.selectedAddress);
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

  //especially to not open cart drawer in checkout page.
  useEffect(() => {
    closeCartDrawer();
  });

  const seo = {
    title: "Aquakart | Cart",
  };

  const handleQuantityChange = (event, id) => {
    const quantity = parseInt(event.target.value, 10);
    changeItemQuantity(id, quantity);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBulkUpdate((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleUpdateDetails = async () => {
    const newDetails = { ...bulkUpdate };
    console.log("update", newDetails);

    const id = userData.user._id;
    const token = userData.token;

    const payload = { newDetails };

    await UserServiceOperations.UserUpdateDetails(id, payload, token)
      .then((res) => {
        console.log("apiu", res.data);
        dispatch({
          type: "UPDATE_USER_DETAILS",
          payload: res.data,
        });
        AquaToast({ message: "Successfully Updated details", type: "success" });
        setUpdateDetails(!updateDetails);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const handleEditAddress = (e, r) => {
    e.preventDefault();
    const addresses = userData;
    console.log(r, addresses);
    // dispatch({
    //   type: "SET_ADDRESS_DIALOG",
    //   payload: true,
    // });
    // dispatch({
    //   type: "SET_ADDRESS_DATA",
    //   payload: r,
    // });
  };

  const handleAddAddress = () => {
    dispatch({
      type: "SET_ADDRESS_DIALOG",
      payload: true,
    });
    dispatch({
      type: "SET_ADDRESS_DATA",
      payload: null,
    });
  };

  const handleDeleteAddress = (r) => {
    console.log(r._id);
  };

  const handleRemoveProduct = (r) => {
    removeFromCart(r._id);
  };

  const productData = (data) => {
    return data.map((item) => ({
      productId: item._id,
      name: item.title,
      price: item.price,
      quantity: item.quantity,
    }));
  };

  const handleCashOnDelivery = () => {
    if (cartData.length <= 0) {
      AquaToast({ message: "Please add products to cart", type: "info" });
    } else {
      const cashTransactionId = `AQTR-COD-${nanoid(5).toUpperCase()}D${moment(
        new Date(),
      ).format("DDMMYYYY")}`;
      const orderId = `AQOD${moment(new Date()).format("DDMMYYYY")}${nanoid(2).toUpperCase()}`;
      const newOrder = {
        user: userData?.user?._id, // Safe access and also make sure user exists
        orderType: "Cash On Delivery",
        items: productData(cartData),
        transactionId: cashTransactionId,
        totalAmount: getTotalPrice(),
        orderId: orderId,
        paymentMethod: "Cash On Delivery",
        paymentStatus: "Pending",
        currency: "INR",
        billingAddress: selectedAddress, // Ensure this is correctly assigned using safe access
        shippingAddress: selectedAddress, // Ensure this is correctly assigned using safe access
        shippingMethod: "Standard",
        shippingCost: 50, // Example fixed cost
        estimatedDelivery: new Date(
          new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // Adding 7 days for delivery
        orderStatus: "Processing",
      };

      if (!userData?.user?.email || !userData?.user?.phone) {
        AquaToast({
          message: "Please Update Details To Proceed Further",
          type: "error",
        });
      } else if (!userData?.user?.addresses?.length) {
        AquaToast({ message: "Please Add An Address", type: "error" });
      } else if (!selectedAddress) {
        AquaToast({ message: "Please select an address", type: "error" });
      } else {
        setLoading((prevState) => ({
          ...prevState,
          cod: true,
        }));

        orderServiceOperations
          .createCodOrder(newOrder)
          .then((res) => {
            setTimeout(() => {
              setLoading((prevState) => ({
                ...prevState,
                cod: false,
              }));
              console.log("data", res.data);
              router.push(`/order/${res.data.transactionId}`);
            }, 4000); // Delay of 4000 ms (4 seconds)
          })
          .catch((err) => {
            console.log("order", err);
          });
      }
    }
  };

  const handlePhonePayment = () => {
    if (cartData.length <= 0) {
      AquaToast({ message: "Please add products to cart", type: "info" });
    } else {
      const transactionId = `AQTR-PGPP${nanoid(5).toUpperCase()}D${moment(
        new Date(),
      ).format("DDMMYYYY")}`;
      const orderId = `AQOD${moment(new Date()).format("DDMMYYYY")}${nanoid(2).toUpperCase()}`;
      const newOrder = {
        user: userData?.data?.user?._id, // Safe access and also make sure user exists
        transactionId: transactionId,
        orderType: "Payment Method(Phone Pe Gateway)",
        orderId: orderId,
        items: cartData.map((item) => ({
          productId: item.id,
          name: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: getTotalPrice(),
        paymentMethod: "OTHER THAN CASH ON DELIVERY",
        paymentStatus: "Pending",
        currency: "INR",
        billingAddress: selectedAddress, // Ensure this is correctly assigned using safe access
        shippingAddress: selectedAddress, // Ensure this is correctly assigned using safe access
        shippingMethod: "Standard",
        shippingCost: 50, // Example fixed cost
        estimatedDelivery: new Date(
          new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // Adding 7 days
        orderStatus: "Processing",
      };
      if (!userData.user.email || !userData.user.phone) {
        AquaToast({
          message: "Please Update Details To Proceed Further",
          type: "error",
        });
      } else if (userData.user.addresses.length < 0) {
        AquaToast({ message: "Please Add An Address", type: "error" });
      } else if (!selectedAddress) {
        AquaToast({ message: "Please select an address", type: "error" });
      } else if (userData.user.addresses.length < 0) {
        AquaToast({ message: "Please Add An Address", type: "error" });
      } else {
        setLoading((prevState) => ({
          ...prevState,
          gateway: true,
        }));
        orderServiceOperations.createPhonePePayOrder(newOrder).then((res) => {
          setLoading((prevState) => ({
            ...prevState,
            gateway: false,
          }));
          window.location.href = res.url;
        });
      }
    }
  };

  const handleDeleteAddressDialog = (e, r) => {
    e.preventDefault();
    setPromt(true);
  };

  const handleAddressDelete = () => {
    const addresses = userData.user.addresses;
  };

  return (
    <AquaLayout seo={seo}>
      <AquaPromptDialog
        open={prompt}
        close={() => setPromt(!prompt)}
        title={"Delete Confirmation"}
        handleCancel={() => setPromt(!prompt)}
        handleOk={(e) => handleDeleteAddressDialog(e, selectedtAddressChange)}
      />

      {!userData || userData === null ? (
        <>
          <div className="bg-white p-40 justify-center text-center">
            <button
              type="button"
              className="relative justify-center p-10 rounded-full bg-gray-800 text-xl font-bold ml-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              onClick={() => openAuthDialog()}
            >
              Please Login to access Cart
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white">
          <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Shopping Cart
            </h1>
            <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
              <section aria-labelledby="cart-heading" className="lg:col-span-7">
                <h2 id="cart-heading" className="sr-only">
                  Items in your shopping cart
                </h2>

                {!userData.user.email || !userData.user.phone ? (
                  <>
                    <button
                      onClick={() => setUpdateDialog(!updateDialog)}
                      type="button"
                      className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Update Details
                    </button>
                    {updateDialog ? (
                      <>
                        <div className="border-b border-gray-900/10 pb-12">
                          <h2 className="text-base font-semibold leading-7 text-gray-900">
                            Personal Information
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-gray-600">
                            Use a valid email address where you can receive
                            mail.
                          </p>

                          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                              <AquaInput
                                id="first-name"
                                name="firstName"
                                type="text"
                                autoComplete="given-name"
                                value={bulkUpdate.firstName}
                                onChange={handleChange}
                                label="First name"
                                placeholder="Enter your first name"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <AquaInput
                                id="last-name"
                                name="lastName"
                                type="text"
                                autoComplete="given-name"
                                value={bulkUpdate.lastName}
                                onChange={handleChange}
                                label="last name"
                                placeholder="Enter your last name"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <AquaInput
                                id="email"
                                name="email"
                                type="text"
                                autoComplete="given-name"
                                value={bulkUpdate.email}
                                onChange={handleChange}
                                label="Email"
                                placeholder="Enter your email"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <AquaInput
                                id="phone"
                                name="phone"
                                type="number"
                                autoComplete="given-name"
                                value={bulkUpdate.phone}
                                onChange={handleChange}
                                maxLength={10}
                                label="Phone"
                                placeholder="Enter your email"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="rounded-md mt-5 bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            onClick={handleUpdateDetails}
                          >
                            Update Details
                          </button>
                        </div>
                      </>
                    ) : (
                      ""
                    )}
                  </>
                ) : (
                  <></>
                )}

                <h1 className="text-xl mt-10 font-bold tracking-tight text-gray-500 sm:text-xl">
                  Add Address
                </h1>

                <button
                  onClick={() => handleAddAddress()}
                  type="button"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Add Address
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userData.user.addresses.map((r, i) => (
                    <>
                      <div className="m-2 overflow-hidden rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:p-6">
                          <div className="mt-4">
                            <div className="flex items-center">
                              <input
                                value={r.street}
                                name="notification-method"
                                type="radio"
                                onChange={() => handleAddressChange(r)}
                                checked={
                                  JSON.stringify(selectedAddress) ===
                                  JSON.stringify(r)
                                }
                                className={`h-4 w-4 border-gray-300 focus:ring-indigo-600 ${selectedAddress === r.street ? "bg-indigo-600 text-white" : "bg-white text-gray-800"}`}
                              />
                              <label className="text-md ml-3 block text-sm font-medium leading-6 text-gray-900">
                                Billing Address
                              </label>
                            </div>
                            <p className="mt-1 text-gray-500">{r.street}</p>
                            <p className="text-gray-500">{r.state}</p>
                            <p className="text-gray-500">
                              {r.city}-{r.postalCode}
                            </p>
                          </div>
                          <div className="mt-4 flex space-x-4">
                            <button
                              className="flex items-center text-blue-500 hover:text-blue-700"
                              onClick={(e) => handleEditAddress(e, r)}
                            >
                              <PencilIcon
                                className="h-5 w-5 mr-1"
                                aria-hidden="true"
                              />
                              Edit
                            </button>
                            <button
                              className="flex items-center text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteAddress(r)}
                            >
                              <TrashIcon
                                className="h-5 w-5 mr-1"
                                aria-hidden="true"
                              />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ))}
                </div>

                {cartData.length <= 0 ? (
                  <>
                    <h1 className="font-bold text-xl text-gray-500 mt-5">
                      Cart is Empty
                    </h1>
                  </>
                ) : (
                  <>
                    {cartData.length > 0 ? (
                      <button
                        type="button"
                        className="rounded-md bg-red-600 m-4 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        onClick={() => EmptyCart()}
                      >
                        Remove All Products
                      </button>
                    ) : (
                      ""
                    )}
                    <ul
                      role="list"
                      className="divide-y divide-gray-200 border-b border-t border-gray-200"
                    >
                      {cartData.map((product, productIdx) => (
                        <li key={product.id} className="flex py-6 sm:py-10">
                          <div className="flex-shrink-0">
                            <Image
                              src={product.photos[0].secure_url}
                              alt={product.title}
                              className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
                              width={300}
                              height={400}
                            />
                          </div>

                          <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                            <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                              <div>
                                <div className="flex justify-between">
                                  <h3 className="text-sm">
                                    <a
                                      href={product.href}
                                      className="font-medium text-gray-700 hover:text-gray-800"
                                    >
                                      {product.title}
                                    </a>
                                  </h3>
                                </div>
                                <div className="mt-1 flex text-sm">
                                  <p className="text-gray-500">
                                    {product.color}
                                  </p>
                                  {product.size ? (
                                    <p className="ml-4 border-l border-gray-200 pl-4 text-gray-500">
                                      {product.size}
                                    </p>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-sm font-medium text-gray-900">
                                  {formatCurrencyINR(product.price)}
                                </p>
                              </div>

                              <div className="mt-4 sm:mt-0 sm:pr-9">
                                <label
                                  htmlFor={`quantity-${productIdx}`}
                                  className="sr-only"
                                >
                                  Quantity, {product.name}
                                </label>
                                <select
                                  id={`quantity-${productIdx}`}
                                  name={`quantity-${productIdx}`}
                                  value={product.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(e, product._id)
                                  }
                                  className="max-w-full rounded-md border border-gray-300 py-1.5 text-left text-base font-medium leading-5 bg-white text-gray-600 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                >
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                  <option value={4}>4</option>
                                  <option value={5}>5</option>
                                </select>
                                <div className="absolute right-0 top-0">
                                  <button
                                    type="button"
                                    className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                                  >
                                    <span className="sr-only">Remove</span>
                                    <XMarkIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                      onClick={() =>
                                        handleRemoveProduct(product)
                                      }
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <p className="mt-4 flex space-x-2 text-sm text-gray-700">
                              {product.inStock ? (
                                <CheckIcon
                                  className="h-5 w-5 flex-shrink-0 text-green-500"
                                  aria-hidden="true"
                                />
                              ) : (
                                <ClockIcon
                                  className="h-5 w-5 flex-shrink-0 text-gray-300"
                                  aria-hidden="true"
                                />
                              )}

                              <span>
                                {product.stock
                                  ? "In stock"
                                  : `Ships in ${product.leadTime}`}
                              </span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              {/* Order summary */}
              <section
                aria-labelledby="summary-heading"
                className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
              >
                <h2
                  id="summary-heading"
                  className="text-lg font-medium text-gray-900"
                >
                  Order summary
                </h2>

                <dl className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Subtotal</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatCurrencyINR(getTotalPrice())}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <dt className="flex items-center text-sm text-gray-600">
                      <span>Shipping estimate</span>
                      <a
                        href="#"
                        className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">
                          Learn more about how shipping is calculated
                        </span>
                        <QuestionMarkCircleIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </a>
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatCurrencyINR(300)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <dt className="text-base font-medium text-gray-900">
                      Order total
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      {formatCurrencyINR(getTotalPrice() + 300)}
                    </dd>
                  </div>
                </dl>
                {/* handle user */}
                {!userData ? (
                  <>
                    <button
                      type="button"
                      className="mt-2 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() =>
                        dispatch({
                          type: "SET_AUTH_DIALOG_VISIBLE",
                          payload: true,
                        })
                      }
                    >
                      Please Login
                    </button>
                  </>
                ) : (
                  <>
                    <>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={handlePhonePayment}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                        >
                          Pay Now
                        </button>
                        <button
                          type="button"
                          onClick={handleCashOnDelivery}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                        >
                          {loading.cod ? (
                            <AquaSpinner color="gray" />
                          ) : (
                            "Cash On Delivery"
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        className="mt-2 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Continue To Shop
                      </button>
                    </>
                  </>
                )}
              </section>
            </form>
          </div>
        </div>
      )}
    </AquaLayout>
  );
};
export default AquaCheckoutComponent;
