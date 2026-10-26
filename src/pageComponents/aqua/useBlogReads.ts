"use client";

import { useEffect, useState } from "react";
import BlogServiceOperations from "@/services/blog";
import { toBlogReads, type BlogRead } from "./blogReads";

// One request per page visit, shared by the floating reads bar and the dock.
let pending: Promise<BlogRead[]> | null = null;
const load = () =>
  (pending ??= BlogServiceOperations.AllBlogs()
    .then((res: { data: unknown }) => toBlogReads(res.data, 8))
    .catch(() => {
      pending = null; // try again next mount
      return [];
    }));

export function useBlogReads() {
  const [reads, setReads] = useState<BlogRead[]>([]);
  useEffect(() => {
    let alive = true;
    void load().then((list) => alive && setReads(list));
    return () => {
      alive = false;
    };
  }, []);
  return reads;
}
