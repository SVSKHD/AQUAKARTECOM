import { useSelector } from "react-redux";
import AquaUserDashbordLayout from "./layout/layout";
import DashboardProductCard from "./layout/cards/cartCard";

const AquaUserCartPageComponent = () => {
  const { cartData } = useSelector((state) => ({ ...state }));
  return (
    <>
      <AquaUserDashbordLayout>
      {cartData?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
          {cartData.map((r, i) => (
            <DashboardProductCard key={i} product={r} />
          ))}
        </div>
      ) : (
        <div className="p-4">
          <h1 className="text-center text-gray-600 text-lg">No favourites yet.</h1>
        </div>
      )}
      </AquaUserDashbordLayout>
    </>
  );
};
export default AquaUserCartPageComponent;
