import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import {
  TruckIcon,
  MapPinIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/outline";

export default function AquaShippingPolicyComponent() {
  const router = useRouter();
  const seo = {
    title: "Aquakart | Shipping Policy",
    description:
      "Explore Aquakart's Shipping Policy. Learn about our delivery timelines, locations, and secure packaging commitments.",
    keywords:
      "shipping policy, delivery, aquakart shipping, hyderabad delivery, telangana shipping",
    keyphrases: "shipping-policy, fast-delivery",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.pathname}`,
  };

  const shippingPolicy = [
    {
      title: "Shipping In Hyderabad",
      description:
        "For shipments and deliveries within Hyderabad, we operate a local warehouse to ensure adherence to our delivery schedules, guaranteeing timely deliveries.",
      icon: <TruckIcon className="w-6 h-6 text-emerald-600" />,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      title: "Shipping Outside Hyderabad",
      description:
        "For shipments outside of Hyderabad, our extensive logistics network strives to meet timelines. Inter-city transport may cause slight variations. We work closely with partners to minimize delays and keep you informed.",
      icon: <MapPinIcon className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      title: "Regional Delivery (Telangana)",
      description:
        "Orders from Telangana will be dispatched within 5-10 days. Please allow this timeframe for shipping. We appreciate your patience and look forward to serving you!",
      icon: <MapPinIcon className="w-6 h-6 text-indigo-600" />,
      color: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    {
      title: "Premium Packaging",
      description:
        "Meticulously crafted packaging to deliver your items in perfect condition. Includes a detailed guide, warranty info, surprise gifts, and support contacts for a delightful unboxing journey.",
      icon: <CubeTransparentIcon className="w-6 h-6 text-purple-600" />,
      color: "bg-purple-50 text-purple-700 border-purple-100",
    },
  ];

  return (
    <AquaLayout seo={seo}>
      {/* Global Background */}
      <div className="fixed inset-0 bg-slate-50 z-[-1]">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-emerald-200/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-[100px]" />
      </div>

      <div className="relative isolate py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 mb-6">
              <TruckIcon className="mr-2 h-4 w-4" /> Logistics & Delivery
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Shipping Policy
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Fast, reliable, and transparent. We ensure your water solutions
              reach you safely and on time, every time.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-8">
            {shippingPolicy.map((item) => (
              <div
                key={item.title}
                className="relative flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/60 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-200/50"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.color}`}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AquaLayout>
  );
}
