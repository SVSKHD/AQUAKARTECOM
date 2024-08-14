import AquaLayout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import { FaInstagram } from "react-icons/fa";

const AquaContactComponent = () => {
  const router = useRouter();

  const seo = {
    title: "Aquakart | Contact us",
    description:
      "Get in touch with Aquakart for any inquiries, support, or feedback. We're here to help you with all your questions and concerns.",
    keywords:
      "contact Aquakart, customer support, inquiries, feedback, help, customer service",
    keyphrases:
      "contact Aquakart, get in touch with Aquakart, Aquakart support",
    canonical: `${process.env.NEXT_PUBLIC_URL}${router.pathname}`,
  };
  return (
    <AquaLayout seo={seo}>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-16 divide-y divide-gray-100 lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  Get in touch
                </h2>
                <p className="mt-4 leading-7 text-gray-600">Contact us at</p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2 lg:gap-8">
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">
                    Email us at
                  </h3>
                  <dl className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                    <div>
                      <dt className="sr-only">Email</dt>
                      <dd>
                        <a
                          href="mailto:customercare@aquakart.co.in"
                          className="font-semibold text-indigo-600"
                        >
                          customercare@aquakart.co.in
                        </a>
                      </dd>
                    </div>
                    {/* <div className="mt-1">
                      <dt className="sr-only">Phone number</dt>
                      <dd>+1 (555) 905-2345</dd>
                    </div> */}
                  </dl>
                </div>
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">
                    Follow us at
                  </h3>
                  <dl className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                    <div>
                      <dt className="sr-only">Email</dt>
                      <dd>
                        <a
                          href="https://www.instagram.com/aquakart.co.in"
                          target="_blank"
                          className="font-semibold text-indigo-600"
                        >
                          <FaInstagram size={20} />
                        </a>
                      </dd>
                    </div>
                    {/* <div className="mt-1">
                      <dt className="sr-only">Phone number</dt>
                      <dd>+1 (555) 905-3456</dd>
                    </div> */}
                  </dl>
                </div>
                {/* <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">Join our team</h3>
                  <dl className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                    <div>
                      <dt className="sr-only">Email</dt>
                      <dd>
                        <a href="mailto:careers@example.com" className="font-semibold text-indigo-600">
                          careers@example.com
                        </a>
                      </dd>
                    </div>
                    <div className="mt-1">
                      <dt className="sr-only">Phone number</dt>
                      <dd>+1 (555) 905-4567</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">Say hello</h3>
                  <dl className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                    <div>
                      <dt className="sr-only">Email</dt>
                      <dd>
                        <a href="mailto:hello@example.com" className="font-semibold text-indigo-600">
                          hello@example.com
                        </a>
                      </dd>
                    </div>
                    <div className="mt-1">
                      <dt className="sr-only">Phone number</dt>
                      <dd>+1 (555) 905-5678</dd>
                    </div>
                  </dl>
                </div> */}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 pt-16 lg:grid-cols-3">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  Locations
                </h2>
                <p className="mt-4 leading-7 text-gray-600">
                  At Present we deliver and offer our services at{" "}
                  <strong>Telangana</strong> and <strong>Andhra Pradesh</strong>
                </p>
              </div>
              {/* <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2 lg:gap-8">
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">Hyderabad</h3>
                  <address className="mt-3 space-y-1 text-sm not-italic leading-6 text-gray-600">
                    <p>4556 Brendan Ferry</p>
                    <p>Los Angeles, CA 90210</p>
                  </address>
                </div>
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">New York</h3>
                  <address className="mt-3 space-y-1 text-sm not-italic leading-6 text-gray-600">
                    <p>886 Walter Street</p>
                    <p>New York, NY 12345</p>
                  </address>
                </div>
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">Toronto</h3>
                  <address className="mt-3 space-y-1 text-sm not-italic leading-6 text-gray-600">
                    <p>7363 Cynthia Pass</p>
                    <p>Toronto, ON N3Y 4H8</p>
                  </address>
                </div>
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">Chicago</h3>
                  <address className="mt-3 space-y-1 text-sm not-italic leading-6 text-gray-600">
                    <p>726 Mavis Island</p>
                    <p>Chicago, IL 60601</p>
                  </address>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaContactComponent;
