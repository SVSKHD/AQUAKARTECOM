import { useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import {
  SparklesIcon,
  UserGroupIcon,
  GlobeAsiaAustraliaIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

const timeline = [
  {
    name: "Founded in Hyderabad",
    description:
      "Aquakart began with a simple mission: to provide affordable, high-quality water softening solutions to Indian households.",
    date: "2021",
    dateTime: "2021",
  },
  {
    name: "Expanded to Telangana",
    description:
      "With growing demand, we expanded our logistics and service network to cover the entire state of Telangana.",
    date: "2022",
    dateTime: "2022",
  },
  {
    name: "Entered Andhra Pradesh",
    description:
      "We crossed state lines to bring pure water solutions to our neighbors in Andhra Pradesh.",
    date: "2023",
    dateTime: "2023",
  },
  {
    name: "250k+ Happy Customers",
    description:
      "Reached a milestone of serving over a quarter million households with cleaner, softer water.",
    date: "2024",
    dateTime: "2024",
  },
];

const values = [
  {
    name: "Customer First",
    description:
      "We prioritize your health and satisfaction above all else. Our support team is always just a call away.",
    icon: UserGroupIcon,
  },
  {
    name: "Quality Assurance",
    description:
      "Every product is rigorously tested to meet Indian water conditions and safety standards.",
    icon: SparklesIcon,
  },
  {
    name: "Sustainability",
    description:
      "We believe in efficient water usage and eco-friendly technologies that reduce waste.",
    icon: GlobeAsiaAustraliaIcon,
  },
  {
    name: "Integrity",
    description:
      "Transparent pricing, honest advice, and genuine products. No hidden costs or false promises.",
    icon: HeartIcon,
  },
];

const AquaAbout = () => {
  const seo = {
    title: "Aquakart | About Us",
    description:
      "Learn about Aquakart's journey, our mission to provide pure water, and the values that drive us.",
  };

  return (
    <AquaLayout seo={seo}>
      {/* Global Background */}
      <div className="fixed inset-0 bg-slate-50 z-[-1]">
        <div className="absolute top-0 left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute bottom-0 right-[20%] w-[50%] h-[50%] rounded-full bg-indigo-100/40 blur-[120px]" />
      </div>

      <div className="relative isolate pt-14 pb-24 sm:pb-32">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
            <div className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800 mb-6">
              <SparklesIcon className="mr-2 h-4 w-4" /> Our Story
            </div>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Revolutionizing Home Water Quality
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-600 max-w-2xl">
              We are a passionate team dedicated to solving the hard water
              problems faced by millions of Indian households. We adhere to a
              simple philosophy: everyone deserves access to clean, soft, and
              safe water.
            </p>
          </div>
        </div>

        {/* Timeline Section - Glass Cards */}
        <div className="mx-auto -mt-8 max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {timeline.map((item) => (
              <div
                key={item.name}
                className="relative flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/60 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-200"
              >
                <time
                  dateTime={item.dateTime}
                  className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit"
                >
                  {item.date}
                </time>
                <h3 className="text-lg font-bold text-slate-900">
                  {item.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Vision / Stats Section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
          <div className="relative overflow-hidden rounded-[3rem] bg-indigo-900 px-6 py-24 shadow-2xl sm:px-16 md:pt-32 lg:flex lg:gap-x-20 lg:px-24">
            <div className="absolute top-0 left-0 -ml-24 -mt-24 h-96 w-96 rounded-full bg-indigo-800 blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 right-0 -mr-24 -mb-24 h-96 w-96 rounded-full bg-emerald-800 blur-3xl opacity-50"></div>

            <div className="relative z-10 mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-16 lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Impact that matters.
                <br />
                Measured in purity.
              </h2>
              <p className="mt-6 text-lg leading-8 text-indigo-200">
                We measure our success not just in sales, but in the millions of
                liters of water we've purified and the smiles of satisfied
                families across the region.
              </p>
            </div>

            <div className="relative mt-16 h-80 lg:mt-0">
              <div className="absolute left-0 top-0 h-full w-[500px] max-w-none rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md p-8 grid grid-cols-2 gap-8">
                <div className="flex flex-col justify-center text-center">
                  <p className="text-4xl font-bold text-white">250k+</p>
                  <p className="text-indigo-200 text-sm mt-1">Happy Homes</p>
                </div>
                <div className="flex flex-col justify-center text-center">
                  <p className="text-4xl font-bold text-emerald-400">99%</p>
                  <p className="text-indigo-200 text-sm mt-1">
                    Satisfaction Rate
                  </p>
                </div>
                <div className="flex flex-col justify-center text-center">
                  <p className="text-4xl font-bold text-white">24/7</p>
                  <p className="text-indigo-200 text-sm mt-1">
                    Support Availability
                  </p>
                </div>
                <div className="flex flex-col justify-center text-center">
                  <p className="text-4xl font-bold text-emerald-400">
                    2 States
                  </p>
                  <p className="text-indigo-200 text-sm mt-1">Full Coverage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Our Core Values
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              The principles that guide every product we build and every
              interaction we have.
            </p>
          </div>
          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 text-base leading-7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.name} className="relative pl-9">
                <dt className="inline font-semibold text-slate-900">
                  <value.icon
                    className="absolute left-1 top-1 h-5 w-5 text-emerald-600"
                    aria-hidden="true"
                  />
                  {value.name}
                </dt>{" "}
                <dd className="inline text-slate-600">{value.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaAbout;
