// app/holidays/page.tsx
"use client";

import { useState, useEffect } from "react";
import HolidayForm from "../../components/holidays/HolidayForm";
import HolidayList from "../../components/holidays/HolidayList";
import HolidayFilterPanel from "../../components/holidays/HolidayFilterPanel";
import type { Holiday, HolidayFilters } from "../../types";

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | undefined>();
  const [filters, setFilters] = useState<HolidayFilters>({});
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const searchParams = new URLSearchParams();
      if (filters.type) searchParams.append("type", filters.type);
      if (filters.startDate)
        searchParams.append("startDate", filters.startDate);
      if (filters.endDate) searchParams.append("endDate", filters.endDate);
      if (filters.year) searchParams.append("year", filters.year.toString());

      const response = await fetch(`/api/holidays?${searchParams.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setHolidays(result.holidays || []);
      } else {
        setError(result.message || "Failed to fetch holidays");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [filters]);

  const handleAddNew = () => {
    setEditingHoliday(undefined);
    setShowForm(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingHoliday(undefined);
    fetchHolidays();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingHoliday(undefined);
  };

  const handleFiltersChange = (newFilters: HolidayFilters) => {
    setFilters(newFilters);
  };

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <HolidayForm
          holiday={editingHoliday}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Holiday Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage company holidays for office and field operations
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Holiday
        </button>
      </div>

      {/* Filters */}
      <HolidayFilterPanel
        onFiltersChange={handleFiltersChange}
        currentFilters={filters}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading holidays...</p>
        </div>
      )}

      {/* Holiday List */}
      {!loading && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {holidays.length} holiday{holidays.length !== 1 ? "s" : ""}
          </div>
          <HolidayList
            holidays={holidays}
            onEdit={handleEdit}
            onRefresh={fetchHolidays}
          />
        </>
      )}

      {/* Statistics */}
      {!loading && holidays.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Office Holidays
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {
                holidays.filter((h) => h.type === "office" || h.type === "both")
                  .length
              }
            </p>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              Field Holidays
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              {
                holidays.filter((h) => h.type === "field" || h.type === "both")
                  .length
              }
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Total Holidays
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {holidays.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
