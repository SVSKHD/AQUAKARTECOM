import { nanoid } from "nanoid";
import moment from "moment";
import AquaToast from "@/components/reusables/react-toastify";
import orderServiceOperations from "@/services/orderServiceOperations"; // Adjust the import path as necessary
import { useRouter } from "next/router";

// Generate Cash On Delivery Order
const generateCashOnDeliveryOrder = (
  userData,
  cartData,
  getTotalPrice,
  selectedAddress,
) => {
  const cashTransactionId = `AQTR-COD-${nanoid(5).toUpperCase()}D${moment(new Date()).format("DDMMYYYY")}`;
  const orderId = `AQOD${moment(new Date()).format("DDMMYYYY")}${nanoid(2).toUpperCase()}`;

  const newOrder = {
    user: userData?.data?.user?._id, // Safe access and also make sure user exists
    orderType: "Cash On Delivery",
    items: cartData.map((item) => ({
      productId: item._id,
      name: item.title,
      price: item.price,
      quantity: item.quantity,
    })),
    transactionId: cashTransactionId,
    totalAmount: getTotalPrice(),
    orderId: orderId,
    paymentMethod: "Cash On Delivery",
    paymentStatus: "Pending",
    currency: "INR",
    billingAddress: userData?.data?.user?.selectedAddress, // Ensure this is correctly assigned using safe access
    shippingAddress: userData?.data?.user?.selectedAddress, // Ensure this is correctly assigned using safe access
    shippingMethod: "Standard",
    shippingCost: 50, // Example fixed cost
    estimatedDelivery: new Date(
      new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString(), // Adding 7 days for delivery
    orderStatus: "Processing",
  };

  return newOrder;
};

// Handle Cash On Delivery
const handleCashOnDelivery = (
  userData,
  cartData,
  getTotalPrice,
  selectedAddress,
) => {
  const router = useRouter();

  if (!selectedAddress) {
    AquaToast({ message: "Please select an address", type: "error" });
    return;
  }

  const newOrder = generateCashOnDeliveryOrder(
    userData,
    cartData,
    getTotalPrice,
    selectedAddress,
  );

  orderServiceOperations
    .createCodOrder(newOrder)
    .then((res) => {
      router.push(`/order/${res.data.data._id}`);
    })
    .catch((err) => {
      console.log("order", err);
    });
};

// PaymentGateway (example placeholder function)
const PaymentGateway = () => {};

const PaymentOperations = {
  generateCashOnDeliveryOrder,
  handleCashOnDelivery,
  PaymentGateway,
};

export default PaymentOperations;
