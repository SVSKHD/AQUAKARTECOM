import AquaUserDashbordLayout from "./layout/layout";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import ProfileDetailsDialog from "@/components/common/commonDialogs/profileDetailsDialog";
import UserServiceOperations from "@/services/user";
import AquaToast from "@/components/reusables/react-toastify";

const formatAddress = (address) => {
  if (!address || typeof address !== "object") {
    return "";
  }

  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
  ]
    .filter(Boolean)
    .map((part) => part.trim());

  return parts.join(", ");
};

const formatDob = (dob) => {
  if (!dob) {
    return "";
  }

  const parsedDate = new Date(dob);

  if (Number.isNaN(parsedDate.getTime())) {
    return dob;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const toDateInputValue = (dob) => {
  if (!dob) {
    return "";
  }

  const parsedDate = new Date(dob);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsedDate.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const AquaUserProfilePageComponent = () => {
  const { userData } = useSelector((state) => ({ ...state }));
  const dispatch = useDispatch();
  const user = userData?.user ?? {};

  const alternatePhone =
    user?.alternatePhone ||
    user?.alternate_phone ||
    user?.altPhone ||
    user?.alternateMobile ||
    "";

  const addresses = Array.isArray(user?.addresses) ? user.addresses : [];
  const primaryAddress = user?.selectedAddress || addresses[0];
  const addressCount = addresses.length;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFocus, setDialogFocus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogInitialValues = useMemo(
    () => ({
      firstName: `${user?.firstName ?? ""}`,
      lastName: `${user?.lastName ?? ""}`,
      email: `${user?.email ?? ""}`,
      phone: `${user?.phone ?? ""}`,
      alternatePhone: `${alternatePhone ?? ""}`,
      dob: toDateInputValue(user?.dob),
      address: formatAddress(primaryAddress),
    }),
    [
      alternatePhone,
      primaryAddress,
      user?.dob,
      user?.email,
      user?.firstName,
      user?.lastName,
      user?.phone,
    ],
  );

  const profileHighlights = useMemo(
    () => [
      {
        key: "firstName",
        title: "First Name",
        value: user?.firstName || "",
        helper: "Helps us personalise your experience.",
        actionLabel: user?.firstName ? "Update first name" : "Add first name",
        focusField: "firstName",
        isComplete: Boolean(user?.firstName),
      },
      {
        key: "lastName",
        title: "Last Name",
        value: user?.lastName || "",
        helper: "We'll use this on invoices and delivery labels.",
        actionLabel: user?.lastName ? "Update last name" : "Add last name",
        focusField: "lastName",
        isComplete: Boolean(user?.lastName),
      },
      {
        key: "address",
        title: "Saved Address",
        value: formatAddress(primaryAddress),
        helper:
          addressCount > 1
            ? `Default address set. ${addressCount - 1} additional address${
                addressCount - 1 === 1 ? "" : "es"
              } saved.`
            : addressCount === 1
              ? "Default address set for faster deliveries."
              : "Add an address to speed up checkout and service visits.",
        actionLabel: addressCount ? "Edit address" : "Add address",
        focusField: "address",
        isComplete: Boolean(addressCount),
      },
      {
        key: "email",
        title: "Email",
        value: user?.email || "",
        helper: "We'll email you order updates and service reminders.",
        actionLabel: user?.email ? "Update email" : "Add email",
        focusField: "email",
        isComplete: Boolean(user?.email),
      },
      {
        key: "phone",
        title: "Primary Phone",
        value: user?.phone || "",
        helper: "Your go-to contact number for delivery coordination.",
        actionLabel: user?.phone ? "Update phone" : "Add phone",
        focusField: "phone",
        isComplete: Boolean(user?.phone),
      },
      {
        key: "alternate-phone",
        title: "Alternate Phone",
        value: alternatePhone,
        helper: "Add a backup number so service teams can always reach you.",
        actionLabel: alternatePhone ? "Update alternate" : "Add alternate",
        focusField: "alternatePhone",
        isComplete: Boolean(alternatePhone),
      },
      {
        key: "dob",
        title: "Date of Birth",
        value: formatDob(user?.dob),
        helper: "Helps us personalise offers and reminders.",
        actionLabel: user?.dob ? "Update DOB" : "Add DOB",
        focusField: "dob",
        isComplete: Boolean(user?.dob),
      },
    ],
    [
      addressCount,
      alternatePhone,
      primaryAddress,
      user?.dob,
      user?.email,
      user?.firstName,
      user?.lastName,
      user?.phone,
    ],
  );

  const handleOpenDialog = (focusField) => {
    setDialogFocus(focusField || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogFocus(null);
  };

  const sanitize = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = typeof value === "string" ? value : String(value ?? "");
    return stringValue.trim();
  };

  const handleSaveDetails = async (values) => {
    if (!userData?.user?._id) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = userData.user._id;
      const token = userData.token;

      const originalAddresses = addresses.map((address) => ({ ...address }));
      const existingSelected = primaryAddress ? { ...primaryAddress } : null;

      const trimmedAddress = sanitize(values.address);

      let updatedSelectedAddress = existingSelected;
      let updatedAddresses = [...originalAddresses];

      if (trimmedAddress) {
        if (updatedSelectedAddress) {
          updatedSelectedAddress = {
            ...updatedSelectedAddress,
            street: trimmedAddress,
          };
        } else {
          updatedSelectedAddress = { street: trimmedAddress };
        }

        if (updatedAddresses.length > 0) {
          updatedAddresses = updatedAddresses.map((addr, index) => {
            if (
              (addr._id &&
                primaryAddress?._id &&
                addr._id === primaryAddress._id) ||
              (!primaryAddress?._id && index === 0)
            ) {
              return { ...addr, street: trimmedAddress };
            }
            return addr;
          });
        } else {
          updatedAddresses = [{ street: trimmedAddress }];
        }
      }

      const newDetails = {
        firstName: sanitize(values.firstName),
        lastName: sanitize(values.lastName),
        email: sanitize(values.email),
        phone: sanitize(values.phone),
        alternatePhone: sanitize(values.alternatePhone),
        dob: sanitize(values.dob),
      };

      if (updatedAddresses.length > 0) {
        newDetails.addresses = updatedAddresses;
      }

      if (updatedSelectedAddress) {
        newDetails.selectedAddress = updatedSelectedAddress;
      }

      const payload = {
        newDetails,
      };

      const response = await UserServiceOperations.UserUpdateDetails(
        userId,
        payload,
        token,
      );

      dispatch({
        type: "UPDATE_USER_DETAILS",
        payload: response.data,
      });

      AquaToast({
        message: "Profile details updated successfully",
        type: "success",
      });

      handleCloseDialog();
    } catch (error) {
      console.error("Failed to update profile details", error);
      AquaToast({
        message: "Could not update profile details. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addressesMatch = (first = {}, second = {}) => {
    if (first?._id && second?._id) {
      return first._id === second._id;
    }

    return JSON.stringify(first) === JSON.stringify(second);
  };

  const handleSelectDefaultAddress = async (address) => {
    if (!userData?.user?._id) {
      return;
    }

    try {
      await UserServiceOperations.UserUpdateDetails(
        userData.user._id,
        {
          newDetails: {
            selectedAddress: address,
          },
        },
        userData.token,
      );

      dispatch({
        type: "UPDATE_SELECTED_ADDRESS",
        payload: { selectedAddress: address },
      });

      AquaToast({
        message: "Default address updated",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to update default address", error);
      AquaToast({
        message: "Unable to set default address. Please try again.",
        type: "error",
      });
    }
  };

  const handleAddAddress = () => {
    dispatch({ type: "SET_ADDRESS_DIALOG", payload: true });
    dispatch({ type: "SET_ADDRESS_DATA", payload: null });
  };

  const handleEditAddress = (address) => {
    dispatch({ type: "SET_ADDRESS_DIALOG", payload: true });
    dispatch({ type: "SET_ADDRESS_DATA", payload: address });
  };

  return (
    <AquaUserDashbordLayout>
      <div className="grid gap-5 px-2 sm:grid-cols-2 sm:px-0">
        {profileHighlights.map((item) => {
          const isComplete = Boolean(item.isComplete);
          const StatusIcon = isComplete
            ? CheckCircleIcon
            : ExclamationTriangleIcon;
          const statusClasses = isComplete
            ? "bg-emerald-50/80 text-emerald-700"
            : "bg-amber-50/80 text-amber-700";
          const cardTint = isComplete
            ? "glass-tint-emerald"
            : "glass-tint-amber";

          return (
            <div
              key={item.key}
              className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cardTint}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-base font-medium text-gray-900">
                    {item.value || "Not provided yet"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusClasses}`}
                  >
                    <StatusIcon className="h-4 w-4" aria-hidden="true" />
                    {isComplete ? "Updated" : "Pending"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500">{item.helper}</p>
              <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenDialog(item.focusField)}
                  className="btn-glass inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/50 px-3 py-1.5 font-medium text-indigo-600 backdrop-blur-sm hover:bg-white/80 sm:w-auto"
                >
                  <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  {item.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <section className="mt-10 glass-tint-indigo rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Delivery addresses
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Set which address should be used by default during checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddAddress}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 sm:w-auto"
          >
            + Add address
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.length ? (
            addresses.map((address) => {
              const isDefault = addressesMatch(address, primaryAddress);
              return (
                <div
                  key={address._id || address.street}
                  className={`relative flex flex-col gap-3 rounded-2xl p-4 transition-all duration-300 ${
                    isDefault
                      ? "glass-tint-emerald shadow-md"
                      : "glass-card hover:-translate-y-0.5 hover:shadow-lg"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {address?.label || "Saved address"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {[
                          address.street,
                          address.city,
                          address.state,
                          address.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-indigo-600">
                      {isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-indigo-600">
                          <CheckCircleIcon
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Default
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSelectDefaultAddress(address)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
                          isDefault
                            ? "border-indigo-500 bg-indigo-500 text-white"
                            : "border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {isDefault ? "Selected" : "Set as default"}
                      </button>
                    </div>
                  </div>
                  {address.phone && (
                    <p className="text-xs text-gray-500">
                      Contact: {address.phone}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEditAddress(address)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
                  >
                    Edit address
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
              <h3 className="text-base font-semibold text-gray-900">
                No addresses saved yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Add an address from the checkout page to enable default
                selection here.
              </p>
            </div>
          )}
        </div>
      </section>
      <ProfileDetailsDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        initialValues={dialogInitialValues}
        onSubmit={handleSaveDetails}
        isSubmitting={isSubmitting}
        focusField={dialogFocus}
      />
    </AquaUserDashbordLayout>
  );
};
export default AquaUserProfilePageComponent;
