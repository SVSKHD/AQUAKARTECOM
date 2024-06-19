// src/components/AquaLayout.tsx
"use client";
import React, { ReactNode } from "react";
import AquaFooter from "./footer";
import AquaHeader from "./header";
import Head from "next/head";
import { defaultMetadata, Metadata } from "../head/metaData"; // Adjust the path as necessary

interface AquaLayoutProps {
  children: ReactNode;
  metadata?: Metadata;
}

const AquaLayout = ({
  children,
  metadata = defaultMetadata,
}: AquaLayoutProps) => {
  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta name="author" content={metadata.author} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={metadata.url} />
        <meta property="og:image" content={metadata.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content={metadata.image} />
        <link rel="canonical" href={metadata.url} />
      </Head>
      <AquaHeader />
      {children}
      <AquaFooter />
    </>
  );
};

export default AquaLayout;
