"use client";
import Link from "next/link";

function Error({ statusCode }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      {/* Illustration */}
      <div className="w-64 h-64 mb-6">
        <img
          src="/error-illustration.svg" // Replace with your illustration URL
          alt="Error Illustration"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Error Heading */}
      <h1 className="text-5xl font-bold text-gray-800">
        {statusCode ? `Error ${statusCode}` : "Something went wrong"}
      </h1>

      {/* Error Description */}
      <p className="mt-4 text-lg text-gray-600 text-center">
        {statusCode
          ? `An error ${statusCode} occurred on the server.`
          : "An error occurred on the client."}
      </p>

      {/* Home Button */}
      <Link href="/">
        <a className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md shadow-md text-lg transition-all">
          Go Back to Home
        </a>
      </Link>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;