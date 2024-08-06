import AquaLayout from "@/components/Layout/Layout"
import { useRouter } from "next/router";

  export default function AquaShippingPolicyComponent() {
    const router = useRouter()
    const seo = {
        title: "Aquakart | Privacy Policy",
        description:
          "Explore Aquakart's Privacy Policy to understand how we protect your data. Learn about your rights, our secure practices, and commitment to privacy.",
        keywords:
          "online ecom privacy store , Privacy policy store , online shopping",
        keyphrases: "privacy-policy, policy-store",
        image:
          "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
        canonical: `${process.env.NEXT_PUBLIC_URL}${router.pathname}`,
      };
      const shippingPolicy = [
        {
          title: "Shipping & Delivery In Hyderabad",
          description:
            "For shipments and deliveries within Hyderabad, we operate a local warehouse to ensure adherence to our delivery schedules, guaranteeing timely deliveries.",
        },
        {
          title: "Shipping & Delivery out of Hyderabad",
          description:
            "For shipments outside of Hyderabad, our delivery process involves a more extensive logistics network. While we strive to meet delivery timelines, the complexity of inter-city or inter-state transportation can sometimes lead to variations in delivery schedules. We work closely with our shipping partners to minimize delays and ensure your order reaches you as swiftly as possible. Our commitment to transparency means we'll keep you informed every step of the way, from dispatch to delivery, <b class='text-danger'>for example : estimated + 2 days </b>",
        },
        {
          title: "Shipping & Delivery out of Telangana",
          description:
            "Orders from Telangana will be dispatched within <b>5-10</b> days. Please allow this time frame for shipping. We appreciate your patience and look forward to serving you!",
        },
        {
          title: "Packing and Contents",
          description:
            "Experience premium packaging with Aquakart, meticulously crafted to deliver your items in perfect condition. Each package includes your chosen products, a detailed guide, warranty info, surprise gifts, and customer support contacts for a delightful unboxing journey.",
        },
      ];
    return (
        <AquaLayout seo={seo}>
      <div className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Shipping - Policy</h2>
            <p className="mt-4 text-lg leading-8 text-gray-400">
            “Fast and reliable delivery. Our shipping policy ensures your orders reach you safely and on time.”
            </p>
          </div>
          <ul
            role="list"
            className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8"
          >
            {shippingPolicy.map((item) => (
              <li key={item.title} className="rounded-2xl bg-gray-800 px-8 py-10">
                <h3 className="mt-6 text-base font-semibold leading-7 tracking-tight text-white">{item.title}</h3>
                <p className="text-sm leading-6 text-gray-400">{item.description}</p>
                <ul role="list" className="mt-6 flex justify-center gap-x-6">
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </AquaLayout>
    )
  }
  