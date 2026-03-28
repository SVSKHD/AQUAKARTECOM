import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Custom500() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <>
      <Head>
        <title>500 - Server Error | Aquakart</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="glass-card max-w-md rounded-3xl p-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100/80">
            <svg
              className="h-8 w-8 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">
            500 - Server Error
          </h1>
          <p className="mt-3 text-slate-500">
            Sorry, something went wrong on our end.
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn-glass btn-glass-primary mt-6"
          >
            Go Back to Home
          </button>
          <p className="mt-4 text-xs text-slate-400">
            Redirecting to home in 5 seconds...
          </p>
        </div>
      </div>
    </>
  );
}
