import type { Metadata } from "next";
import AquaApp from "@/pageComponents/aqua/AquaApp";

// The home page: customers land straight in the Aqua AI shopping assistant.
// (/aqua permanently redirects here; see next.config.mjs.)
export const metadata: Metadata = {
  title: { absolute: "Aquakart · Water softeners & purifiers with Aqua AI" },
  description:
    "Tell Aqua about your water and home. It recommends the right water softener or purifier and lets you buy it in the same conversation.",
  alternates: { canonical: "https://aquakart.co.in/" },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <AquaApp />;
}
