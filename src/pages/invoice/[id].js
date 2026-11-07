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
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState({
    invoice: null,
    statusCode: 0,
    loading: true,
    catalogue: null,
  });

  // Each new request (route ready, id change or access refresh) starts in the
  // loading state, or 404s without an id; adjusted during render.
  const routeId = router.isReady ? normalizeRouteId(router.query.id) : null;
  const [requestFor, setRequestFor] = useState(null);
  if (
    router.isReady &&
    (!requestFor ||
      requestFor.routeId !== routeId ||
      requestFor.refreshKey !== refreshKey)
  ) {
    setRequestFor({ routeId, refreshKey });
    if (!routeId) {
      setState({ invoice: null, statusCode: 404, loading: false });
    } else {
      setState((current) => ({ ...current, loading: true }));
    }
  }

  useEffect(() => {
    if (!router.isReady) return undefined;

    const id = routeId;
    if (!id) return undefined;

    const controller = new AbortController();

    const loadInvoice = async () => {
      try {
        const payload = await InvoiceServiceOperations.getInvoiceById(
          id,
          controller.signal,
        );
        const invoice = mapInvoiceFromApi(payload);

        if (!controller.signal.aborted) {
          setState({
            invoice,
            statusCode: invoice ? 200 : 502,
            loading: false,
          });
        }

        if (invoice) {
          const catalogue = await fetchProductCatalogue(controller.signal);
          if (!controller.signal.aborted) {
            // The catalogue also feeds the receipt's "other products".
            setState({
              invoice: enrichInvoiceProducts(invoice, catalogue),
              statusCode: 200,
              loading: false,
              catalogue,
            });
          }
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
  }, [refreshKey, router.isReady, routeId]);

  if (state.loading) return null;
  return (
    <InvoicePage
      invoice={state.invoice}
      catalogue={state.catalogue}
      statusCode={state.statusCode}
      onAccessGranted={() => setRefreshKey((current) => current + 1)}
    />
  );
};

export default PublicInvoiceRoute;
