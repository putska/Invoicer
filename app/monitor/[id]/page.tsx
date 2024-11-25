"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Category, Activity } from "../../types";
import { useUser } from "@clerk/nextjs"; // For authentication

const FieldMonitorPage = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id; // Get projectId from URL
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log("Extracted projectId:", projectId);

  // Function to process fetched data
  const processFieldMonitorData = (data: any[]): Category[] => {
    if (!Array.isArray(data)) {
      console.error("Expected data to be an array, but got:", data);
      return [];
    }

    const categoryMap: { [key: number]: Category } = {};

    data.forEach((row) => {
      const {
        categoryId,
        categoryName,
        sortOrder,
        activityId,
        activityName,
        costCode,
        estimatedHours,
        completed,
        notes,
      } = row;

      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          id: categoryId,
          name: categoryName,
          sortOrder,
          activities: [],
          projectId: row.projectId,
        };
      }
      if (!categoryMap[categoryId].activities) {
        categoryMap[categoryId].activities = [];
      }
      categoryMap[categoryId].activities.push({
        id: activityId,
        name: activityName,
        costCode,
        estimatedHours,
        completed,
        notes,
        categoryId,
      });
    });

    // Convert the map to an array
    return Object.values(categoryMap);
  };

  useEffect(() => {
    if (projectId) {
      console.log("Fetching field monitor data for project:", projectId);
      const fetchFieldMonitorData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/monitor?projectId=${projectId}`);
          if (!res.ok) {
            throw new Error(`Error: ${res.status} ${res.statusText}`);
          }
          const result = await res.json();
          const processedData = processFieldMonitorData(result.data);
          setCategories(processedData);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred");
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchFieldMonitorData();
    }
  }, [projectId]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Field Monitor Report</h1>

      {isLoading && <p>Loading...</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">
          <p>Error: {error}</p>
        </div>
      )}

      {!isLoading && !error && categories.length === 0 && (
        <p>No data available for this project.</p>
      )}

      {!isLoading &&
        !error &&
        categories.map((category) => (
          <div key={category.id} className="mb-6">
            {/* Category Section */}
            <div className="bg-gray-200 p-4 rounded-md mb-2">
              <h2 className="font-bold text-lg">{category.name}</h2>
            </div>

            {/* Activities Section */}
            <div className="bg-white shadow rounded-md p-4">
              <table className="table-fixed w-full">
                <thead>
                  <tr>
                    <th className="border px-4 py-2 " style={{ width: "40%" }}>
                      Activity Name
                    </th>
                    <th className="border px-4 py-2" style={{ width: "10%" }}>
                      Estimated Hours
                    </th>
                    <th className="border px-4 py-2" style={{ width: "10%" }}>
                      cost Code
                    </th>
                    <th className="border px-4 py-2" style={{ width: "10%" }}>
                      Completed
                    </th>
                    <th className="border px-4 py-2" style={{ width: "30%" }}>
                      Notes
                    </th>
                    {/* Add other tracking fields as needed */}
                  </tr>
                </thead>
                <tbody>
                  {category.activities &&
                    category.activities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="border px-4 py-2">{activity.name}</td>
                        <td className="border px-4 py-2">
                          {activity.estimatedHours}
                        </td>
                        <td className="border px-4 py-2">
                          {activity.costCode}
                        </td>
                        <td className="border px-4 py-2">
                          {activity.completed ? "Yes" : "No"}
                        </td>
                        <td className="border px-4 py-2">{activity.notes}</td>
                        {/* Add other tracking fields as needed */}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
};

export default FieldMonitorPage;
