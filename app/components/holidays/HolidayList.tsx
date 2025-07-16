// components/holidays/HolidayList.tsx
"use client";

import { useState } from "react";
import type { Holiday, HolidayType } from "../../types";

interface HolidayListProps {
  holidays: Holiday[];
  onEdit: (holiday: Holiday) => void;
  onRefresh: () => void;
}

export default function HolidayList({
  holidays,
  onEdit,
  onRefresh,
}: HolidayListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this holiday?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/holidays/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        onRefresh();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTypeColor = (type: HolidayType) => {
    switch (type) {
      case "both":
        return "bg-blue-100 text-blue-800";
      case "office":
        return "bg-green-100 text-green-800";
      case "field":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: HolidayType) => {
    switch (type) {
      case "both":
        return "Both";
      case "office":
        return "Office";
      case "field":
        return "Field";
      default:
        return type;
    }
  };

  if (holidays.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 text-lg">No holidays found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recurring
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {holidays.map((holiday) => (
              <tr key={holiday.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatDate(holiday.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {holiday.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {holiday.description || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                      holiday.type
                    )}`}
                  >
                    {getTypeLabel(holiday.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {holiday.isRecurring ? "Yes" : "No"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(holiday)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(holiday.id)}
                    disabled={deletingId === holiday.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {deletingId === holiday.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
