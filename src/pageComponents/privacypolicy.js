import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import {
  ShieldCheckIcon,
  FingerPrintIcon,
  LockClosedIcon,
  UsersIcon,
  EyeSlashIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function AquaPrivacyPolicyComponent() {
  const router = useRouter();
  const seo = {
    title: "Aquakart | Privacy Policy",
    description:
      "Explore Aquakart's Privacy Policy. Understand our data protection, secure practices, and commitment to your privacy.",
    keywords:
      "privacy policy, data protection, secure shopping, aquakart privacy, user data",
    keyphrases: "privacy-policy, secure-data",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.pathname}`,
  };

  const PrivacyPolicy = [
    {
      title: "Introduction",
      description:
        "At Aquakart, maintaining your confidentiality is paramount. This policy outlines our committed practices in collecting, using, and safeguarding your personal information, aligning with legal obligations and our core values.",
      icon: <DocumentTextIcon className="w-6 h-6 text-slate-600" />,
    },
    {
      title: "Purpose & Scope",
      description:
        "We collect data to enhance your shopping experience—from browsing to purchase. We aim for transparency in all our interactions so you can shop with confidence.",
      icon: <EyeSlashIcon className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: "Data Collection",
      description:
        "We collect emails and passwords for authentication, phone numbers for accurate delivery updates, and offer optional saved payment methods for your convenience. This ensures a seamless and personalized experience.",
      icon: <FingerPrintIcon className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: "Security Measures",
      description:
        "Aquakart employs state-of-the-art encryption and multi-factor authentication to make our databases resilient against breaches. Your data security is our top priority.",
      icon: <LockClosedIcon className="w-6 h-6 text-rose-600" />,
    },
    {
      title: "Information Sharing",
      description:
        "Contact details are shared only with trusted transit partners to ensure your order reaches the right doorstep. We do not sell your data to third parties.",
      icon: <UsersIcon className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "Children's Privacy (COPPA)",
      description:
        "We strictly adhere to COPPA regulations and are committed to safeguarding the personal information of children under 13. Our services are not directed towards children.",
      icon: <ShieldCheckIcon className="w-6 h-6 text-orange-600" />,
    },
    // {
    //   title: "Cookies & Tracking",
    //   description: "We utilize cookies to understand user preferences and enhance site functionality, allowing us to tailor our services to better suit your individual needs.",
    //    icon: <GlobeAltIcon className="w-6 h-6 text-cyan-600" />
    // },
    {
      title: "Your Rights",
      description:
        "You retain full control over your data. You have the right to access, amend, erase, or withdraw consent for specific data uses at any time.",
      icon: <ShieldCheckIcon className="w-6 h-6 text-purple-600" />,
    },
  ];

  return (
    <AquaLayout seo={seo}>
      {/* Global Background */}
      <div className="fixed inset-0 bg-slate-50 z-[-1]">
        <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-100/40 blur-[120px]" />
      </div>

      <div className="relative isolate py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800 mb-6">
              <ShieldCheckIcon className="mr-2 h-4 w-4" /> Trusted & Secure
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Your privacy is our priority. We are committed to transparency in
              how we collect, use, and safeguard your data.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-8">
            {PrivacyPolicy.map((item) => (
              <div
                key={item.title}
                className="relative flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/60 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-200/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
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
