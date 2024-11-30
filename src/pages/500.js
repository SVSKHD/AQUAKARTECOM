// pages/500.js
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Custom500() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to home after 5 seconds
    const timeout = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(timeout); // Cleanup timeout
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800">500 - Server Error</h1>
      <p className="mt-4 text-lg text-gray-600">
        Sorry, something went wrong on our end.
      </p>
      <button
        onClick={() => router.push("/")}
        className="mt-8 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
      >
        Go Back to Home Now
      </button>
      <p className="mt-4 text-sm text-gray-500">
        Redirecting to home in 5 seconds...
      </p>
    </div>
  );
}
