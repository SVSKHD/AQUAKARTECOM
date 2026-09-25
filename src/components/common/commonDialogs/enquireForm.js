import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Droplets, Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import AquaResponsiveDialog from "@/components/reusables/dialog";
import LeadServiceOperations from "@/services/leads";

const SALES_WHATSAPP = "919014774667";

const emptyForm = () => ({
  name: "",
  phone: "",
  email: "",
  locality: "",
  pincode: "",
  water_problem: "",
});

const whatsappLink = ({ name, product, plannerData }) => {
  const capacity = plannerData?.required_capacity_liters;
  const productName =
    product?.title ||
    plannerData?.recommendations?.[0]?.title ||
    plannerData?.recommendations?.[0]?.name ||
    "";
  const lines = [
    `Hi Aquakart, I'm ${name || "interested in a water softener"}.`,
    productName ? `I want guidance for: ${productName}.` : "",
    capacity ? `Planner suggested about ${capacity} L capacity.` : "",
    "Please help me confirm the right option for my water.",
  ].filter(Boolean);
  return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
};

const AquaEnquireForm = ({
  open = false,
  close = () => undefined,
  title = "Get Aquakart guidance",
  source = "website",
  mode = "enquiry",
  product = null,
  plannerData = null,
  defaultMessage = "",
  onSuccess,
}) => {
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    setForm((current) => ({
      ...emptyForm(),
      name: current.name,
      phone: current.phone,
      email: current.email,
      water_problem: defaultMessage || "",
    }));
  }, [open, defaultMessage]);

  const productTitle = product?.title || product?.name || "";
  const helper = useMemo(() => {
    if (mode === "planner") {
      return "Share your contact details and we’ll keep your planner result with the sales team.";
    }
    if (mode === "product") {
      return `Tell us about your water and we’ll confirm whether ${productTitle || "this product"} is the right fit.`;
    }
    return "Tell us what you need. An Aquakart water-care expert can continue from this enquiry.";
  }, [mode, productTitle]);

  const submit = async (event) => {
    event?.preventDefault?.();

    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      toast.error("Please enter your phone number or email");
      return;
    }

    const common = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      locality: form.locality.trim(),
      pincode: form.pincode.trim(),
      water_problem: form.water_problem.trim(),
      message: form.water_problem.trim(),
      source,
    };

    setSubmitting(true);
    try {
      let response;
      if (mode === "planner") {
        response = await LeadServiceOperations.SubmitPlanner({
          ...common,
          answers: plannerData?.answers || {},
          required_capacity_liters: plannerData?.required_capacity_liters,
          recommendations: (plannerData?.recommendations || []).map((item) => ({
            _id: item?._id,
            product_id: item?._id || item?.product_id,
            slug: item?.slug || item?.seoSlug,
            url:
              typeof window !== "undefined" && (item?.slug || item?.seoSlug)
                ? `${window.location.origin}/product/${item.slug || item.seoSlug}`
                : "",
          })),
          qualification: {
            locality: form.locality.trim(),
            pincode: form.pincode.trim(),
            water_problem: form.water_problem.trim(),
          },
          planner_version: "web-v1",
        });
      } else if (mode === "product") {
        response = await LeadServiceOperations.SubmitProductConsultation({
          ...common,
          product_id: product?._id || product?.id,
          product_slug: product?.slug || product?.seoSlug,
          product_url:
            typeof window !== "undefined" ? window.location.href : "",
          consultation_type: "product_suitability",
          qualification: {
            locality: form.locality.trim(),
            pincode: form.pincode.trim(),
            water_problem: form.water_problem.trim(),
          },
        });
      } else {
        response = await LeadServiceOperations.SubmitEnquiry({
          ...common,
          form: "aquakart_enquiry",
          qualification: {
            locality: form.locality.trim(),
            pincode: form.pincode.trim(),
            water_problem: form.water_problem.trim(),
          },
        });
      }

      setSubmitted(true);
      toast.success("Enquiry sent to Aquakart");
      onSuccess?.(response?.data, form);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send your enquiry";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <AquaResponsiveDialog open={open} close={close} title={title}>
      <div className="pr-7">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
          <Droplets size={13} /> Aquakart water guidance
        </span>
        <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">
          {submitted ? "We have your details" : title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {submitted
            ? "Your enquiry is now in the Aquakart sales pipeline. You can also continue instantly on WhatsApp."
            : helper}
        </p>
      </div>

      {submitted ? (
        <div className="mt-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-sm font-bold text-emerald-950">
              Enquiry received successfully.
            </p>
          </div>
          <a
            href={whatsappLink({
              name: form.name,
              product,
              plannerData,
            })}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            <MessageCircle size={18} /> Continue on WhatsApp
          </a>
          <button
            type="button"
            onClick={close}
            className="mt-2 min-h-11 w-full rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Name *</span>
              <input
                value={form.name}
                onChange={update("name")}
                autoComplete="name"
                className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Phone</span>
              <input
                value={form.phone}
                onChange={update("phone")}
                inputMode="tel"
                autoComplete="tel"
                className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="10-digit mobile"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">
              Email <span className="font-medium text-slate-400">(optional)</span>
            </span>
            <input
              value={form.email}
              onChange={update("email")}
              type="email"
              autoComplete="email"
              className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="you@example.com"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Locality</span>
              <input
                value={form.locality}
                onChange={update("locality")}
                className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="Area / locality"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">PIN code</span>
              <input
                value={form.pincode}
                onChange={update("pincode")}
                inputMode="numeric"
                className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="5000xx"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">
              What is the water problem?
            </span>
            <textarea
              value={form.water_problem}
              onChange={update("water_problem")}
              rows={3}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="White scale, borewell water, whole-home requirement..."
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Send to Aquakart
              </>
            )}
          </button>

          <p className="text-center text-[10px] leading-5 text-slate-400">
            Your details are used to respond to this Aquakart enquiry.
          </p>
        </form>
      )}
    </AquaResponsiveDialog>
  );
};

export default AquaEnquireForm;
