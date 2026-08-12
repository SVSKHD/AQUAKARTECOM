import { useEffect, useState } from "react";

import { getManagedSeo } from "@/services/seo";

export default function useManagedSeo(pageKey, initialValue = null) {
  const [seo, setSeo] = useState(initialValue);

  useEffect(() => {
    setSeo(initialValue);
    if (!pageKey || initialValue) return undefined;

    const controller = new AbortController();
    getManagedSeo(pageKey, { signal: controller.signal })
      .then((value) => value && setSeo(value))
      .catch(() => undefined);

    return () => controller.abort();
  }, [initialValue, pageKey]);

  return seo;
}
