import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import InvoicePage from "@/pageComponents/invoice/InvoicePage";
import { mapInvoiceFromApi } from "@/utils/invoice/normalizeInvoice";

const normalizeRouteId = (value) => {
  const id = Array.isArray(value) ? value[0] : value;
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id.trim())
    ? id.trim()
    : "";
};

const PublicQuotationRoute = () => {
  const router = useRouter();
  const [state, setState] = useState({
    document: null,
    statusCode: 0,
    loading: true,
  });

  // A route without a valid id 404s straight away (adjusted during render).
  const routeId = router.isReady ? normalizeRouteId(router.query.id) : null;
  const [checkedFor, setCheckedFor] = useState(null);
  if (router.isReady && (!checkedFor || checkedFor.routeId !== routeId)) {
    setCheckedFor({ routeId });
    if (!routeId) setState({ document: null, statusCode: 404, loading: false });
  }

  useEffect(() => {
    if (!router.isReady) return undefined;
    const id = routeId;
    if (!id) return undefined;

    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(
          `/api/crm/quotations/public/${encodeURIComponent(id)}`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok)
          throw Object.assign(new Error("Quotation unavailable"), {
            status: response.status,
          });
        const quotation = payload?.data ?? payload;
        const document = mapInvoiceFromApi({
          ...quotation,
          invoiceNo: quotation?.quotationNo,
          total: quotation?.totalAmount,
          quotation: true,
          paidStatus:
            quotation?.payment?.status || quotation?.status || "unpaid",
          paymentType: quotation?.payment?.method || "quotation",
        });
        if (!controller.signal.aborted)
          setState({
            document,
            statusCode: document ? 200 : 502,
            loading: false,
          });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            document: null,
            statusCode: error?.status || 502,
            loading: false,
          });
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [router.isReady, routeId]);

  if (state.loading) return null;
  return <InvoicePage invoice={state.document} statusCode={state.statusCode} />;
};

export default PublicQuotationRoute;
