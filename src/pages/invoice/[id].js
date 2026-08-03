import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import InvoicePage from "@/pageComponents/invoice/InvoicePage";
import InvoiceServiceOperations from "@/services/invoice";
import { enrichInvoiceProducts } from "@/utils/invoice/matchInvoiceProducts";
import { mapInvoiceFromApi } from "@/utils/invoice/normalizeInvoice";

const CATALOGUE_GRACE_MS = 750;

const normalizeRouteId = (value) => {
  const id = Array.isArray(value) ? value[0] : value;
  if (typeof id !== "string") return "";

  const normalized = id.trim();
  if (!normalized || normalized.length > 160) return "";
  return normalized;
};

const fetchProductCatalogue = async (signal) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    CATALOGUE_GRACE_MS,
  );
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });

  try {
    const response = await fetch("/api/all-products?query=ecom", {
      cache: "no-store",
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      signal: controller.signal,
    });
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
};

const PublicInvoiceRoute = () => {
  const router = useRouter();
  const [state, setState] = useState({
    invoice: null,
    statusCode: 0,
    loading: true,
  });

  useEffect(() => {
    if (!router.isReady) return undefined;

    const id = normalizeRouteId(router.query.id);
    if (!id) {
      setState({ invoice: null, statusCode: 404, loading: false });
      return undefined;
    }

    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true }));

    const loadInvoice = async () => {
      try {
        const cataloguePromise = fetchProductCatalogue(controller.signal);
        const payload = await InvoiceServiceOperations.getInvoiceById(
          id,
          controller.signal,
        );
        const invoice = enrichInvoiceProducts(
          mapInvoiceFromApi(payload),
          await cataloguePromise,
        );

        if (!controller.signal.aborted) {
          setState({
            invoice,
            statusCode: invoice ? 200 : 502,
            loading: false,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            invoice: null,
            statusCode: error?.response?.status || 502,
            loading: false,
          });
        }
      }
    };

    void loadInvoice();
    return () => controller.abort();
  }, [router.isReady, router.query.id]);

  if (state.loading) return null;
  return <InvoicePage invoice={state.invoice} statusCode={state.statusCode} />;
};

export default PublicInvoiceRoute;
