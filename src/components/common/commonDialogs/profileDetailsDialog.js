import { useEffect, useMemo, useRef, useState } from "react";
import AquaResponsiveDialog from "@/components/reusables/dialog";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const defaultValues = {
  email: "",
  phone: "",
  alternatePhone: "",
  dob: "",
  address: "",
};

const ProfileDetailsDialog = ({
  open,
  onClose,
  initialValues,
  onSubmit,
  isSubmitting,
  focusField,
}) => {
  const [formValues, setFormValues] = useState(defaultValues);

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const alternateRef = useRef(null);
  const dobRef = useRef(null);
  const addressRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFormValues({ ...defaultValues, ...initialValues });
    }
  }, [initialValues, open]);

  const focusTarget = useMemo(() => {
    switch (focusField) {
      case "email":
        return emailRef;
      case "phone":
        return phoneRef;
      case "alternatePhone":
        return alternateRef;
      case "dob":
        return dobRef;
      case "address":
        return addressRef;
      default:
        return null;
    }
  }, [focusField]);

  useEffect(() => {
    if (open && focusTarget?.current) {
      const timeout = setTimeout(() => focusTarget.current?.focus(), 100);
      return () => clearTimeout(timeout);
    }
  }, [open, focusTarget]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const dobSummary = useMemo(() => {
    if (!formValues.dob) return null;
    const dobDate = dayjs(formValues.dob);
    if (!dobDate.isValid()) return null;

    const today = dayjs();
    const ageYears = today.diff(dobDate, "year");
    const nextBirthday = dobDate.add(ageYears + 1, "year");
    const daysUntilBirthday = nextBirthday
      .startOf("day")
      .diff(today.startOf("day"), "day");

    const ageLabel =
      ageYears > 0 ? `${ageYears} year${ageYears > 1 ? "s" : ""}` : null;

    return {
      ageLabel,
      daysUntilBirthday,
      birthdayToday: daysUntilBirthday === 0,
    };
  }, [formValues.dob]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(formValues);
  };

  return (
    <AquaResponsiveDialog open={open} close={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Update your contact details
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Keep your profile up to date so we can reach you for deliveries,
            maintenance, and service reminders.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
     
  
          
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              ref={emailRef}
              value={formValues.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              ref={phoneRef}
              value={formValues.phone}
              onChange={handleChange}
              maxLength={10}
              placeholder="Primary contact number"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="alternatePhone"
              className="block text-sm font-medium text-gray-700"
            >
              Alternate Phone
            </label>
            <input
              id="alternatePhone"
              name="alternatePhone"
              type="tel"
              ref={alternateRef}
              value={formValues.alternatePhone}
              onChange={handleChange}
              maxLength={10}
              placeholder="Optional backup number"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="dob"
              className="block text-sm font-medium text-gray-700"
            >
              Date of Birth
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              ref={dobRef}
              value={formValues.dob}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {dobSummary && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50/80 px-3 py-2 text-xs text-indigo-700">
                {dobSummary.ageLabel && (
                  <span className="font-semibold">
                    {dobSummary.ageLabel} young
                  </span>
                )}
                {dobSummary.birthdayToday ? (
                  <span className="inline-flex items-center rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                    Happy Birthday! 🎉
                  </span>
                ) : (
                  <span className="text-indigo-600">
                    {dobSummary.daysUntilBirthday} day
                    {dobSummary.daysUntilBirthday !== 1 ? "s" : ""} until your
                    next birthday
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </AquaResponsiveDialog>
  );
};

export default ProfileDetailsDialog;
