const AquaUserGreet = ({ userName = "there" }) => {
  return (
    <div className="text-center mt-4">
      <h2 className="text-3xl font-semibold">
        <span className="text-gray-500">Hello there, </span>
        <span className="text-gray-900">{userName}</span> 👋
      </h2>
    </div>
  );
};

export default AquaUserGreet;
