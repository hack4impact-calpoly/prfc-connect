"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import type { ApiReferral } from "@/schema/api";
import { filterOperators, type FilterOperator } from "./table-filters";
import { type Density, columnDisplayLabels, filterableColumns } from "./data-table-types";

interface DataTableMobileDrawerProps {
  table: Table<ApiReferral>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  density: Density;
  onDensityChange: (density: Density) => void;
  filterColumn: string;
  filterOperator: FilterOperator;
  filterValue: string;
  onFilterColumnChange: (column: string) => void;
  onFilterOperatorChange: (operator: FilterOperator) => void;
  onFilterValueChange: (value: string) => void;
  onClearFilter: () => void;
  onResetColumns: () => void;
  isFiltered: boolean;
  hiddenColumnCount: number;
}

export function DataTableMobileDrawer({
  table,
  open,
  onOpenChange,
  density,
  onDensityChange,
  filterColumn,
  filterOperator,
  filterValue,
  onFilterColumnChange,
  onFilterOperatorChange,
  onFilterValueChange,
  onClearFilter,
  onResetColumns,
  isFiltered,
  hiddenColumnCount,
}: DataTableMobileDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative flex md:hidden min-h-[44px] min-w-[44px] shrink-0"
          aria-label="Open filters and options"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {(isFiltered || hiddenColumnCount > 0) && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-prfc-red" />
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Filters & Display Options</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-6 px-4 pb-4 overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-prfc-red">
                Visible Columns
                {hiddenColumnCount > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">({hiddenColumnCount} hidden)</span>
                )}
              </h3>
              <button type="button" onClick={onResetColumns} className="text-sm text-prfc-red hover:underline">
                Reset to defaults
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {table
                .getAllColumns()
                .filter((column) => column.id !== "select" && column.getCanHide())
                .map((column) => (
                  <label key={column.id} className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                    <Checkbox
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    />
                    <span>{columnDisplayLabels[column.id] || column.id}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-prfc-red">Filters</h3>
            <div className="space-y-2">
              <Select value={filterColumn} onValueChange={onFilterColumnChange}>
                <SelectTrigger className="w-full min-h-[44px]">
                  <SelectValue placeholder="Column" />
                </SelectTrigger>
                <SelectContent>
                  {filterableColumns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterOperator}
                onValueChange={(selectedOperator) => onFilterOperatorChange(selectedOperator as FilterOperator)}
              >
                <SelectTrigger className="w-full min-h-[44px]">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {filterOperators.map((operator) => (
                    <SelectItem key={operator.value} value={operator.value}>
                      {operator.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="Filter value"
                value={filterValue}
                onChange={(event) => onFilterValueChange(event.target.value)}
                className="w-full min-h-[44px]"
              />
              {isFiltered && (
                <Button variant="outline" onClick={onClearFilter} className="w-full min-h-[44px]">
                  Clear Filter
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-prfc-red">Table Density</h3>
            <div className="flex flex-col gap-2">
              {(["compact", "standard", "comfortable"] as Density[]).map((densityOption) => (
                <label
                  key={densityOption}
                  className={cn(
                    "flex items-center gap-3 min-h-[44px] px-3 rounded-lg cursor-pointer",
                    density === densityOption ? "bg-gray-100" : "hover:bg-gray-50",
                  )}
                >
                  <input
                    type="radio"
                    name="density"
                    checked={density === densityOption}
                    onChange={() => onDensityChange(densityOption)}
                    className="h-4 w-4"
                  />
                  <span className="capitalize">{densityOption}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full min-h-[44px]">
              Done
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
