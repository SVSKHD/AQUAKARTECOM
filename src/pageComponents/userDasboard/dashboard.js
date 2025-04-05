import { useEffect } from "react";
import AquaUserDashbordLayout from "./layout/layout";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";

const AquaUserDashbordPageComponent = () => {
  const router = useRouter();
  const { userData } = useSelector((state) => ({ ...state }));
  useEffect(() => {
    if (!userData) {
      router.push("/");
    }
  }, [userData]);
  return (
    <>
      <AquaUserDashbordLayout>
        <h1>Dasboard</h1>
      </AquaUserDashbordLayout>
    </>
  );
};
export default AquaUserDashbordPageComponent;
