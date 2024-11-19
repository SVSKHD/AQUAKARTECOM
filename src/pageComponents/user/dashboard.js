import { useState, useEffect } from "react";
import AquaDashboardComponent from "@/components/Layout/userDasboard/dahsboard";
import { useDispatch, useSelector } from "react-redux";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import AquaInput from "@/components/common/input";
import UserServiceOperations from "@/services/user";
import AquaToast from "@/components/reusables/react-toastify";
import AquaPromptDialog from "@/components/common/promptDialogs/promtDialog";

const AquaDashboardPageComponent = () => {
  const { userData } = useSelector((state) => ({ ...state }));
  const dispatch = useDispatch();

  const [details, setDetails] = useState({});
  const [title, setTitle] = useState("");
  const [updateDetails, setUpdateDetails] = useState(false);
  const [updatePassword, setUpdatePassword] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [bulkUpdate, setBulkUpdate] = useState({
    firstName: userData?.user.firstName,
    lastName: userData?.user.lastName,
    email: userData?.user.email,
    phone: userData?.user.phone,
    dob: userData?.user.dob,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBulkUpdate((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleUpdateDetails = async () => {
    const newDetails = { ...bulkUpdate };
    const id = userData.user._id;
    const token = userData.token;

    const payload = { newDetails };

    await UserServiceOperations.UserUpdateDetails(id, payload, token)
      .then((res) => {
        console.log("apiu", res.data);
        dispatch({
          type: "UPDATE_USER_DETAILS",
          payload: res.data,
        });
        AquaToast({ message: "Successfully Updated details", type: "success" });
        setUpdateDetails(!updateDetails);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const [selectedAddress, setSelectedAddress] = useState(
    userData.user.selectedAddress,
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

  const titleGenerate = (user) => {
    if (user?.firstName) {
      setTitle(`Welcome back "${user.firstName}"`);
    } else {
      setTitle("Dashboard");
    }
  };

  useEffect(() => {
    if (userData) {
      titleGenerate(userData.user);
    }
  }, [userData]);

  const handleDeleteAddress = (e, r) => {
    e.preventDefault();
    const addresses = userData.user.addresses.filter((r) => r._id !== deleteId);
    const payload = {
      newDetails: {
        addresses,
      },
    };
    UserServiceOperations.UserUpdateDetails(
      userData.user._id,
      payload,
      userData.token,
    )
      .then((res) => {
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
        setPrompt(false);
        AquaToast({ message: "successfully updated address", type: "success" });
      })
      .catch((err) => {
        AquaToast({ message: "Please try adding new address", type: "error" });
      });
  };

  const handleDeleteAddressDialog = (e, r) => {
    e.preventDefault();
    setPrompt(true);
    setDeleteId(r._id);
  };

  return (
    <AquaDashboardComponent title={title}>
      <AquaPromptDialog
        open={prompt}
        close={() => setPrompt(!prompt)}
        title={"Address Delete Confirmation"}
        handleCancel={() => setPrompt(!prompt)}
        handleOk={(e) => handleDeleteAddress(e, deleteId)}
      />
      <div className="mt-5"></div>

      <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none mb-5">
        <div>
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Profile
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            This information will be displayed publicly so be careful what you
            share.
          </p>

          <dl className="mt-6 space-y-6 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">
            <div className="pt-6 sm:flex">
              <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">
                Full name
              </dt>
              <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                <div className="text-gray-900">{userData?.user.firstName}</div>
              </dd>
            </div>
            <div className="pt-6 sm:flex">
              <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">
                Last Name
              </dt>
              <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                <div className="text-gray-900">{userData?.user.lastName}</div>
              </dd>
            </div>
            <div className="pt-6 sm:flex">
              <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">
                Email address
              </dt>
              <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                <div className="text-gray-900">{userData?.user.email}</div>
              </dd>
            </div>
            <div className="pt-6 sm:flex">
              <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">
                Contact
              </dt>
              <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                <div className="text-gray-900">{userData?.user.phone}</div>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mt-5">
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={() => setUpdateDetails(!updateDetails)}
        >
          Update Profile
        </button>
        {updateDetails ? (
          <div className="border-b border-gray-900/10 pb-12 mt-5">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Personal Information
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Use a valid email address where you can receive mail.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <AquaInput
                  id="first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={bulkUpdate.firstName}
                  onChange={handleChange}
                  label="First name"
                  placeholder="Enter your first name"
                />
              </div>

              <div className="sm:col-span-3">
                <AquaInput
                  id="last-name"
                  name="lastName"
                  type="text"
                  autoComplete="given-name"
                  value={bulkUpdate.lastName}
                  onChange={handleChange}
                  label="last name"
                  placeholder="Enter your last name"
                />
              </div>

              <div className="sm:col-span-3">
                <AquaInput
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="given-name"
                  value={bulkUpdate.email}
                  onChange={handleChange}
                  label="Email"
                  placeholder="Enter your email"
                  disabled={bulkUpdate?.email === userData?.user.email}
                />
              </div>
              <div className="sm:col-span-3">
                <AquaInput
                  id="phone"
                  name="phone"
                  type="number"
                  autoComplete="given-name"
                  value={bulkUpdate.phone}
                  onChange={handleChange}
                  maxLength={10}
                  label="Phone"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <button
              type="button"
              className="rounded-md mt-5 bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={handleUpdateDetails}
            >
              Update Details
            </button>
          </div>
        ) : (
          ""
        )}
      </div>

      <h3 className="font-bold text-gray-400 text-2xl mt-5">
        Existing Addresses
      </h3>
      <button
        onClick={() => handleAddAddress()}
        type="button"
        className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Add Address
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-1">
        {userData.user.addresses.map((r, i) => (
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
                      checked={r.street === selectedAddress?.street}
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
                  <button
                    className="flex items-center text-red-500 hover:text-red-700"
                    onClick={(e) => handleDeleteAddressDialog(e, r)}
                  >
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
