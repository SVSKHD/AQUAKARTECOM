// /pages/_error.js

import Link from "next/link";

function Error({ statusCode }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold">
        {statusCode ? `Error ${statusCode}` : "An error occurred"}
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : "An error occurred on client"}
      </p>
      <Link href="/">
        <a className="mt-8 bg-indigo-600 text-white px-4 py-2 rounded-md">
          Go back to Home
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
