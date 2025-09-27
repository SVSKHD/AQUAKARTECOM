import { useMemo, useState, useEffect } from "react";
import AquaResponsiveDialog from "@/components/reusables/dialog";
import { useSelector, useDispatch } from "react-redux";
import UserServiceOperations from "@/services/user";
import AquaToast from "@/components/reusables/react-toastify";

const STATE_CITY_OPTIONS = [
  {
    state: "Telangana",
    cities: ["Hyderabad", "Secunderabad", "Warangal", "Nizamabad"],
  },
  {
    state: "Andhra Pradesh",
    cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
  },
  {
    state: "Karnataka",
    cities: ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru"],
  },
  {
    state: "Tamil Nadu",
    cities: ["Chennai", "Coimbatore", "Madurai", "Salem"],
  },
  {
    state: "Maharashtra",
    cities: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  },
  {
    state: "Delhi",
    cities: ["New Delhi", "Dwarka", "Saket", "Karol Bagh"],
  },
];

const AquaAddressDialog = ({ editData }) => {
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const dispatch = useDispatch();
  const { addressDialog, addressData, userData } = useSelector((state) => ({
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

  const handleStateChange = (event) => {
    const { value } = event.target;
    const matchedState = STATE_CITY_OPTIONS.find((item) => item.state === value);
    setAddress((prev) => ({
      ...prev,
      state: value,
      city:
        matchedState && matchedState.cities.includes(prev.city) ? prev.city : "",
    }));
  };

  const stateOptions = useMemo(() => {
    const baseStates = STATE_CITY_OPTIONS.map((item) => item.state);
    if (address.state && !baseStates.includes(address.state)) {
      return [address.state, ...baseStates];
    }
    return baseStates;
  }, [address.state]);

  const cityOptions = useMemo(() => {
    const selectedState = STATE_CITY_OPTIONS.find(
      (item) => item.state === address.state,
    );
    const baseCities = selectedState ? selectedState.cities : [];
    if (address.city && !baseCities.includes(address.city)) {
      return [address.city, ...baseCities];
    }
    return baseCities;
  }, [address.state, address.city]);

  const handleAddressAdd = () => {
    const userAddress = userData.user.addresses;

    // Check if the address already exists in the array
    const addressExists = userAddress.some(
      (addr) =>
        addr.street === address.street &&
        addr.city === address.city &&
        addr.state === address.state &&
        addr.postalCode === address.postalCode,
    );

    // If the address does not exist, add it to the array
    if (!addressExists) {
      userAddress.push(address);
      console.log("modified-address", userAddress, userData.token);

      // Prepare the payload
      const payload = {
        newDetails: {
          addresses: userAddress,
        },
      };

      // Call the API to update the user details
      UserServiceOperations.UserUpdateDetails(
        userData.user._id,
        payload,
        userData.token,
      ).then((res) => {
        // Dispatch the action to update the user details in the store
        dispatch({
          type: "UPDATE_USER_ADDRESSES",
          payload: {
            addresses: res.data.addresses,
          },
        });
        dispatch({
          type: "SET_ADDRESS_DIALOG",
          payload: false,
        });
      });
    } else {
      AquaToast({ message: "Address already exists.", type: "error" });
    }
  };

  const handleAddressEdit = () => {
    // Create a new array with the updated address
    const updatedAddresses = userData.user.addresses.map((r) =>
      r._id === address._id ? address : r,
    );

    if (updatedAddresses) {
      const newDetails = { addresses: updatedAddresses };
      const payload = {
        newDetails,
      };
      console.log("address", payload);
      UserServiceOperations.UserUpdateDetails(
        userData.user._id,
        payload,
        userData.token,
      )
        .then((res) => {
          AquaToast({
            message: "successfully updated address",
            type: "success",
          });
          dispatch({
            type: "UPDATE_USER_ADDRESSES",
            payload: {
              addresses: res.data.addresses,
            },
          });
          dispatch({
            type: "SET_ADDRESS_DIALOG",
            payload: false,
          });
        })
        .catch((err) => {
          AquaToast({
            message: "Please try adding new address",
            type: "error",
          });
        });
    }

    // Update the userData object with the new addresses array

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
              {cityOptions.length ? (
                <select
                  id="city"
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  className="p-3 block w-full rounded-md border-0 bg-white text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option value="">Select city</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={address.city}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  placeholder="Enter city"
                  className="p-3 block w-full rounded-md border-0 py-1.5 bg-white text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              )}
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
              <select
                id="region"
                name="state"
                value={address.state}
                onChange={handleStateChange}
                className="p-3 block w-full rounded-md border-0 bg-white text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">Select state</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
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
