"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApiReferral } from "@/schema/api";

interface DataTablePaginationProps {
  table: Table<ApiReferral>;
}

export function DataTablePagination({ table }: DataTablePaginationProps) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-sm text-gray-600">Rows per page:</span>
      <Select value={`${pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
        <SelectTrigger className="w-16 h-8" aria-label="Rows per page">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[5, 10, 20, 100].map((size) => (
            <SelectItem key={size} value={`${size}`}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-sm text-gray-600 mx-2">
        {totalRows === 0 ? "0-0 of 0" : `${startRow}-${endRow} of ${totalRows}`}
      </span>

      <button
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        className="p-1 text-black/55 disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        className="p-1 text-black/55 disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
