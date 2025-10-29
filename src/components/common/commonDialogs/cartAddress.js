import { useMemo, useState, useEffect } from "react";
import AquaResponsiveDialog from "@/components/reusables/dialog";
import { useSelector, useDispatch } from "react-redux";
import UserServiceOperations from "@/services/user";
import AquaToast from "@/components/reusables/react-toastify";
import { MapPinIcon } from "@heroicons/react/24/outline";

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
  const [errors, setErrors] = useState({});
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
    setErrors({});
  }, [addressData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (event) => {
    const { value } = event.target;
    const matchedState = STATE_CITY_OPTIONS.find(
      (item) => item.state === value,
    );
    setAddress((prev) => ({
      ...prev,
      state: value,
      city:
        matchedState && matchedState.cities.includes(prev.city)
          ? prev.city
          : "",
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
    const validationErrors = {};
    if (!address.street.trim()) {
      validationErrors.street = "Street is required";
    }
    if (!address.state.trim()) {
      validationErrors.state = "Select a state";
    }
    if (!address.city.trim()) {
      validationErrors.city = "Select or enter a city";
    }
    if (!address.postalCode.trim()) {
      validationErrors.postalCode = "Postal code is required";
    } else if (!/^\d{6}$/.test(address.postalCode.trim())) {
      validationErrors.postalCode = "Enter a valid 6 digit postal code";
    }

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      AquaToast({
        message: "Please review the highlighted fields",
        type: "error",
      });
      return;
    }

    setErrors({});
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
        <div className="space-y-6 rounded-3xl bg-white px-5 py-6 shadow-xl ring-1 ring-slate-100 sm:px-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <MapPinIcon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {editData
                  ? "Edit delivery address"
                  : "Add new delivery address"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Save an address for faster checkout and accurate installation
                support.
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <label
                htmlFor="street"
                className="text-sm font-medium text-slate-700"
              >
                Street address
              </label>
              <input
                id="street"
                name="street"
                value={address.street}
                onChange={handleChange}
                type="text"
                autoComplete="address-line1"
                className={`h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-800 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                  errors.street ? "border-rose-400" : "border-slate-200"
                }`}
                placeholder="House no, street, landmark"
              />
              {errors.street && (
                <p className="text-xs text-rose-500">{errors.street}</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <label
                  htmlFor="region"
                  className="text-sm font-medium text-slate-700"
                >
                  State
                </label>
                <select
                  id="region"
                  name="state"
                  value={address.state}
                  onChange={handleStateChange}
                  className={`h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-800 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                    errors.state ? "border-rose-400" : "border-slate-200"
                  }`}
                >
                  <option value="">Select state</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-xs text-rose-500">{errors.state}</p>
                )}
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="city"
                  className="text-sm font-medium text-slate-700"
                >
                  City
                </label>
                {cityOptions.length ? (
                  <select
                    id="city"
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                    className={`h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-800 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                      errors.city ? "border-rose-400" : "border-slate-200"
                    }`}
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
                    className={`h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-800 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                      errors.city ? "border-rose-400" : "border-slate-200"
                    }`}
                  />
                )}
                {errors.city && (
                  <p className="text-xs text-rose-500">{errors.city}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="postal-code"
                className="text-sm font-medium text-slate-700"
              >
                ZIP / Postal code
              </label>
              <input
                id="postal-code"
                name="postalCode"
                value={address.postalCode}
                onChange={handleChange}
                type="text"
                autoComplete="postal-code"
                placeholder="e.g. 500090"
                className={`h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-800 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                  errors.postalCode ? "border-rose-400" : "border-slate-200"
                }`}
              />
              {errors.postalCode && (
                <p className="text-xs text-rose-500">{errors.postalCode}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-slate-50/80 p-4 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Pro tip</p>
            <p>
              Ensure the address matches your installation location so our
              service engineers reach you without delays.
            </p>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-400"
            onClick={handleSubmit}
          >
            {addressData ? "Save changes" : "Save address"}
          </button>
        </div>
      </AquaResponsiveDialog>
    </>
  );
};

export default AquaAddressDialog;
