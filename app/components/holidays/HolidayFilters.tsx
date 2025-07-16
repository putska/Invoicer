// components/holidays/HolidayFilters.tsx
"use client";

import { useState } from "react";
import type { HolidayType, HolidayFilters } from "../../types";

interface HolidayFiltersProps {
  onFiltersChange: (filters: HolidayFilters) => void;
  currentFilters: HolidayFilters;
}

export default function HolidayFilters({
  onFiltersChange,
  currentFilters,
}: HolidayFiltersProps) {
  const [filters, setFilters] = useState<HolidayFilters>(currentFilters);

  const handleFilterChange = (key: keyof HolidayFilters, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 2);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Filter Holidays
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="type-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Type
          </label>
          <select
            id="type-filter"
            value={filters.type || ""}
            onChange={(e) =>
              handleFilterChange("type", e.target.value as HolidayType)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="both">Both</option>
            <option value="office">Office</option>
            <option value="field">Field</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="year-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Year
          </label>
          <select
            id="year-filter"
            value={filters.year || ""}
            onChange={(e) =>
              handleFilterChange(
                "year",
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={filters.startDate || ""}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={filters.endDate || ""}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
