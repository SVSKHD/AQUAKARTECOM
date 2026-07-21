import InvoicePage from "@/pageComponents/invoice/InvoicePage";
import { enrichInvoiceProducts } from "@/utils/invoice/matchInvoiceProducts";
import { mapInvoiceFromApi } from "@/utils/invoice/normalizeInvoice";

const FETCH_TIMEOUT_MS = 10_000;

const normalizeRouteId = (value) => {
  const id = Array.isArray(value) ? value[0] : value;
  if (typeof id !== "string") return "";

  const normalized = id.trim();
  if (!normalized || normalized.length > 160) return "";
  return normalized;
};

const fetchProductCatalogue = async (apiBase, signal) => {
  try {
    const response = await fetch(
      `${apiBase.replace(/\/$/, "")}/all-products?query=ecom`,
      {
        headers: { Accept: "application/json" },
        signal,
      },
    );

    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
};

export const getServerSideProps = async ({ params, res }) => {
  res.setHeader(
    "Cache-Control",
    "private, no-store, no-cache, max-age=0, must-revalidate",
  );
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");

  const id = normalizeRouteId(params?.id);
  if (!id) {
    return { props: { invoice: null, statusCode: 404 } };
  }

  const apiBase =
    process.env.INVOICE_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) {
    return { props: { invoice: null, statusCode: 503 } };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const catalogueApiBase = process.env.NEXT_PUBLIC_API_URL || apiBase;
    const cataloguePromise = fetchProductCatalogue(
      catalogueApiBase,
      controller.signal,
    );
    const response = await fetch(
      `${apiBase.replace(/\/$/, "")}/crm/invoice/${encodeURIComponent(id)}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );

    if (response.status === 404) {
      return { props: { invoice: null, statusCode: 404 } };
    }

    if (!response.ok) {
      return { props: { invoice: null, statusCode: 502 } };
    }

    const payload = await response.json();
    const cataloguePayload = await cataloguePromise;
    const invoice = enrichInvoiceProducts(
      mapInvoiceFromApi(payload),
      cataloguePayload,
    );

    if (!invoice) {
      return { props: { invoice: null, statusCode: 502 } };
    }

    return { props: { invoice, statusCode: 200 } };
  } catch {
    return { props: { invoice: null, statusCode: 502 } };
  } finally {
    clearTimeout(timeout);
  }
};

export default InvoicePage;
