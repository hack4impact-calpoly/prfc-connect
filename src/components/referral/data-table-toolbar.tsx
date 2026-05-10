"use client";

import type { Table } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ApiReferral } from "@/schema/api";
import { type Density, columnDisplayLabels } from "./data-table-types";

interface DataTableToolbarProps {
  table: Table<ApiReferral>;
  density: Density;
  onDensityChange: (density: Density) => void;
  onToggleFilterPanel: () => void;
  columnSearch: string;
  onColumnSearchChange: (search: string) => void;
  onResetColumns: () => void;
  hasCustomized: boolean;
}

export function DataTableToolbar({
  table,
  density,
  onDensityChange,
  onToggleFilterPanel,
  columnSearch,
  onColumnSearchChange,
  onResetColumns,
  hasCustomized,
}: DataTableToolbarProps) {
  const allColumnsVisible = table
    .getAllColumns()
    .filter((column) => column.getCanHide())
    .every((column) => column.getIsVisible());

  const filteredColumns = table
    .getAllColumns()
    .filter((column) => column.id !== "select")
    .filter((column) => {
      const label = columnDisplayLabels[column.id] || column.id;
      return label.toLowerCase().includes(columnSearch.toLowerCase());
    });

  const handleShowHideAll = (show: boolean) => {
    table.getAllColumns().forEach((column) => {
      if (column.getCanHide()) {
        column.toggleVisibility(show);
      }
    });
  };

  const handleReset = () => {
    handleShowHideAll(true);
    onColumnSearchChange("");
  };

  return (
    <div className="hidden md:flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-1 text-sm text-prfc-red hover:opacity-80">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
            </svg>
            <span className="font-medium">COLUMNS</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="p-2">
            <div className="flex items-center border rounded px-2 py-1">
              <svg
                className="w-4 h-4 text-gray-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={columnSearch}
                onChange={(event) => onColumnSearchChange(event.target.value)}
                className="border-none outline-none text-sm w-full"
              />
            </div>
          </div>
          {filteredColumns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {columnDisplayLabels[column.id] || column.id}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <div className="flex items-center justify-between px-2 py-1.5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={allColumnsVisible} onCheckedChange={(checked) => handleShowHideAll(!!checked)} />
              Show/Hide All
            </label>
            <button type="button" onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600 uppercase">
              Reset
            </button>
          </div>
          {hasCustomized && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onResetColumns}>Reset to defaults</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={onToggleFilterPanel}
        className="flex items-center gap-1 text-sm text-prfc-red hover:opacity-80"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
        </svg>
        <span className="font-medium">FILTERS</span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-1 text-sm text-prfc-red hover:opacity-80">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 8h16V6H4v2zm0 5h16v-2H4v2zm0 5h16v-2H4v2z" />
            </svg>
            <span className="font-medium">DENSITY</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <button
            type="button"
            onClick={() => onDensityChange("compact")}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100",
              density === "compact" && "bg-gray-50",
            )}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 8h16V6H4v2zm0 4h16v-2H4v2zm0 4h16v-2H4v2zm0 4h16v-2H4v2z" />
            </svg>
            Compact
          </button>
          <button
            type="button"
            onClick={() => onDensityChange("standard")}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100",
              density === "standard" && "bg-gray-50",
            )}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 8h16V6H4v2zm0 5h16v-2H4v2zm0 5h16v-2H4v2z" />
            </svg>
            Standard
          </button>
          <button
            type="button"
            onClick={() => onDensityChange("comfortable")}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100",
              density === "comfortable" && "bg-gray-50",
            )}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 9h16V7H4v2zm0 6h16v-2H4v2z" />
            </svg>
            Comfortable
          </button>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
