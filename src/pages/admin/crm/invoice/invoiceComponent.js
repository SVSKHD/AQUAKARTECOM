"use client";
import { useRef } from "react";
// import {useReactToPrint} from "react-to-print";
import Image from "next/image";
import { Download } from "lucide-react";
import AQ from "../../../../assests/logo-white.png";

const AquaInvoiceClient = ({ data }) => {
  const invoiceRef = useRef(null);
  const isLoading = typeof data === "undefined";

  const products = Array.isArray(data?.products) ? data.products : [];

  // This hook will print the content referred to by invoiceRef
  //  const handleDownloadPDF = useReactToPrint({
  //    content: invoiceRef,
  //    documentTitle: `Invoice_${data?.invoiceNo}`,
  //    onBeforePrint: () => console.log("Preparing to print..."),
  //    onAfterPrint: () => console.log("Print complete!"),
  //  },[invoiceRef]);

  const IndianCurrencySumbol = (number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(number);

  const roundToTwo = (value) =>
    Math.round((Number(value) + Number.EPSILON) * 100) / 100;

  const BasePrice = (grossPrice) => {
    const gross = Number(grossPrice) || 0;
    return roundToTwo(gross / 1.18);
  };

  const gstValueGenerate = (grossPrice) => {
    const gross = Number(grossPrice) || 0;
    const basePrice = BasePrice(gross);
    return roundToTwo(gross - basePrice);
  };

  const handleDownloadInvoice = () => {
    if (!invoiceRef.current || typeof window === "undefined") return;

    const invoiceNumber = (data?.invoiceNo || data?.orderId || "AQUAKART")
      .toString()
      .replace(/[^a-z0-9_-]/gi, "_");
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "-10000px";
    frame.style.bottom = "-10000px";
    document.body.appendChild(frame);

    const printDocument = frame.contentWindow?.document;
    if (!printDocument) return;

    const content = invoiceRef.current.innerHTML;
    printDocument.open();
    printDocument.write(`
      <html>
        <head>
          <title>Invoice_${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 16px; background: #374151; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printDocument.close();

    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 500);
    }, 250);
  };

  const termsAndConditions = [
    {
      title: "Product Sale",
      description: "This invoice is for product sale only.",
    },
    {
      title: "Installation & Support",
      description:
        "Installation/support is arranged by the brand, customer, or third party unless separately agreed in writing.",
    },
    {
      title: "Transport & Lifting",
      description: "Transport and lifting charges are borne by the customer.",
    },
    {
      title: "Returns",
      description: "Unboxed or used products are not returnable.",
    },
    {
      title: "Warranty",
      description: "Warranty is provided as per the manufacturer/brand policy.",
    },
  ];

  const totalProductPrice = products.reduce(
    (acc, product) => acc + (Number(product?.productPrice) || 0),
    0,
  );
  const amountPaid =
    data?.amountPaid ??
    data?.paidAmount ??
    data?.totalPaid ??
    data?.finalAmount ??
    data?.totalAmount ??
    totalProductPrice;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-700 text-white text-xl">
        Loading invoice...
      </div>
    );
  }

  if (!data || typeof data !== "object") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-700 text-red-200 text-xl">
        Unable to load invoice details.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-700">
      <div ref={invoiceRef}>
        <Image
          src={AQ}
          alt="Logo"
          className="w-24 h-24 object-cover rounded-xl shadow-lg m-5"
        />

        <button
          type="button"
          onClick={handleDownloadInvoice}
          className="bg-white pt-5 pb-5 hover:bg-blue-900 hover:text-white text-gray-900 px-6 py-2 rounded-lg shadow-md mb-4 transition flex items-center"
        >
          <Download size={30} className="mr-2" />
          Download Invoice
        </button>

        <div className="w-full flex justify-center m-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center text-white max-w-4xl w-full text-center sm:text-left">
            {/* Left Side: Company Name & GST */}
            <div className="flex flex-col items-center sm:items-start">
              <h2 className="text-5xl font-bold">Aquakart</h2>
              <p className="text-2xl mt-2">GST: 36AJOPH6387A1Z2</p>
            </div>

            {/* Right Side: Date & Invoice Number */}
            <div className="flex flex-col items-center sm:items-end">
              <p className="text-4xl font-bold mb-2">{data?.date}</p>
              <p className="text-2xl font-semibold">
                Invoice No:{" "}
                <span className="text-2xl font-bold">{data?.invoiceNo}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl w-full">
            {/* Customer Details Card */}
            <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col h-full">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                Customer Details
              </h2>
              <hr className="my-3 border-gray-300" />
              <p className="mt-2 text-gray-600 text-center">
                <span className="font-semibold">Name:</span>{" "}
                {data?.customerDetails?.name || "N/A"}
              </p>
              <p className="mt-2 text-gray-600 text-center">
                <span className="font-semibold">Phone:</span>{" "}
                {data?.customerDetails?.phone || "N/A"}
              </p>
              <p className="mt-2 text-gray-600 text-center">
                <span className="font-semibold">Address:</span>{" "}
                {data?.customerDetails?.address || "N/A"}
              </p>
            </div>

            {data?.gst && (
              <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col h-full">
                <h2 className="text-xl font-semibold text-gray-900 text-center">
                  GST Details
                </h2>
                <hr className="my-3 border-gray-300" />
                <p className="mt-2 text-gray-600 text-center">
                  <span className="font-semibold">GSTIN:</span>{" "}
                  {data?.gstDetails?.gstNo}
                </p>
                <p className="mt-2 text-gray-600 text-center">
                  <span className="font-semibold">GSTIN-NAME:</span>{" "}
                  {data?.gstDetails?.gstName}
                </p>
                <p className="mt-2 text-gray-600 text-center">
                  <span className="font-semibold">GST-PHONE:</span>{" "}
                  {data?.gstDetails?.gstPhone}
                </p>
                <p className="mt-2 text-gray-600 text-center">
                  <span className="font-semibold">GST-ADDRESS:</span>{" "}
                  {data?.gstDetails?.gstAddress}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-md max-w-4xl w-full">
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-4">
              Products
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      Product Name
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center">
                      Quantity
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center">
                      Base Price
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center">
                      GST (18%)
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.length ? (
                    products.map((product, index) => (
                      <tr key={index} className="border border-gray-300">
                        <td className="border border-gray-300 px-4 py-2 text-left">
                          {product?.productName || "Unnamed product"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {product?.productQuantity || 1}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {IndianCurrencySumbol(
                            BasePrice(product.productPrice),
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {IndianCurrencySumbol(
                            gstValueGenerate(product.productPrice),
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                          {IndianCurrencySumbol(
                            Number(product?.productPrice) || 0,
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                      >
                        No products available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="flex justify-end mt-4">
                <h4 className="text-xl font-bold text-green-600">
                  Amount Paid: {IndianCurrencySumbol(amountPaid)}
                </h4>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center">
          <h2 className="text-3xl text-white p-5 font-bold">
            Terms & Conditions
          </h2>
          <hr className="w-full border-white" />
          <div className="container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center mt-4">
            {termsAndConditions.map((item, index) => (
              <div
                key={index}
                className="w-full max-w-lg p-6 bg-white rounded-2xl shadow-md"
              >
                <h2 className="text-xl font-semibold text-gray-900">
                  {item.title}
                </h2>
                <hr className="my-2" />
                <p className="mt-2 text-gray-800">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AquaInvoiceClient;
