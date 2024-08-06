import { useState, useEffect } from "react";
import AquaDashboardComponent from "@/components/Layout/userDasboard/dahsboard";
import orderServiceOperations from "@/services/order";
import { useSelector } from "react-redux";
import AquaToast from "@/components/reusables/react-toastify";
import useCurrency from "@/utils/currency";
import AquaSpinner from "@/components/common/spinner";

const AquaOrderComponent = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const { userData } = useSelector((state) => ({ ...state }));
  const { formatCurrencyINR } = useCurrency;

  useEffect(() => {
    setLoading(true);

    orderServiceOperations
      .getOrdersByUserId(userData.user._id, userData.token)
      .then((res) => {
        setTimeout(() => {
          setLoading(false);
          setOrders(res.data);
        }, 4000); // Delay of 4000ms (4 seconds)
      })
      .catch((err) => {
        setTimeout(() => {
          setLoading(false);
          AquaToast({
            message: "Sorry, problem in fetching orders",
            error: "error",
          });
        }, 4000); // Delay of 4000ms (4 seconds)
      });
  }, [userData.user._id, userData.token]);

  const sortedOrders = orders?.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  const getStatusBadge = (orderStatus) => {
    const statusClasses = {
      Pending: "bg-gray-100 text-gray-800",
      Processing: "bg-yellow-100 text-yellow-800",
      Shipped: "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
      Delivered: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${statusClasses[orderStatus]}`}
      >
        {orderStatus}
      </span>
    );
  };

  return (
    <>
      <AquaDashboardComponent title={"Orders"}>
        {loading?<AquaSpinner color="green"/>:( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOrders?.length > 0 ? (
            <>
              {orders.map((r, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-lg bg-white shadow"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-xl font-bold text-gray-600 mb-4">
                      #{r.orderId} - {getStatusBadge(r.orderStatus)}
                    </h4>
                    <p className="font-bold">
                      Transaction-Id :{" "}
                      <span className="text-gray-500">{r.transactionId}</span>
                    </p>
                    {r.paymentMethod === "Cash On Delivery" ? (
                      <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                        COD
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Payment Method
                      </span>
                    )}
                    <div>
                      <h5 className="mt-5 font-bold text-l">Items Ordered</h5>
                      <ul>
                        {r.items.map((r, i) => (
                          <li key={i}>
                            {r.name} - quantity:{r.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <h3 className="text-l font-bold">
                      Total Amount :{" "}
                      <span className="text-green-600">
                        {formatCurrencyINR(r.totalAmount)}
                      </span>
                    </h3>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6"></div>
                </div>
              ))}
            </>
          ) : (
            <h2 className="text-2xl font-bold">No Orders Yet</h2>
          )}
        </div>)}
       
      </AquaDashboardComponent>
    </>
  );
};

export default AquaOrderComponent;
