import { useSelector } from "react-redux";
import AquaUserDashbordLayout from "./layout/layout";

const AquaUserCartPageComponent = () => {
  const { cartData } = useSelector((state) => ({ ...state }));
  return (
    <>
      <AquaUserDashbordLayout>
        <h1>Cart</h1>
      </AquaUserDashbordLayout>
    </>
  );
};
export default AquaUserCartPageComponent;
