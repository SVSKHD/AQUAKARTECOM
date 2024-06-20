import Image from "next/image";
import { Inter } from "next/font/google";
import Example from "@/components/layouts/header";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <Example/>
  );
}
