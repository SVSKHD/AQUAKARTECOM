import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const DASHBOARD_PAGE_SIZE = 10;

export const useDashboardPagination = (items = []) => {
  const [page, setPage] = useState(1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / DASHBOARD_PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * DASHBOARD_PAGE_SIZE;
    return items.slice(start, start + DASHBOARD_PAGE_SIZE);
  }, [items, page]);

  return { page, setPage, pageItems, totalItems, totalPages };
};

const DashboardPagination = ({ page, setPage, totalItems, totalPages }) => {
  if (totalItems <= DASHBOARD_PAGE_SIZE) return null;

  const start = (page - 1) * DASHBOARD_PAGE_SIZE + 1;
  const end = Math.min(page * DASHBOARD_PAGE_SIZE, totalItems);
  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (pageNumber) =>
      pageNumber === 1 ||
      pageNumber === totalPages ||
      Math.abs(pageNumber - page) <= 1,
  );

  return (
    <nav
      className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <p className="text-xs font-medium text-slate-500">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        {visiblePages.map((pageNumber, index) => {
          const previous = visiblePages[index - 1];
          return (
            <span key={pageNumber} className="contents">
              {previous && pageNumber - previous > 1 && (
                <span className="px-1 text-slate-400">…</span>
              )}
              <button
                type="button"
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === page ? "page" : undefined}
                className={`h-9 min-w-9 rounded-xl px-2 text-xs font-bold transition ${
                  pageNumber === page
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                {pageNumber}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setPage((current) => Math.min(totalPages, current + 1))
          }
          disabled={page === totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};

export default DashboardPagination;
