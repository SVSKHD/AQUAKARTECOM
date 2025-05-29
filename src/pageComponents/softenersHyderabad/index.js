import { useEffect, useState } from "react";
import AquaLayout from "@/components/Layout/Layout";
import ArtGallery from "@/components/reusables/artGalery";
import AquaSoftnerOperations from "@/services/softenersHyderabad";
import AQ from "@/assests/logo-white.png";
import Image from "next/image";

const AquaSoftenerHyderabadComponent = () => {
  const [imageData, setImageData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await AquaSoftnerOperations.getSofteners();
    setImageData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return loading ? (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="animate-bounce">
        <Image
          src={AQ}
          alt="Loading..."
          width={80}
          height={80}
          className="rounded-full shadow-lg"
        />
      </div>
      <p className="mt-4 text-lg text-blue-900 font-medium animate-pulse">
        Loading Hyderabad installations for you...
      </p>
    </div>
  ) : (
    <AquaLayout>
      <main className="bg-gray-50 min-h-screen py-16">
        {/* 🪟 Hero Container */}
        <section className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight">
            Premium Water Softeners for Hyderabad Homes
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Backed by 100+ successful{" "}
            <span className="italic underline decoration-blue-500">
              realtime installations
            </span>
            , Aquakart delivers reliability, purity, and peace of mind.
          </p>
        </section>

        {/* 🧊 Features Section */}
        <section className="max-w-6xl mx-auto mt-16 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Verified Installations",
                desc: "All displayed images are from actual homes & clients in Hyderabad.",
              },
              {
                title: "Class-Leading Quality",
                desc: "Only high-grade MPV heads, tanks & media. Designed for performance.",
              },
              {
                title: "Elegant Design",
                desc: "Sleek, compact softeners that blend into your home space.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-sm transition"
              >
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 📸 Gallery Section */}
        <section className="max-w-8xl mx-auto mt-20 px-6">
          <h2 className="text-3xl font-semibold text-center text-gray-900 mb-10">
            Realtime{" "}
            <span className="italic underline decoration-pink-400">
              Installations
            </span>{" "}
            Gallery
          </h2>
          <ArtGallery sections={imageData} />
        </section>
      </main>
    </AquaLayout>
  );
};

export default AquaSoftenerHyderabadComponent;
