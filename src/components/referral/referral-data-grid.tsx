"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ApiReferral } from "@/schema/api";
import { operatorFilter, fuzzyFilter, type FilterOperator, type ColumnFilterValue } from "./table-filters";
import { toast } from "sonner";
import { useReferrals } from "@/components/referral/use-referrals";
import { useIsMobile } from "@/hooks/use-mobile";

import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableFilterPanel } from "./data-table-filter-panel";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableMobileDrawer } from "./data-table-mobile-drawer";
import { type Density, densityClasses } from "./data-table-types";

const STORAGE_KEY = "referral-table-columns";

export function ReferralDataGrid() {
  const { data: referrals, error, isLoading, isFetching, toggleRedeemed } = useReferrals();
  const isMobile = useIsMobile();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // null = CSS handles responsive visibility, object = user overrides
  const [userOverrides, setUserOverrides] = useState<VisibilityState | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [density, setDensity] = useState<Density>("standard");

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterColumn, setFilterColumn] = useState("createdAt");
  const [filterOperator, setFilterOperator] = useState<FilterOperator>("contains");
  const [filterValue, setFilterValue] = useState("");
  const [columnSearch, setColumnSearch] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUserOverrides(JSON.parse(stored));
      }
    } catch {
      // localStorage unavailable or corrupted
    }
  }, []);

  const hasCustomized = userOverrides !== null;

  const handleColumnVisibilityChange = useCallback(
    (updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => {
      setUserOverrides((prev) => {
        const next = typeof updater === "function" ? updater(prev ?? {}) : updater;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // localStorage full or unavailable
        }
        return next;
      });
    },
    [],
  );

  const resetColumnVisibility = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
    setUserOverrides(null);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load referrals");
    }
  }, [error]);

  useEffect(() => {
    if (isMobile && showFilterPanel) {
      setShowFilterPanel(false);
    }
  }, [isMobile, showFilterPanel]);

  const formatDate = useCallback((date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  }, []);

  const columns: ColumnDef<ApiReferral>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => formatDate(row.getValue("createdAt")),
        filterFn: operatorFilter,
        meta: { className: "hidden md:table-cell", responsiveHidden: "md" },
      },
      {
        accessorKey: "memberName",
        header: "Member Name",
        enableHiding: false,
        filterFn: operatorFilter,
      },
      {
        accessorKey: "memberEmail",
        header: "Member Email",
        filterFn: operatorFilter,
        meta: { className: "hidden lg:table-cell", responsiveHidden: "lg" },
      },
      {
        accessorKey: "prospectName",
        header: "Prospect Name",
        enableHiding: false,
        filterFn: operatorFilter,
      },
      {
        accessorKey: "prospectEmail",
        header: "Prospect Email",
        filterFn: operatorFilter,
        meta: { className: "hidden lg:table-cell", responsiveHidden: "lg" },
      },
      {
        accessorKey: "referralCode",
        header: "Code",
        filterFn: operatorFilter,
        meta: { className: "hidden md:table-cell", responsiveHidden: "md" },
      },
      {
        accessorKey: "redeemed",
        header: () => <div className="text-center">Redeemed</div>,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Switch
              checked={row.getValue("redeemed")}
              onCheckedChange={() => toggleRedeemed(row.original.id, row.getValue("redeemed"))}
              aria-label="Toggle redeemed status"
            />
          </div>
        ),
      },
    ],
    [formatDate, toggleRedeemed],
  );

  const placeholderRows = useMemo(() => Array(10).fill({} as ApiReferral), []);
  const skeletonColumns: ColumnDef<ApiReferral>[] = useMemo(
    () => columns.map((column) => ({ ...column, cell: () => <Skeleton className="h-4 w-full" /> })),
    [columns],
  );

  const tableRows = isLoading ? placeholderRows : referrals;
  const tableCols = isLoading ? skeletonColumns : columns;

  const table = useReactTable({
    data: tableRows,
    columns: tableCols,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility: userOverrides ?? {},
      rowSelection,
      globalFilter,
    },
  });

  const handleClearFilter = useCallback(() => {
    setFilterValue("");
    setColumnFilters([]);
    setShowFilterPanel(false);
  }, []);

  const hiddenColumnCount = table
    .getAllColumns()
    .filter((column) => column.getCanHide() && !column.getIsVisible()).length;
  const isFiltered = columnFilters.length > 0;

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const tableColumns = ["Date", "Member Name", "Member Email", "Prospect Name", "Prospect Email", "Code", "Redeemed"];
    const tableRows = table
      .getFilteredRowModel()
      .rows.map((row) => [
        formatDate(row.original.createdAt),
        row.original.memberName,
        row.original.memberEmail,
        row.original.prospectName,
        row.original.prospectEmail,
        row.original.referralCode,
        row.original.redeemed ? "Yes" : "No",
      ]);

    doc.setFontSize(16);
    doc.text("Paso Food Co-op Referral Database", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [131, 16, 2] },
      alternateRowStyles: { fillColor: [237, 221, 204] },
      margin: { left: 10, right: 10 },
    });

    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  }, [table, formatDate]);

  const handleFilterValueChange = useCallback(
    (value: string) => {
      setFilterValue(value);
      if (value.trim()) {
        setColumnFilters([
          {
            id: filterColumn,
            value: { text: value, operator: filterOperator } as ColumnFilterValue,
          },
        ]);
      } else {
        setColumnFilters([]);
      }
    },
    [filterColumn, filterOperator],
  );

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search"
            className="pl-9"
            aria-label="Search referrals"
          />
        </div>
        <div className="flex items-center gap-2">
          <DataTableMobileDrawer
            table={table}
            open={mobileDrawerOpen}
            onOpenChange={setMobileDrawerOpen}
            density={density}
            onDensityChange={setDensity}
            filterColumn={filterColumn}
            filterOperator={filterOperator}
            filterValue={filterValue}
            onFilterColumnChange={setFilterColumn}
            onFilterOperatorChange={setFilterOperator}
            onFilterValueChange={handleFilterValueChange}
            onClearFilter={handleClearFilter}
            onResetColumns={resetColumnVisibility}
            isFiltered={isFiltered}
            hiddenColumnCount={hiddenColumnCount}
          />
        </div>

        <DataTableToolbar
          table={table}
          density={density}
          onDensityChange={setDensity}
          onToggleFilterPanel={() => setShowFilterPanel(!showFilterPanel)}
          columnSearch={columnSearch}
          onColumnSearchChange={setColumnSearch}
          onResetColumns={resetColumnVisibility}
          hasCustomized={hasCustomized}
        />

        <Button
          onClick={exportToPDF}
          className="ml-auto w-full md:w-auto bg-prfc-red px-4 py-2 text-white hover:bg-prfc-red/90"
        >
          Export to PDF
        </Button>
      </div>

      <div
        role="region"
        aria-label="Referral data table"
        aria-busy={isFetching ? "true" : "false"}
        tabIndex={0}
        className={cn(
          "mt-6 overflow-x-auto rounded-xl border-2 border-prfc-border focus:outline-2 focus:outline-prfc-red transition-opacity",
          isFetching && !isLoading && "opacity-60",
        )}
      >
        <DataTableFilterPanel
          visible={showFilterPanel}
          filterColumn={filterColumn}
          filterOperator={filterOperator}
          filterValue={filterValue}
          onColumnChange={setFilterColumn}
          onOperatorChange={setFilterOperator}
          onValueChange={handleFilterValueChange}
          onClear={handleClearFilter}
        />
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-t-2 border-prfc-border bg-prfc-cream">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "font-bold text-prfc-red",
                      header.column.getCanSort() && "cursor-pointer underline select-none",
                      !hasCustomized && header.column.columnDef.meta?.className,
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: " ↑",
                      desc: " ↓",
                    }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(densityClasses[density], index % 2 === 0 ? "bg-white" : "bg-muted")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={!hasCustomized ? cell.column.columnDef.meta?.className : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableCols.length} className="h-24 text-center">
                  {isLoading ? "" : "No referrals found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}

export default ReferralDataGrid;
