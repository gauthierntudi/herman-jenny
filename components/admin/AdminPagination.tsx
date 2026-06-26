"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

export const PAGE_SIZES = [25, 50, 100] as const;

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

type Props = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
  totalItems: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export default function AdminPagination({
  currentPage,
  totalPages,
  pageSize,
  rangeStart,
  rangeEnd,
  totalItems,
  itemLabel = "invité",
  onPageChange,
  onPageSizeChange,
}: Props) {
  const pages = pageNumbers(currentPage, totalPages);
  const plural = totalItems > 1 ? "s" : "";

  return (
    <div className="admin-pagination">
      <div className="admin-pagination-info">
        <span>
          {rangeStart}–{rangeEnd} sur {totalItems} {itemLabel}
          {plural}
        </span>
        <label className="admin-pagination-size">
          <span>Par page</span>
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-page-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Page précédente"
        >
          <Icon icon={ChevronLeft} size={16} />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="admin-page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`admin-page-btn${p === currentPage ? " active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="admin-page-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Page suivante"
        >
          <Icon icon={ChevronRight} size={16} />
        </button>
      </div>
    </div>
  );
}
