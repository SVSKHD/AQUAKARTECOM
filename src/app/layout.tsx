import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  Roboto_Mono,
} from "next/font/google";
import type { ReactNode } from "react";
import "@/pageComponents/aqua/aqua.css";

// Root layout for App Router routes only (/aqua, /payment-return). Everything
// else is still served by src/pages with its own _app/_document.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});
const mono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: { default: "Aqua · Aquakart AI", template: "%s · Aquakart" },
  description:
    "Chat with Aqua to find the right water softener or purifier and buy it without leaving the conversation.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EAF7F6" },
    { media: "(prefers-color-scheme: dark)", color: "#08161B" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${jakarta.variable} ${bricolage.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
