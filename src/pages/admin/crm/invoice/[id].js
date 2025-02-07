import axios from "axios";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router"; // Import useRouter
import { useReactToPrint } from "react-to-print";
import AQ from "../../../../assests/logo-white.png";
import Image from "next/image";
import { ShoppingCart, Download } from "lucide-react";

const AquaInvoice = (props) => {
  const router = useRouter();
  const { id } = props;

  useEffect(() => {
    // Redirect to the admin invoice page
    router.push(`https://admin.aquakart.co.in/invoice/${id}`);
  }, [id, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-700">
      <p className="text-white text-xl">Redirecting to invoice...</p>
    </div>
  );
};

export default AquaInvoice;