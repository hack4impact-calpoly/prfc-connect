"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filterOperators, type FilterOperator } from "./table-filters";
import { filterableColumns } from "./data-table-types";

interface DataTableFilterPanelProps {
  visible: boolean;
  filterColumn: string;
  filterOperator: FilterOperator;
  filterValue: string;
  onColumnChange: (column: string) => void;
  onOperatorChange: (operator: FilterOperator) => void;
  onValueChange: (value: string) => void;
  onClear: () => void;
}

export function DataTableFilterPanel({
  visible,
  filterColumn,
  filterOperator,
  filterValue,
  onColumnChange,
  onOperatorChange,
  onValueChange,
  onClear,
}: DataTableFilterPanelProps) {
  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
      <button type="button" onClick={onClear} className="text-gray-500 hover:text-gray-700" aria-label="Clear filter">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>

      <span className="text-sm text-gray-600">Columns</span>
      <Select value={filterColumn} onValueChange={onColumnChange}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {filterableColumns.map((filterColumn) => (
            <SelectItem key={filterColumn.id} value={filterColumn.id}>
              {filterColumn.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-sm text-gray-600">Operator</span>
      <Select
        value={filterOperator}
        onValueChange={(selectedOperator) => onOperatorChange(selectedOperator as FilterOperator)}
      >
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {filterOperators.map((operator) => (
            <SelectItem key={operator.value} value={operator.value}>
              {operator.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-sm text-prfc-blue">Value</span>
      <Input
        type="text"
        placeholder="Filter value"
        value={filterValue}
        onChange={(event) => onValueChange(event.target.value)}
        className="w-36 h-8 text-sm"
      />
    </div>
  );
}
