import type { Metadata } from "next";
import AquaApp from "@/pageComponents/aqua/AquaApp";

export const metadata: Metadata = {
  title: "Aqua",
  // POC route: keep it out of search results until it replaces the home page.
  robots: { index: false, follow: false },
};

export default function AquaPage() {
  return <AquaApp />;
}
