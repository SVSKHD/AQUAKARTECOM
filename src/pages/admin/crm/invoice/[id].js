import { useEffect } from "react";
import { useRouter } from "next/router";

const AquaInvoice = () => {
  const router = useRouter();
  const { id } = router.query; // Correct way to get `id` from router

  useEffect(() => {
    if (id) {
      router.replace(`https://admin.aquakart.co.in/invoice/${id}`);
    }
  }, [id, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-700">
      <p className="text-white text-xl">Redirecting to invoice... {id}</p>
    </div>
  );
};

export default AquaInvoice;
