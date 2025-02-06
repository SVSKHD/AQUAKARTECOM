import axios from "axios";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import AQ from "../../../../assests/logo-white.png";
import Image from "next/image";
import { ShoppingCart, Download } from "lucide-react";
const AquaInvoice = (props) =>{
      const invoiceRef = useRef();
      const handleDownloadPDF = useReactToPrint({
        content: () => invoiceRef.current,
        documentTitle: `Invoice_${props?.data?.invoiceNo}`,
      });

     const IndianCurrencySumbol = (number) =>
       new Intl.NumberFormat("en-IN", {
         style: "currency",
         currency: "INR",
       }).format(number);

     const gstValueGenerate = (price) => {
       let basePrice = Math.floor(price * 0.8474594);
       let gst = Math.floor(basePrice * 0.18);
       return gst;
     };

      const BasePrice = (price) => {
        let basePrice = Math.floor(price * 0.8474594);
        return basePrice;
      };


       let termsAndConditions = [
         {
           title: "Transport",
           description:
             "TRANSPORT / LIFTING CHARGES WILL BE BORNE BY THE CUSTOMER.",
         },
         {
           title: "Plumber",
           description:
             " PLUMBER SHOULD BE PROVIDED AT THE TIME OF PLUMBING (OR) OUR PLUMBING CONTRACTORS WILL ATTRACT PLUMBING CHARGES.",
         },
         {
           title: "Plumbing Material",
           description:
             "PLUMBING MATERIALS / ELECTRICAL CONNECTION BY CUSTOMER , IF THE PRESSURE BOOSTER PUMP PLUMBING WILL ATTRACT EXTRA CHARGES ",
         },
         {
           title: "SALES RETURN",
           description: "IF THE UNIT IS UNBOXED MACHINE WILL NOT BE TAKEN BACK",
         },
         {
           title: "Delivery and Installation policy",
           description:
             "DELIVERY / INSTALLATION COMPLETED WITHIN 7 WORKING DAYS. ",
         },
         {
           title: "Advance policy",
           description: "100% ADVANCE ALONG WITH PO.",
         },
         {
           title: "Work Monitoring",
           description:
             "PLUMBING WORK VERIFICATION , PROGRAMMING AND TRAINING AND WARRANTY UPLOAD WILL BE DONE BY OUR SERVICE ENGINEERS",
         },
       ];
const data = props?.data;

const total = data?.products.reduce((a,product)=>product?.productPrice,0)
return (
  <div
    ref={invoiceRef}
    className="flex flex-col items-center justify-center min-h-screen bg-gray-700"
  >
    <Image
      src={AQ}
      className="w-24 h-24 object-cover rounded-xl shadow-lg m-5"
    />

    <button
      onClick={handleDownloadPDF}
      className="bg-white pt-5 pb-5 hover:bg-blue-900 hover:text-white text-gray-900 px-6 py-2 rounded-lg shadow-md mb-4 transition flex items-center"
    >
      <Download size={30} className="mr-2" />
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
          <p className="text-4xl font-bold mb-2">
            {new Date().toLocaleDateString()}
          </p>
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
        <div className="justify-left bg-white p-6 rounded-2xl shadow-md flex flex-col h-full">
          <h2 className="text-xl font-semibold text-gray-900 text-center">
            Customer Details
          </h2>
          <hr className="my-3 border-gray-300" />
          <p className="mt-2 text-gray-600 text-left sm:text-center">
            <span className="font-semibold">Name:</span>{" "}
            {data?.customerDetails?.name}
          </p>
          <p className="mt-2 text-gray-600 text-left sm:text-center">
            <span className="font-semibold">Phone:</span>{" "}
            {data?.customerDetails?.phone}
          </p>
          <p className="mt-2 text-gray-600 text-left sm:text-center">
            <span className="font-semibold">Address:</span>{" "}
            {data?.customerDetails?.address}
          </p>
        </div>
        {data?.gst ? (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col h-full">
              <h2 className="text-xl font-semibold text-gray-900 text-center">
                GST Details
              </h2>
              <hr className="my-3 border-gray-300" />
              <p className="mt-2 text-gray-600 text-left sm:text-center">
                <span className="font-semibold">GSTIN:</span>{" "}
                {data?.gstDetails?.gstNo}
              </p>
              <p className="mt-2 text-gray-600 text-left sm:text-center">
                <span className="font-semibold">GSTIN-NAME:</span>{" "}
                {data?.gstDetails?.gstName}
              </p>
              <p className="mt-2 text-gray-600 text-left sm:text-center">
                <span className="font-semibold">GST-PHONE:</span>{" "}
                {data?.gstDetails?.gstPhone}
              </p>
              <p className="mt-2 text-gray-600 text-left sm:text-center">
                <span className="font-semibold">GST-ADDRESS:</span>{" "}
                {data?.gstDetails?.gstAddress}
              </p>
            </div>
          </>
        ) : (
          ""
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
            {/* Table Head */}
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
                  GST(18%)
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  Total
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {data?.products.map((product, index) => (
                <tr key={index} className="border border-gray-300">
                  <td className="border border-gray-300 px-4 py-2 text-left">
                    {product.productName}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {product.productQuantity}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {IndianCurrencySumbol(BasePrice(product.productPrice))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {IndianCurrencySumbol(
                      gstValueGenerate(product.productPrice)
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {IndianCurrencySumbol(product?.productPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grand Total Section */}
          <div className="flex justify-end mt-4">
            <h4 className="text-xl font-bold text-green-600">
              Grand Total: {IndianCurrencySumbol(total)}
            </h4>
          </div>
        </div>
      </div>
    </div>

    <div className="w-full flex justify-center">
      <div className="text-3xl text-white p-5 text-bold">Terms & Conditons</div>
      <hr className="text-white" />
    </div>
    <div className="w-full flex justify-center">
      <div className="container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
        {termsAndConditions.map((item, index) => (
          <div
            key={index}
            className="w-full max-w-lg p-6 bg-white rounded-2xl shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              {item?.title}
            </h2>
            <hr className="my-2" />
            <p className="mt-2 text-gray-800">{item?.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

}



export async function getServerSideProps(context) {
  const { params } = context;
  const { id } = params;

  console.log("id:", id, params);

  let data = {};

  try {
    const response = await axios.get(
      `https://api.aquakart.co.in/v1/crm/invoice/${id}`
    );
    data = response.data;
  } catch (error) {
    console.error("Error fetching invoice data:", error.message);
  }

  return {
    props: {
      id,
      data,
    },
  };
}

export default AquaInvoice