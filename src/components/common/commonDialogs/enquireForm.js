import { useMemo, useState } from "react";
import AquaResponsiveDialog from "@/components/reusables/dialog";
import LeadIntakeService from "@/services/leadIntake";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  locality: "",
  pincode: "",
  water_problem: "",
};

const AquaEnquireForm = ({
  open,
  close,
  product = null,
  source = "website",
  title = "Ask a water expert",
  onSubmitted,
}) => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState({ type: "", message: "" });

  const productLabel = useMemo(
    () => product?.title || product?.name || "",
    [product],
  );

  const submit = async (event) => {
    event.preventDefault();
    setState({ type: "", message: "" });

    if (!form.name.trim() || !form.phone.trim()) {
      setState({
        type: "error",
        message: "Please enter your name and phone number.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const page =
        typeof window === "undefined"
          ? {}
          : {
              page_url: window.location.href,
              page_path: window.location.pathname,
              referrer: document.referrer || "",
            };

      const common = {
        ...form,
        source,
        ...page,
      };

      if (product) {
        await LeadIntakeService.submitProductConsultation({
          ...common,
          product_id: product?._id || product?.id,
          product_slug: product?.slug || product?.seoSlug,
          product_url: page.page_url,
          consultation_type: "product_suitability",
          message:
            form.water_problem ||
            `Customer wants to know if ${productLabel || "this product"} is suitable for their water.`,
        });
      } else {
        await LeadIntakeService.submitEnquiry({
          ...common,
          message: form.water_problem,
          form: "reusable_enquiry",
        });
      }

      setState({
        type: "success",
        message:
          "Thanks — your request has been sent to Aquakart. Our team can follow up with you shortly.",
      });
      setForm(initialForm);
      onSubmitted?.();
    } catch (error) {
      setState({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "We could not send your request. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AquaResponsiveDialog open={open} close={close} title={title}>
      <div className="pr-8">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
          Aquakart expert help
        </span>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
          {productLabel ? "Is this right for your water?" : title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {productLabel
            ? `Tell us a little about your water and we’ll check ${productLabel} for your use case.`
            : "Share your water problem and contact details. We’ll route it directly into our CRM."}
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            placeholder="Name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            required
          />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            placeholder="Phone"
            inputMode="tel"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            required
          />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            placeholder="Email (optional)"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
          />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            placeholder="Locality"
            value={form.locality}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                locality: event.target.value,
              }))
            }
          />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:col-span-2"
            placeholder="PIN code"
            value={form.pincode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                pincode: event.target.value,
              }))
            }
          />
        </div>

        <textarea
          className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          placeholder="Describe your water problem, hardness, borewell/tanker source, or what you want help choosing."
          value={form.water_problem}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              water_problem: event.target.value,
            }))
          }
        />

        {state.message && (
          <div
            className={
              state.type === "success"
                ? "rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
                : "rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            }
          >
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Request expert recommendation"}
        </button>

        <p className="text-center text-[11px] leading-5 text-slate-400">
          Your request is used only to respond to this enquiry.
        </p>
      </form>
    </AquaResponsiveDialog>
  );
};

export default AquaEnquireForm;
