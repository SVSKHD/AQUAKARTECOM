import AquaUserDashbordLayout from "./layout/layout";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CircleUserRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import ProfileDetailsDialog from "@/components/common/commonDialogs/profileDetailsDialog";
import UserServiceOperations from "@/services/user";
import AquaToast from "@/components/reusables/react-toastify";
import styles from "@/styles/profile.module.css";

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
        title: "First name",
        value: user?.firstName || "",
        focusField: "firstName",
        isComplete: Boolean(user?.firstName),
        icon: CircleUserRound,
      },
      {
        key: "lastName",
        title: "Last name",
        value: user?.lastName || "",
        focusField: "lastName",
        isComplete: Boolean(user?.lastName),
        icon: CircleUserRound,
      },
      {
        key: "email",
        title: "Email",
        value: user?.email || "",
        focusField: "email",
        isComplete: Boolean(user?.email),
        icon: Mail,
      },
      {
        key: "phone",
        title: "Primary phone",
        value: user?.phone || "",
        focusField: "phone",
        isComplete: Boolean(user?.phone),
        icon: Phone,
      },
      {
        key: "alternate-phone",
        title: "Alternate phone",
        value: alternatePhone,
        focusField: "alternatePhone",
        isComplete: Boolean(alternatePhone),
        icon: Smartphone,
      },
      {
        key: "dob",
        title: "Date of birth",
        value: formatDob(user?.dob),
        focusField: "dob",
        isComplete: Boolean(user?.dob),
        icon: CalendarDays,
      },
    ],
    [
      alternatePhone,
      user?.dob,
      user?.email,
      user?.firstName,
      user?.lastName,
      user?.phone,
    ],
  );

  const profileCompletion = useMemo(() => {
    const completedFields =
      profileHighlights.filter((item) => item.isComplete).length +
      (addressCount ? 1 : 0);
    return Math.round((completedFields / (profileHighlights.length + 1)) * 100);
  }, [addressCount, profileHighlights]);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    "Aquakart customer";
  const initials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((value) => value.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "A";

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
    <AquaUserDashbordLayout
      title="Your profile"
      subtitle="Personal details, delivery preferences and account readiness."
      focused
    >
      <div className={styles.profilePage}>
        <section className={styles.profileHero}>
          <div className={styles.identityBlock}>
            <div className={styles.avatar} aria-hidden="true">
              {initials}
              <span>
                <BadgeCheck size={17} />
              </span>
            </div>
            <div>
              <span className={styles.eyebrow}>Aquakart account</span>
              <h2>{displayName}</h2>
              <p>{user?.email || "Add an email to receive account updates."}</p>
            </div>
          </div>

          <div className={styles.profileActions}>
            <div className={styles.completion}>
              <div>
                <span>Profile readiness</span>
                <strong>{profileCompletion}%</strong>
              </div>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label="Profile completion"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={profileCompletion}
              >
                <span style={{ width: `${profileCompletion}%` }} />
              </div>
              <p>
                {profileCompletion === 100
                  ? "Everything is ready for a faster checkout."
                  : "Complete pending details for smoother delivery and service."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenDialog(null)}
              className={styles.editProfileButton}
            >
              <Pencil size={16} />
              Edit profile
            </button>
          </div>
        </section>

        <div className={styles.profileGrid}>
          <section className={styles.detailsPanel}>
            <div className={styles.panelHeading}>
              <div>
                <span className={styles.eyebrow}>Personal information</span>
                <h2>Details used across Aquakart</h2>
              </div>
              <ShieldCheck size={21} />
            </div>

            <div className={styles.detailsList}>
              {profileHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleOpenDialog(item.focusField)}
                    className={styles.detailRow}
                  >
                    <span className={styles.detailIcon}>
                      <Icon size={18} />
                    </span>
                    <span className={styles.detailCopy}>
                      <small>{item.title}</small>
                      <strong>{item.value || "Add this detail"}</strong>
                    </span>
                    <span
                      className={
                        item.isComplete
                          ? styles.completeStatus
                          : styles.pendingStatus
                      }
                    >
                      {item.isComplete ? (
                        <Check size={13} />
                      ) : (
                        <Plus size={13} />
                      )}
                      {item.isComplete ? "Ready" : "Add"}
                    </span>
                    <ArrowRight size={16} className={styles.rowArrow} />
                  </button>
                );
              })}
            </div>

            <div className={styles.securityNote}>
              <ShieldCheck size={18} />
              <p>
                Your contact details are used only for orders, delivery,
                invoices and requested service communication.
              </p>
            </div>
          </section>

          <aside className={styles.accountPanel}>
            <span className={styles.eyebrow}>Account snapshot</span>
            <h2>Ready when you are.</h2>
            <div className={styles.snapshotStats}>
              <div>
                <strong>{addressCount}</strong>
                <span>Saved addresses</span>
              </div>
              <div>
                <strong>
                  {profileHighlights.filter((item) => item.isComplete).length}
                </strong>
                <span>Details completed</span>
              </div>
            </div>
            <div className={styles.defaultAddress}>
              <MapPin size={19} />
              <div>
                <span>Default delivery address</span>
                <p>
                  {formatAddress(primaryAddress) ||
                    "No default address selected yet."}
                </p>
              </div>
            </div>
            <button type="button" onClick={handleAddAddress}>
              <Plus size={15} /> Add another address
            </button>
          </aside>
        </div>

        <section className={styles.addressSection}>
          <div className={styles.addressHeading}>
            <div>
              <span className={styles.eyebrow}>Delivery book</span>
              <h2>Saved addresses</h2>
              <p>
                Select the address Aquakart should use by default during
                checkout and service bookings.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddAddress}
              className={styles.addAddressButton}
            >
              <Plus size={15} /> Add address
            </button>
          </div>

          <div className={styles.addressGrid}>
            {addresses.length ? (
              addresses.map((address) => {
                const isDefault = addressesMatch(address, primaryAddress);
                return (
                  <article
                    key={address._id || address.street}
                    className={`${styles.addressCard} ${
                      isDefault ? styles.defaultAddressCard : ""
                    }`}
                  >
                    <div className={styles.addressCardTop}>
                      <span className={styles.addressIcon}>
                        <MapPin size={18} />
                      </span>
                      <div>
                        <h3>{address?.label || "Saved address"}</h3>
                        <p>
                          {[
                            address.street,
                            address.landmark,
                            address.city,
                            address.state,
                            address.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      {isDefault && (
                        <span className={styles.defaultBadge}>
                          <Check size={12} />
                          Default
                        </span>
                      )}
                    </div>
                    {address.phone && (
                      <span className={styles.addressPhone}>
                        <Phone size={13} /> {address.phone}
                      </span>
                    )}
                    <div className={styles.addressActions}>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSelectDefaultAddress(address)}
                        >
                          Set as default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditAddress(address)}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className={styles.emptyAddress}>
                <MapPin size={24} />
                <h3>Your address book is empty.</h3>
                <p>Add an address now for a quicker checkout next time.</p>
                <button type="button" onClick={handleAddAddress}>
                  Add first address
                </button>
              </div>
            )}
          </div>
        </section>
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
