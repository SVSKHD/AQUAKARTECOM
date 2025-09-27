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

  const parts = [address.street, address.city, address.state, address.postalCode]
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

  const primaryAddress = user?.selectedAddress || user?.addresses?.[0];
  const addressCount = user?.addresses?.length || 0;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFocus, setDialogFocus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogInitialValues = useMemo(
    () => ({
      email: user?.email || "",
      phone: user?.phone || "",
      alternatePhone: alternatePhone || "",
      dob: toDateInputValue(user?.dob),
      address: formatAddress(primaryAddress),
    }),
    [alternatePhone, primaryAddress, user?.dob, user?.email, user?.phone],
  );

  const profileHighlights = useMemo(
    () => [
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
        helper:
          "Add a backup number so service teams can always reach you.",
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
    [addressCount, alternatePhone, primaryAddress, user?.dob, user?.email, user?.phone],
  );

  const handleOpenDialog = (focusField) => {
    setDialogFocus(focusField || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogFocus(null);
  };

  const handleSaveDetails = async (values) => {
    if (!userData?.user?._id) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = userData.user._id;
      const token = userData.token;

      const originalAddresses = Array.isArray(user?.addresses)
        ? user.addresses.map((address) => ({ ...address }))
        : [];
      const existingSelected = primaryAddress ? { ...primaryAddress } : null;

      const trimmedAddress = values.address?.trim() || "";

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
              (addr._id && primaryAddress?._id && addr._id === primaryAddress._id) ||
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
        email: values.email?.trim() || "",
        phone: values.phone?.trim() || "",
        alternatePhone: values.alternatePhone?.trim() || "",
        dob: values.dob || "",
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

  return (
    <AquaUserDashbordLayout>
      <div className="grid gap-6 sm:grid-cols-2">
        {profileHighlights.map((item) => {
          const isComplete = Boolean(item.isComplete);
          const StatusIcon = isComplete
            ? CheckCircleIcon
            : ExclamationTriangleIcon;
          const statusClasses = isComplete
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700";

          return (
            <div
              key={item.key}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-base font-medium text-gray-900">
                    {item.value || "Not provided yet"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusClasses}`}
                >
                  <StatusIcon className="h-4 w-4" aria-hidden="true" />
                  {isComplete ? "Updated" : "Pending"}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500">{item.helper}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => handleOpenDialog(item.focusField)}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 font-medium text-indigo-600 transition hover:bg-indigo-100"
                >
                  <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  {item.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>
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
