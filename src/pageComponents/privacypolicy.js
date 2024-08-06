import AquaLayout from "@/components/Layout/Layout"
import { useRouter } from "next/router";

  export default function AquaPrivacyPolicyComponent() {
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
      const PrivacyPolicy = [
        {
          title: "Introduction to the Privacy Policy",
          description:
            "At Aquakart, we recognize the importance of privacy and are committed to maintaining the confidentiality of our website visitors and customers. This Privacy Policy outlines our practices and principles in collecting, using, and safeguarding personal information, aligning with our core values and legal obligations.",
        },
        {
          title: "Purpose and Scope",
          description:
            "The purpose of this Privacy Policy is to inform you about how Aquakart collects, processes, and protects your personal data when you interact with our website. Whether you're browsing our products, signing up for an account, or making a purchase, we want you to understand our practices to ensure a transparent and trustworthy environment.",
        },
        {
          title: "Collectables",
          description:
            "For authentication and identification purposes, Aquakart requires users to provide their email addresses and passwords. This allows us to determine whether a user is returning or new to our app. We collect phone numbers to confirm orders and facilitate communication for delivery purposes, ensuring accuracy in navigation and prompt service. Additionally, we offer the option to save payment card details for the convenience of users, streamlining future purchases.",
        },
        {
          title: "Security and privacy",
          description:
            "Aquakart employs state-of-the-art databases and cutting-edge technologies to ensure the utmost security of collected data, making it resilient to breaches. Furthermore, we utilize multi-factor authentication methods to maintain the stability and security of our data.",
        },
        {
          title: "Contact and Contact Sharing",
          description:
            "Contact details are provided to our transit partners to facilitate navigation and delivery. This ensures they can effectively communicate and locate the specified types of properties through the app",
        },
        {
          title: "COPPA (Children Privacy)",
          description:
            "Regarding the privacy of children, Aquakart is committed to safeguarding the personal information of those under 13 years of age (or the applicable minimum age as per local laws), in strict adherence to regulations such as the Children's Online Privacy Protection Act (COPPA).",
        },
        {
          title: "Cookies and Tracking Technologies",
          description:
            "Aquakart utilizes cookies, web beacons, and various tracking technologies to gather information regarding user interactions and preferences. This data aids in enhancing user experiences by allowing us to tailor our services and content to better suit individual needs.",
        },
        {
          title: "User Rights",
          description:
            "Aquakart ensures users are aware of their entitlements concerning their personal information, including the abilities to access, amend, erase, or withdraw consent for specific data uses",
        },
      ];
    return (
        <AquaLayout seo={seo}>
      <div className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Privacy - Policy</h2>
            <p className="mt-4 text-lg leading-8 text-gray-400">
            “Your privacy is our priority. We are committed to protecting your personal information and ensuring transparency in how we collect, use, and safeguard your data.”
            </p>
          </div>
          <ul
            role="list"
            className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8"
          >
            {PrivacyPolicy.map((item) => (
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
  