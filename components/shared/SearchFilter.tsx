"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  label: string;
  value: string;
}

interface SearchFilterProps {
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    key: string;
    options: FilterOption[];
  }[];
  onFilterChange?: (key: string, value: string) => void;
  activeFilters?: Record<string, string>;
  sortOptions?: FilterOption[];
  onSortChange?: (value: string) => void;
  activeSort?: string;
}

export function SearchFilter({
  searchPlaceholder = "Search...",
  onSearchChange,
  filters = [],
  onFilterChange,
  activeFilters = {},
  sortOptions = [],
  onSortChange,
  activeSort,
}: SearchFilterProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearch("");
    onSearchChange("");
  };

  const activeFilterCount = Object.values(activeFilters).filter(
    (v) => v && v !== "all"
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle & Sort */}
        <div className="flex gap-2">
          {filters.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative dark:text-white"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2 dark:text-white" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}

          {sortOptions.length > 0 && (
            <Select value={activeSort} onValueChange={onSortChange}>
              <SelectTrigger className="w-[160px] dark:text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Filter Dropdowns */}
      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-300">
                {filter.label}
              </label>
              <Select
                value={activeFilters[filter.key] || "all"}
                onValueChange={(value) => onFilterChange?.(filter.key, value)}
              >
                <SelectTrigger className="w-[140px] dark:text-white">
                  <SelectValue placeholder={`All ${filter.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                filters.forEach((f) => onFilterChange?.(f.key, "all"));
              }}
              className="text-gray-500 dark:text-gray-400 font-medium"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper hook for filtering and sorting
export function useSearchFilter<T>(
  items: T[],
  searchFields: (keyof T)[],
  search: string,
  filters: Record<string, string>,
  filterFn?: (item: T, filters: Record<string, string>) => boolean,
  sortKey?: string,
  sortFn?: (a: T, b: T, sortKey: string) => number
): T[] {
  return useMemo(() => {
    let result = [...items];

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchLower);
          }
          return false;
        })
      );
    }

    // Apply filters
    if (filterFn) {
      result = result.filter((item) => filterFn(item, filters));
    }

    // Apply sort
    if (sortKey && sortFn) {
      result.sort((a, b) => sortFn(a, b, sortKey));
    }

    return result;
  }, [items, searchFields, search, filters, filterFn, sortKey, sortFn]);
}
