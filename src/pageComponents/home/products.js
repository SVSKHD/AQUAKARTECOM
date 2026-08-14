import Link from "next/link";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

import ReusableProductCard from "@/components/cards/ProductCardTwo";
import styles from "@/styles/home.module.css";

const AquaProducts = ({ initialProducts = [] }) => {
  const visibleProducts = initialProducts.slice(0, 4);

  return (
    <section
      className={styles.productsSection}
      aria-labelledby="products-title"
    >
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.sectionEyebrow}>Customer favourites</span>
          <h2 id="products-title">Solutions people choose with confidence.</h2>
          <p>
            Proven water-care essentials selected for performance, service and
            everyday reliability.
          </p>
        </div>
        <Link href="/shop" className={styles.textLink}>
          View complete shop <ArrowRight size={16} />
        </Link>
      </div>

      {visibleProducts.length ? (
        <div className={styles.productGrid}>
          {visibleProducts.map((product) => (
            <div key={product._id || product.id} className={styles.productItem}>
              <ReusableProductCard product={product} variant="standard" />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyProducts}>
          <SlidersHorizontal size={24} />
          <strong>Our catalogue is being refreshed.</strong>
          <span>Visit the shop to explore all available water solutions.</span>
          <Link href="/shop">Open shop</Link>
        </div>
      )}

      <Link href="/shop" className={styles.mobileCatalogLink}>
        Browse the complete catalogue <ArrowRight size={16} />
      </Link>
    </section>
  );
};

export default AquaProducts;
