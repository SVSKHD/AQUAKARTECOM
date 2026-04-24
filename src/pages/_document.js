import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#059669" />
        <meta name="color-scheme" content="light" />

        {/* Preconnect to critical origins — order matters, most critical first */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://api.aquakart.co.in" />
        <link
          rel="preconnect"
          href="https://api.aquakart.co.in"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        {/* Fonts are loaded via next/font/google in _app.js — self-hosted, zero FOIT */}

        {/* Favicon & PWA */}
        <link
          rel="icon"
          href="https://res.cloudinary.com/aquakartproducts/image/upload/v1695408028/favicon_b3l7y1.ico"
        />
        <link
          rel="apple-touch-icon"
          href="https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png"
        />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
