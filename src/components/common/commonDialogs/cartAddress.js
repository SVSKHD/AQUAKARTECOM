import { useState, useEffect } from "react";
import AquaResponsiveDialog from "@/components/reusables/dialog";
import { useSelector, useDispatch } from "react-redux";

const AquaAddressDialog = ({ editData }) => {
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const dispatch = useDispatch();
  const { addressDialog, addressData } = useSelector((state) => ({
    ...state,
  }));
  useEffect(() => {
    if (addressData) {
      setAddress(addressData);
    } else if (!addressData) {
      setAddress({
        street: "",
        city: "",
        state: "",
        postalCode: "",
      });
    }
  }, [addressData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressAdd = () => {
    console.log("add", address);
    // Call the API to add the address
  };

  const handleAddressEdit = () => {
    console.log("edit", address);
    // Call the API to edit the address
  };

  const handleSubmit = () => {
    if (addressData) {
      handleAddressEdit();
    } else {
      handleAddressAdd();
    }
  };

  return (
    <>
      <AquaResponsiveDialog
        open={addressDialog}
        close={() =>
          dispatch({
            type: "SET_ADDRESS_DIALOG",
            payload: false,
          })
        }
      >
        <div className="m-5">
          <h3 className="font-semibold text-black mb-5">
            {editData ? "Edit Your Address" : "Please Fill Your Address"}
          </h3>
          <div className="col-span-full">
            <label
              htmlFor="street"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Street address
            </label>
            <div className="mt-2">
              <input
                id="street"
                name="street"
                value={address.street}
                onChange={handleChange}
                type="text"
                autoComplete="address-line1"
                className="p-3 block w-full rounded-md border-0 py-1.5 bg-white text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="sm:col-span-2 sm:col-start-1">
            <label
              htmlFor="city"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              City
            </label>
            <div className="mt-2">
              <input
                id="city"
                name="city"
                type="text"
                value={address.city}
                onChange={handleChange}
                autoComplete="address-level2"
                className="p-3 block w-full rounded-md border-0 py-1.5 bg-white text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="region"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              State / Province
            </label>
            <div className="mt-2">
              <input
                id="region"
                name="state"
                value={address.state}
                onChange={handleChange}
                type="text"
                autoComplete="address-level1"
                className="p-3 block w-full rounded-md border-0 py-1.5 bg-white text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="postal-code"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              ZIP / Postal code
            </label>
            <div className="mt-2">
              <input
                id="postal-code"
                name="postalCode"
                value={address.postalCode}
                onChange={handleChange}
                type="text"
                autoComplete="postal-code"
                className="p-3 block w-full rounded-md border-0 py-1.5 bg-white text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="mt-8 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={handleSubmit}
        >
          {addressData ? "Edit Address" : "Add Address"}
        </button>
      </AquaResponsiveDialog>
    </>
  );
};

export default AquaAddressDialog;
