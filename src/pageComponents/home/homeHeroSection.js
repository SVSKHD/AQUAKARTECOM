import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Droplets,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import logo from "@/assests/logo.png";
import LazyImage from "@/components/image/LazyImage";
import styles from "@/styles/home.module.css";

const getCategoryHref = (category = {}) => {
  const value = category.slug || category.title || category._id;
  return value ? `/category/${encodeURIComponent(value)}` : "/categories";
};

const getCategoryImage = (category = {}) =>
  category?.photos?.[0]?.secure_url ||
  category?.photos?.[0]?.delivery_url ||
  category?.photos?.[0]?.url;

const AquaHomeHero = ({ data = [] }) => {
  const featuredCategories = data
    .filter((category) => category?.title && getCategoryImage(category))
    .slice(0, 3);

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className={styles.heroGlow} aria-hidden="true" />

      <div className={styles.heroContent}>
        <div className={styles.heroBrand}>
          <Image src={logo} alt="Aquakart" width={58} height={58} priority />
          <span>Water, thoughtfully solved.</span>
        </div>

        <div className={styles.heroEyebrow}>
          <Sparkles size={14} />
          Engineered for Indian water conditions
        </div>

        <h1 id="home-hero-title">
          Better water for
          <span> every part of your home.</span>
        </h1>

        <p className={styles.heroDescription}>
          Discover dependable softeners, purifiers and whole-home filtration
          selected for your source water, household and everyday routine.
        </p>

        <div className={styles.heroActions}>
          <Link href="/shop" className={styles.primaryAction}>
            Explore water solutions
            <ArrowUpRight size={18} />
          </Link>
          <Link href="/softener-planner" className={styles.secondaryAction}>
            Find my ideal system
          </Link>
        </div>

        <div className={styles.heroProof}>
          <div>
            <BadgeCheck size={18} />
            <span>
              <strong>Expert selected</strong>
              Solutions matched to your water
            </span>
          </div>
          <div>
            <MapPin size={18} />
            <span>
              <strong>Pan-India support</strong>
              Delivery and installation
            </span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>
              <strong>Service assured</strong>
              Guidance beyond purchase
            </span>
          </div>
        </div>
      </div>

      <div className={styles.heroVisual}>
        <div className={styles.visualHeader}>
          <div>
            <span>Curated solutions</span>
            <strong>Start with your water need</strong>
          </div>
          <Droplets size={22} />
        </div>

        <div className={styles.categoryMosaic}>
          {featuredCategories.length ? (
            featuredCategories.map((category, index) => (
              <Link
                key={category._id || category.slug || category.title}
                href={getCategoryHref(category)}
                className={`${styles.mosaicCard} ${
                  index === 0 ? styles.mosaicPrimary : ""
                }`}
              >
                <LazyImage
                  src={getCategoryImage(category)}
                  alt={category.title}
                  className={styles.mosaicMedia}
                  fill
                  sizes={
                    index === 0
                      ? "(max-width: 768px) 100vw, 34vw"
                      : "(max-width: 768px) 50vw, 17vw"
                  }
                  imgClassName={styles.mosaicImage}
                  priority={index === 0}
                />
                <span className={styles.mosaicShade} />
                <div className={styles.mosaicMeta}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{category.title}</strong>
                  <small>
                    View collection <ArrowUpRight size={13} />
                  </small>
                </div>
              </Link>
            ))
          ) : (
            <div className={styles.visualFallback}>
              <Droplets size={36} />
              <strong>Solutions built around your water</strong>
              <span>Explore the complete Aquakart catalogue.</span>
              <Link href="/shop">Browse products</Link>
            </div>
          )}
        </div>

        <div className={styles.visualFooter}>
          <span>Free product guidance</span>
          <span>Verified brands</span>
          <span>Secure checkout</span>
        </div>
      </div>
    </section>
  );
};

export default AquaHomeHero;
