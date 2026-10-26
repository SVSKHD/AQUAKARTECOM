import type { Metadata } from "next";
import AquaApp from "@/pageComponents/aqua/AquaApp";
import { HOME_TITLE } from "@/pageComponents/aqua/pageTitle";

// The home page: customers land straight in the Aqua AI shopping assistant.
// (/aqua permanently redirects here; see next.config.mjs.)
export const metadata: Metadata = {
  // Same string the tab shows on a new chat (it switches to the chat's title
  // once one starts), so there is no flicker after hydration.
  title: { absolute: HOME_TITLE },
  description:
    "Tell Aqua about your water and home. It recommends the right water softener or purifier and lets you buy it in the same conversation.",
  alternates: { canonical: "https://aquakart.co.in/" },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <AquaApp />;
}
