import { useState, useEffect } from "react";
import AquaLayout from "@/components/Layout/Layout";
import orderServiceOperations from "@/services/order";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";

const AquaPaymentOrderPageComponent = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userData } = useSelector((state) => ({ ...state }));

  useEffect(() => {
    setLoading(true);
    const fetchPaymentOrder = async () => {
      if (id) {
        try {
          const orderData = orderServiceOperations.verifyPayment(
            id,
            userData.token,
          );
          setOrder(orderData);
        } catch (error) {}
      }
    };
    fetchPaymentOrder();
  }, [id]);

  return (
    <AquaLayout>
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        {id}
      </main>
    </AquaLayout>
  );
};
export default AquaPaymentOrderPageComponent;
