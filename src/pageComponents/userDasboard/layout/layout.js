import AquaUserGreet from "./greet";
import AquaUserDashboardHeader from "./header";
import { useSelector } from "react-redux";

const AquaUserDashbordLayout = (props) => {
  const { userData } = useSelector((state) => ({ ...state }));
  const getFirstLettersFromEmail = (email) => {
    if (!email || typeof email !== "string") {
      throw new Error("Invalid email");
    }
  
    const [username, domain] = email.split("@");
    if (!username || !domain) {
      throw new Error("Invalid email format");
    }
  
    const firstLetterUsername = username
    return firstLetterUsername;
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50">
      <AquaUserDashboardHeader />
      <AquaUserGreet userName={getFirstLettersFromEmail(userData?.user?.email)} />
      <div className="w-full max-w-4xl px-4 py-8 flex justify-center">
        <div className="w-full bg-white rounded-2xl shadow-lg p-6">
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default AquaUserDashbordLayout;
