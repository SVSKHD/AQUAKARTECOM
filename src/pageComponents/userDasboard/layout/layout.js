import AquaUserGreet from "./greet";
import AquaUserDashboardHeader from "./header";

const AquaUserDashbordLayout = (props) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50">
      <AquaUserDashboardHeader />
      <AquaUserGreet userName="User" />
      <div className="w-full max-w-4xl px-4 py-8 flex justify-center">
        <div className="w-full bg-white rounded-2xl shadow-lg p-6">
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default AquaUserDashbordLayout;
