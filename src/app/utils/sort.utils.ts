import { SortDirection } from '../directives/table-sort.directive';
import { SelectOption } from "@/app/models/types";

export function sortData<T>(
  data: T[],
  column: string,
  direction: SortDirection,
  accessor?: (item: T, column: string) => any
): T[] {
  if (!column || !direction) return data;

  return [...data].sort((a, b) => {
    const aValue = accessor ? accessor(a, column) : getNestedProperty(a, column);
    const bValue = accessor ? accessor(b, column) : getNestedProperty(b, column);

    const comparison = compareValues(aValue, bValue);
    return direction === 'asc' ? comparison : -comparison;
  });
}

function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function compareValues(a: any, b: any): number {
  // Handle null/undefined
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Handle strings (case-insensitive)
  const aStr = String(a).toLowerCase();
  const bStr = String(b).toLowerCase();

  return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
}


export function findSmallestMissingNumber(arr: number[], start: number = 0): number {
  const set = new Set(arr);
  let num = start;

  while (set.has(num)) {
    num++;
  }

  return num;
}

export function createSelect(input: string[],selected:string[]): SelectOption[] {
  return input.map((item) => { return { label: item, value: item, isSelected: selected.includes(item) } });
}