import { useDispatch, useSelector } from "react-redux";
import AquaFavoriteCompareCard from "@/components/cards/favCompareCard";

const AquaCartComponent = () => {
  const { cartData } = useSelector((state) => ({ ...state }));
  const dispatch = useDispatch();

  const AddToCompare = (product) => {
    console.log("compare", product);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
        {(!cartData || cartData.length === 0) ? (
          "No Products in Cart yet"
        ) : (
          <>
            {cartData.map((product, index) => (
              <AquaFavoriteCompareCard
                key={index}
                product={product}
                onCompare={() => AddToCompare(product)} // Correctly passes the product to AddToCompare
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default AquaCartComponent;
