import AquaLayout from "@/components/layouts/layout";
import ProductCard from "@/components/cards/ProductCard"; // Adjust the import path as needed

const AquaShopComponentIndex = () => {
  const seo = {
    title: "shop",
  };
  const products = [
    {
      id: 1,
      name: "Basic Tee 8-Pack",
      href: "#",
      price: "$256",
      description:
        "Get the full lineup of our Basic Tees. Have a fresh shirt all week, and an extra for laundry day.",
      options: "8 colors",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/category-page-02-image-card-01.jpg",
      imageAlt:
        "Eight shirts arranged on table in black, olive, grey, blue, white, red, mustard, and green.",
    },
    {
      id: 2,
      name: "Basic Tee",
      href: "#",
      price: "$32",
      description:
        "Look like a visionary CEO and wear the same black t-shirt every day.",
      options: "Black",
      imageSrc:
        "https://tailwindui.com/img/ecommerce-images/category-page-02-image-card-02.jpg",
      imageAlt: "Front of plain black t-shirt.",
    },
    // More products...
  ];

  return (
    <>
      <AquaLayout seo={seo}>
        <div className="bg-white">
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
            <h2 className="text-xl font-bold text-gray-900">Customers also bought</h2>
            
              {products.map((product) => (
                <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
                <ProductCard key={product.id} product={product} />
                </div>
              ))}
            
          </div>
        </div>
      </AquaLayout>
    </>
  );
};

export default AquaShopComponentIndex;
