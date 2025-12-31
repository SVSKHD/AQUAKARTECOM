import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import { ScaleIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

export default function AquaTermsAndConditionsComponent() {
  const router = useRouter();
  const seo = {
    title: "Aquakart | Terms & Conditions",
    description:
      "Read Aquakart's Terms & Conditions. Understand your rights, our policies on shipping, returns, and usage.",
    keywords:
      "terms and conditions, user agreement, purchase policy, aquakart terms",
    keyphrases: "terms-conditions, user-policy",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.pathname}`,
  };

  const termsAndConditons = [
    {
      title: "Introduction",
      description:
        "Welcome to AquaKart. By accessing our platform, you agree to be bound by these terms. These rules ensure a safe and reliable environment for all users.",
    },
    {
      title: "Shipping & Delivery",
      description:
        "We are committed to efficient delivery. Timelines depend on location and selected method. While we strive for punctuality, please note that delivery times are estimates.",
    },
    {
      title: "Returns & Refunds",
      description:
        "Your satisfaction is key. You may return items within 30 days for a full refund or exchange, provided they are in original condition. Refunds are processed promptly to the original payment method.",
    },
    {
      title: "Intellectual Property",
      description:
        "All content—logos, images, and text—is the exclusive property of AquaKart. Unauthourized reproduction or exploitation of our content is strictly prohibited.",
    },
    {
      title: "Purchasing & Payment",
      description:
        "We support secure payments via credit/debit cards and other gateways. Ensure your billing info is accurate to prevent processing delays. All transactions are encrypted.",
    },
    {
      title: "User Accounts",
      description:
        "Creating an account requires accurate information. You are responsible for maintaining the confidentiality of your credentials and restrict access to your account.",
    },
    {
      title: "Disclaimers",
      description:
        "Services are provided 'as is'. While we strive for uptime, we do not guarantee uninterrupted access and are not liable for errors or inconveniences beyond our control.",
    },
    {
      title: "Privacy Policy",
      description:
        "Your data protection is governed by our Privacy Policy. We are transparent about how we collect and use your information for orders and improvements.",
    },
    {
      title: "Dispute Resolution",
      description:
        "Governed by local jurisdiction laws. We encourage direct contact for quick resolutions. Arbitration may be required if disputes cannot be settled amicably.",
    },
    {
      title: "Policy Updates",
      description:
        "We reserve the right to update these terms. Continued use of the platform constitutes acceptance of any changes. Please review periodically.",
    },
  ];

  return (
    <AquaLayout seo={seo}>
      {/* Global Background */}
      <div className="fixed inset-0 bg-slate-50 z-[-1]">
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[30%] w-[40%] h-[40%] rounded-full bg-cyan-100/40 blur-[120px]" />
      </div>

      <div className="relative isolate py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800 mb-6">
              <ScaleIcon className="mr-2 h-4 w-4" /> Legal
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Terms & Conditions
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Clear guidelines for a seamless experience. Understanding our
              policies helps us serve you better.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-8">
            {termsAndConditons.map((item) => (
              <div
                key={item.title}
                className="relative flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/60 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <DocumentCheckIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-base leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500">
              Last updated: December 2025. If you have any questions, please
              contact our support team.
            </p>
          </div>
        </div>
      </div>
    </AquaLayout>
  );
}
