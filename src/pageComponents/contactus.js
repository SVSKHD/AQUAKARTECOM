import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { FaInstagram, FaWhatsapp } from "react-icons/fa"; // Keep brand icons

const AquaContactComponent = () => {
  const router = useRouter();

  const seo = {
    title: "Aquakart | Contact Us",
    description:
      "Get in touch with Aquakart. dedicated support for all your water solution needs.",
    keywords:
      "contact Aquakart, customer support, water softener support hyderabad",
    keyphrases: "contact-us, support",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.pathname}`,
  };

  const contactMethods = [
    {
      title: "Email Support",
      detail: "customercare@aquakart.co.in",
      action: "mailto:customercare@aquakart.co.in",
      icon: <EnvelopeIcon className="h-6 w-6 text-indigo-600" />,
      color: "bg-indigo-50 border-indigo-100 text-indigo-700",
      description:
        "Drop us a line anytime. We usually respond within 24 hours.",
    },
    {
      title: "Phone Support",
      detail: "+91 90147 74667",
      action: "tel:+919014774667",
      icon: <PhoneIcon className="h-6 w-6 text-emerald-600" />,
      color: "bg-emerald-50 border-emerald-100 text-emerald-700",
      description:
        "Talk to our water experts directly. Available Mon-Sat, 9am - 7pm.",
    },
    {
      title: "Instagram",
      detail: "@aquakart.co.in",
      action: "https://www.instagram.com/aquakart.co.in",
      icon: <FaInstagram className="h-6 w-6 text-pink-600" />,
      color: "bg-pink-50 border-pink-100 text-pink-700",
      description:
        "Follow us for tips, installation showcases, and latest updates.",
    },
    {
      title: "WhatsApp",
      detail: "Chat with us",
      action: "https://wa.me/919014774667",
      icon: <FaWhatsapp className="h-6 w-6 text-green-600" />,
      color: "bg-green-50 border-green-100 text-green-700",
      description: "Quick queries? WhatsApp is the fastest way to reach us.",
    },
  ];

  return (
    <AquaLayout seo={seo}>
      {/* Global Background */}
      <div className="fixed inset-0 bg-slate-50 z-[-1]">
        <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-100/40 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-100/40 blur-[120px]" />
      </div>

      <div className="relative isolate py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800 mb-6">
              <ChatBubbleLeftRightIcon className="mr-2 h-4 w-4" /> We're here to
              help
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Have questions about water softeners or need support? Our team is
              ready to assist you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 lg:gap-12">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.action}
                target={method.action.startsWith("http") ? "_blank" : "_self"}
                rel={
                  method.action.startsWith("http") ? "noopener noreferrer" : ""
                }
                className="group relative flex flex-col gap-6 rounded-[2rem] border border-white/60 bg-white/60 p-10 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-200/50"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${method.color} shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    {method.icon}
                  </div>
                  <span className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      ></path>
                    </svg>
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">
                    {method.title}
                  </h3>
                  <p className="text-base font-medium text-emerald-600 mb-3">
                    {method.detail}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {method.description}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-24 rounded-[2.5rem] bg-indigo-900 py-16 px-6 sm:px-16 text-center shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight text-white mb-6">
                Service Locations
              </h2>
              <p className="text-indigo-200 text-lg max-w-2xl mx-auto mb-10">
                We currently provide sales and service across{" "}
                <strong>Telangana</strong> and <strong>Andhra Pradesh</strong>.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md">
                  Hyderabad
                </span>
                <span className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md">
                  Vijayawada
                </span>
                <span className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md">
                  Visakhapatnam
                </span>
                <span className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md">
                  Warangal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaContactComponent;
