"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Category, Activity, Project } from "../types";
import { useUser } from "@clerk/nextjs"; // For authentication

const FieldMonitorPage = () => {
  const router = useRouter();
  const { projectId } = router.query; // Extract projectId from URL query
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // processResults

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
          projectId: row.projectId, // You might add this from your result
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
    // Fetch project list
    const fetchProjects = async () => {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjectList(data.projects); // Update projectList state
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      const fetchFieldMonitorData = async () => {
        try {
          const res = await fetch(`/api/monitor?projectId=${projectId}`);
          const result = await res.json();
          const processedData = processFieldMonitorData(result.data);
          setCategories(processedData);
        } catch (error) {
          console.error("Error fetching field monitor data:", error);
        }
      };

      fetchFieldMonitorData();
    }
  }, [projectId]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Field Monitor Report</h1>

      {/* Dropdown to select project */}
      <div className="mb-4">
        <label htmlFor="project" className="block mb-2">
          Select Project:
        </label>
        <select
          className="w-full p-2 border border-gray-200 rounded-md"
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(Number(e.target.value))}
        >
          <option value="">-- Select a Project --</option>
          {projectList.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category and Activities */}
      {categories.map((category) => (
        <div key={category.id} className="mb-6">
          {/* Category Section */}
          <div className="bg-gray-200 p-4 rounded-md mb-2">
            <h2 className="font-bold text-lg">{category.name}</h2>
          </div>

          {/* Activities Section */}
          <div className="bg-white shadow rounded-md p-4">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Activity Name</th>
                  <th className="border px-4 py-2">Manpower</th>
                  <th className="border px-4 py-2">Completed</th>
                  <th className="border px-4 py-2">Notes</th>
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
