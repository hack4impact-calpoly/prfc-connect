import type { Row, FilterFn } from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import type { ApiReferral } from "@/schema/api";

export type FilterOperator =
  | "contains"
  | "doesNotContain"
  | "equals"
  | "doesNotEqual"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty";

export interface ColumnFilterValue {
  text: string;
  operator: FilterOperator;
}

const filterOperations: Record<FilterOperator, (cellValue: string, filterText: string) => boolean> = {
  contains: (cellValue, filterText) => cellValue.includes(filterText),
  doesNotContain: (cellValue, filterText) => !cellValue.includes(filterText),
  equals: (cellValue, filterText) => cellValue === filterText,
  doesNotEqual: (cellValue, filterText) => cellValue !== filterText,
  startsWith: (cellValue, filterText) => cellValue.startsWith(filterText),
  endsWith: (cellValue, filterText) => cellValue.endsWith(filterText),
  isEmpty: (cellValue) => cellValue === "",
  isNotEmpty: (cellValue) => cellValue !== "",
};

export const operatorFilter: FilterFn<ApiReferral> = (
  row: Row<ApiReferral>,
  columnId: string,
  filterValue: ColumnFilterValue,
): boolean => {
  const cell = String(row.getValue(columnId) ?? "").toLowerCase();
  const text = filterValue.text.toLowerCase();
  return filterOperations[filterValue.operator](cell, text);
};

operatorFilter.autoRemove = (value: ColumnFilterValue) => !value?.text || value.text.trim() === "";

export const fuzzyFilter: FilterFn<ApiReferral> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(String(row.getValue(columnId) ?? ""), value as string);
  addMeta({ itemRank });
  return itemRank.passed;
};

fuzzyFilter.autoRemove = (value: string) => !value || value.trim() === "";

export const filterOperators: { value: FilterOperator; label: string }[] = [
  { value: "contains", label: "contains" },
  { value: "doesNotContain", label: "does not contain" },
  { value: "equals", label: "equals" },
  { value: "doesNotEqual", label: "does not equal" },
  { value: "startsWith", label: "starts with" },
  { value: "endsWith", label: "ends with" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
];
