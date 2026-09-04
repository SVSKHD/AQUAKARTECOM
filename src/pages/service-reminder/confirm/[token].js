import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.aquakart.co.in/v1";
const CUSTOMER_CARE_PHONE = "9278912345";
const CUSTOMER_CARE_TEL = "+919278912345";

const labels = {
  regeneration: "Regeneration reminder",
  "annual-service": "Annual service reminder",
  "warranty-expiry": "Warranty expiry reminder",
};

export default function ServiceReminderConfirmation() {
  const router = useRouter();
  const { token } = router.query;
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/service-reminders/confirm/${encodeURIComponent(token)}`)
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || "This reminder link is invalid.");
        setReminder(body.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const confirm = async status => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/service-reminders/confirm/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Could not save your response.");
      setReminder(current => ({ ...current, confirmationStatus: body.data.confirmationStatus }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyCustomerCareNumber = async () => {
    try {
      await navigator.clipboard.writeText(CUSTOMER_CARE_PHONE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      setError("Could not copy the customer care number. Please copy it manually.");
    }
  };

  return (
    <>
      <Head><title>Confirm service reminder | Aquakart</title></Head>
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <img src="/aqua-logo.png" alt="Aquakart" className="mb-7 h-12 w-auto" onError={event => { event.currentTarget.style.display = "none"; }} />
          {loading ? <p>Loading your reminder…</p> : error && !reminder ? <><h1 className="text-2xl font-bold">Reminder unavailable</h1><p className="mt-3 text-red-600">{error}</p></> : reminder && (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{labels[reminder.reminderType] || "Service reminder"}</p>
              <h1 className="mt-2 text-3xl font-bold">Please confirm your requirement</h1>
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="font-semibold">{reminder.productName}</div>
                <div className="mt-1 text-sm text-slate-600">Invoice {reminder.invoiceNo || "Aquakart invoice"}</div>
                <div className="mt-1 text-sm text-slate-600">Due: {new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(reminder.dueDate))}</div>
              </div>
              {reminder.confirmationStatus !== "unconfirmed" && <div className="mt-5 rounded-xl bg-green-50 p-4 text-green-800">Your current response: <strong>{reminder.confirmationStatus.replaceAll("-", " ")}</strong>. You can update it below.</div>}
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button disabled={saving} onClick={() => confirm("confirmed")} className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50">Confirm</button>
                <button disabled={saving} onClick={() => confirm("not-required")} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold disabled:opacity-50">Not required</button>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-semibold text-blue-900">Aquakart customer care</p>
                <p className="mt-1 text-sm text-slate-600">For assistance, contact our customer care team.</p>
                <p className="mt-3 text-xl font-bold tracking-wide text-slate-900">{CUSTOMER_CARE_PHONE}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={copyCustomerCareNumber} className="rounded-xl border border-blue-200 bg-white px-4 py-3 font-semibold text-blue-800 transition hover:bg-blue-100">
                    {copied ? "Copied" : "Copy number"}
                  </button>
                  <a href={`tel:${CUSTOMER_CARE_TEL}`} className="rounded-xl bg-blue-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-800">Call now</a>
                </div>
              </div>

              <Link href={`/invoice/${reminder.invoiceId}`} className="mt-6 inline-block text-sm font-semibold text-blue-700">View invoice →</Link>
            </>
          )}
        </div>
      </main>
    </>
  );
}
