import { useEffect, useState } from "react";
import { getRecentPurchases } from "@/services/storefront";
import { loadDemandFeed } from "@/utils/demandFeed";

// The server caches the feed for 60s: reuse an answer (or the request in
// flight) for that long, across components and Pages Router navigations.
const TTL = 60000;
const cache = new Map();

const load = (params) => {
  const key = JSON.stringify([params.area || "", params.limit, params.days]);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.promise;
  const promise = loadDemandFeed(getRecentPurchases, params);
  cache.set(key, { at: Date.now(), promise });
  return promise;
};

// Client-only (after mount), so cached SSR pages stay the same for everyone.
// status: "loading" | "ready" | "empty" ("empty" also covers a failed request).
/**
 * @param {{ area?: string | null, limit?: number, days?: number, enabled?: boolean }} [options]
 * @returns {{ status: "loading" | "ready" | "empty", result: { feed: any, nearby: boolean } | null }}
 */
export function useDemandFeed({
  area = null,
  limit = 10,
  days = 30,
  enabled = true,
} = {}) {
  const [state, setState] = useState({ status: "loading", result: null });
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    load({ area, limit, days }).then((result) => {
      if (!alive) return;
      const has =
        result?.feed?.recent?.length || result?.feed?.trending?.length;
      setState({
        status: has ? "ready" : "empty",
        result: has ? result : null,
      });
    });
    return () => {
      alive = false;
    };
  }, [area, limit, days, enabled]);
  return state;
}

export const __resetDemandCache = () => cache.clear();
