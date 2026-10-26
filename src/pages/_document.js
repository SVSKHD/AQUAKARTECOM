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

        {/* Favicon & PWA: same set (and ?v=) as src/app/layout.tsx, served from public/ */}
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link
          rel="icon"
          href="/icons/icon-32.png?v=2"
          type="image/png"
          sizes="32x32"
        />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png?v=2"
          sizes="180x180"
        />
        <meta name="apple-mobile-web-app-title" content="Aquakart" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
