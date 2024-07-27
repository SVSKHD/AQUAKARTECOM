import { useState, useEffect } from "react";
import AquaDashboardComponent from "@/components/Layout/userDasboard/dahsboard";
import { useDispatch, useSelector } from "react-redux";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";

const AquaDashboardPageComponent = () => {
  const dispatch = useDispatch();
  const [details, setDetails] = useState({});
  const [updateDetails, setUpdateDetails] = useState(false);
  const [updatePassword, setUpdatePassword] = useState(false);

  const { userData } = useSelector((state) => ({ ...state }));
  const [selectedAddress, setSelectedAddress] = useState(
    userData.data.user.selectedAddress,
  );

  const handleEditAddress = (e, r) => {
    e.preventDefault();
    console.log(r);
    dispatch({
      type: "SET_ADDRESS_DIALOG",
      payload: true,
    });
    dispatch({
      type: "SET_ADDRESS_DATA",
      payload: r,
    });
  };

  const handleAddAddress = () => {
    dispatch({
      type: "SET_ADDRESS_DIALOG",
      payload: true,
    });
    dispatch({
      type: "SET_ADDRESS_DATA",
      payload: null,
    });
  };
  useEffect(() => {
    if (updatePassword) {
      setUpdateDetails(false);
    } else if (updateDetails) {
      setUpdatePassword(false);
    }
  }, [updatePassword, updateDetails]);
  return (
    <AquaDashboardComponent title={"Dasboard"}>
      <button
        type="button"
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        onClick={() => setUpdateDetails(!updateDetails)}
      >
        Update Profile
      </button>

      <div className="mt-5">
        {updateDetails ? (
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Personal Information
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Use a permanent address where you can receive mail.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  First name
                </label>
                <div className="mt-2">
                  <input
                    id="first-name"
                    name="first-name"
                    type="text"
                    autoComplete="given-name"
                    className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="last-name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Last name
                </label>
                <div className="mt-2">
                  <input
                    id="last-name"
                    name="last-name"
                    type="text"
                    autoComplete="family-name"
                    className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md mt-5 bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Update Details
            </button>
          </div>
        ) : (
          ""
        )}
        {updatePassword ? (
          <>
            <form className="mt-5 sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="block w-full p-4 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <button
                type="submit"
                className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto"
              >
                Save
              </button>
            </form>
          </>
        ) : (
          ""
        )}
      </div>

      <h3 className="font-bold text-2xl">Addresses</h3>
      <button
        onClick={() => handleAddAddress()}
        type="button"
        className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Add Address
      </button>
      <h3 className="font-bold text-gray-400 text-2xl mt-5">
        Existing Addresses
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-1">
        {userData.data.user.addresses.map((r, i) => (
          <>
            <div className="m-2 overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <div className="mt-4">
                  <div className="flex items-center">
                    <input
                      value={r.street}
                      name="notification-method"
                      type="radio"
                      onChange={() => handleAddressChange(r.street)}
                      checked={r.street === selectedAddress.street}
                      className={`h-4 w-4 border-gray-300 focus:ring-indigo-600 ${selectedAddress === r.street ? "bg-indigo-600 text-white" : "bg-white text-gray-800"}`}
                    />
                    <label className="text-md ml-3 block text-sm font-medium leading-6 text-gray-900">
                      Billing Address
                    </label>
                  </div>
                  <p className="mt-1 text-gray-500">{r.street}</p>
                  <p className="text-gray-500">{r.state}</p>
                  <p className="text-gray-500">
                    {r.city}-{r.postalCode}
                  </p>
                </div>
                <div className="mt-4 flex space-x-4">
                  <button
                    className="flex items-center text-blue-500 hover:text-blue-700"
                    onClick={(e) => handleEditAddress(e, r)}
                  >
                    <PencilIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                    Edit
                  </button>
                  <button className="flex items-center text-red-500 hover:text-red-700">
                    <TrashIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </>
        ))}
      </div>
    </AquaDashboardComponent>
  );
};
export default AquaDashboardPageComponent;
