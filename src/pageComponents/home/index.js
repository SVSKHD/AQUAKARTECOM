import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Droplets,
  Headphones,
  House,
  Sparkles,
  Wrench,
} from "lucide-react";

import AquaLayout from "@/components/Layout/Layout";
import AquaCategoryCard from "@/components/cards/categoryCard";
import LazyImage from "@/components/image/LazyImage";
import AquaHomeHero from "./homeHeroSection";
import styles from "@/styles/home.module.css";

const AquaProducts = dynamic(() => import("./products"));

const serviceSteps = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Understand your water",
    description:
      "Tell us your source, hardness and household needs. We narrow the choices before you spend.",
  },
  {
    number: "02",
    icon: Droplets,
    title: "Choose the right system",
    description:
      "Compare practical options with transparent specifications, pricing and maintenance needs.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Install with confidence",
    description:
      "Get coordinated delivery, installation guidance and dependable support after purchase.",
  },
];

const needCards = [
  {
    icon: House,
    label: "For your home",
    title: "Softer water at every tap",
    description:
      "Protect bathrooms, appliances, skin and hair from everyday hard-water impact.",
    href: "/softener-planner",
    action: "Plan my softener",
  },
  {
    icon: Sparkles,
    label: "For drinking",
    title: "Purification you can trust",
    description:
      "Explore RO and filtration systems matched to taste, source water and family size.",
    href: "/shop",
    action: "Explore purifiers",
  },
  {
    icon: Building2,
    label: "For projects",
    title: "Solutions that scale",
    description:
      "Plan dependable water treatment for apartments, businesses and larger facilities.",
    href: "/contact-us",
    action: "Discuss a project",
  },
];

const AquaHomeComponent = ({
  initialCategories = [],
  initialProducts = [],
  managedSeo = null,
}) => {
  const router = useRouter();
  const seoData = {
    title: "Aquakart | Water Softeners, Purifiers & Home Water Solutions",
    description:
      "Find dependable water softeners, RO purifiers and filtration systems selected for Indian homes, with expert guidance and installation support.",
    image:
      "https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png",
    canonical: `${process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in"}${router.asPath}`,
    keywords:
      "water softeners, RO purifiers, home water filtration, hard water solutions, water treatment India",
    keyphrases:
      "water softener for home, RO water purifier, whole home water treatment, Aquakart water solutions",
  };

  return (
    <AquaLayout seo={seoData} managedSeo={managedSeo}>
      <div className={styles.page}>
        <div className={styles.shell}>
          <AquaHomeHero data={initialCategories} />

          <section className={styles.confidenceBar} aria-label="Why Aquakart">
            <div>
              <BadgeCheck size={20} />
              <span>
                <strong>Verified selection</strong>
                Products from trusted water-care brands
              </span>
            </div>
            <div>
              <Headphones size={20} />
              <span>
                <strong>Human guidance</strong>
                Help before and after your purchase
              </span>
            </div>
            <div>
              <Wrench size={20} />
              <span>
                <strong>Installation support</strong>A smoother path from order
                to operation
              </span>
            </div>
          </section>

          <section
            className={styles.needsSection}
            aria-labelledby="needs-title"
          >
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionEyebrow}>
                  Begin with your need
                </span>
                <h2 id="needs-title">A clearer way to find better water.</h2>
                <p>
                  Skip the catalogue confusion. Start with the outcome you want
                  and move directly to a suitable solution.
                </p>
              </div>
            </div>

            <div className={styles.needsGrid}>
              {needCards.map(({ icon: Icon, ...item }, index) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={styles.needCard}
                >
                  <div className={styles.needTopline}>
                    <span className={styles.needIcon}>
                      <Icon size={21} />
                    </span>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <small>{item.label}</small>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <strong>
                    {item.action} <ArrowRight size={15} />
                  </strong>
                </Link>
              ))}
            </div>
          </section>

          <AquaProducts initialProducts={initialProducts} />

          <section
            className={styles.collectionsSection}
            aria-labelledby="collections-title"
          >
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionEyebrow}>
                  Browse by collection
                </span>
                <h2 id="collections-title">Everything for better water.</h2>
                <p>
                  Explore a focused selection for homes, drinking water and
                  complete treatment systems.
                </p>
              </div>
              <Link href="/categories" className={styles.textLink}>
                All collections <ArrowRight size={16} />
              </Link>
            </div>

            <div className={styles.collectionGrid}>
              {initialCategories.slice(0, 6).map((category) => (
                <AquaCategoryCard
                  key={category?._id || category?.slug || category?.title}
                  category={category}
                  variant="collection"
                />
              ))}
            </div>
          </section>

          <section
            className={styles.processSection}
            aria-labelledby="process-title"
          >
            <div className={styles.processIntro}>
              <span className={styles.sectionEyebrow}>
                The Aquakart approach
              </span>
              <h2 id="process-title">
                From water problem to working solution.
              </h2>
              <p>
                A guided buying experience built to make a technical decision
                feel straightforward.
              </p>
              <Link href="/contact-us">
                Talk to a water expert <ArrowRight size={16} />
              </Link>
            </div>

            <div className={styles.processSteps}>
              {serviceSteps.map(({ icon: Icon, ...step }) => (
                <article key={step.number} className={styles.processStep}>
                  <div>
                    <span>{step.number}</span>
                    <Icon size={20} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.editorialSection}>
            <div className={styles.editorialImage}>
              <LazyImage
                src="https://res.cloudinary.com/aquakartproducts/image/upload/v1741968501/Blogs/jhkfgdhd9yatyml1bz4j.jpg"
                alt="Clean water flowing through a home water system"
                fill
                sizes="(max-width: 768px) 100vw, 48vw"
                imgClassName={styles.editorialImageAsset}
              />
            </div>
            <div className={styles.editorialContent}>
              <span className={styles.sectionEyebrow}>
                Aquakart water guide
              </span>
              <h2>Hard water leaves more than visible marks.</h2>
              <p>
                Learn how calcium and magnesium affect fixtures, appliances,
                skin and hair—and how the right treatment system changes the
                everyday experience of water.
              </p>
              <div>
                <Link href="/blogs" className={styles.primaryAction}>
                  Explore water guides <ArrowRight size={17} />
                </Link>
                <Link href="/softener-planner" className={styles.inlineLink}>
                  Use the softener planner
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AquaLayout>
  );
};

export default AquaHomeComponent;
