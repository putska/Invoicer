import React, { useEffect, useState } from "react";
import { Project } from "../types";

interface AddProjectModalProps {
  onClose: () => void;
  onSubmit: (projectData: Partial<Project>) => void;
  project?: Partial<Project> | null; // Optional project prop for editing
  isEditMode?: boolean; // Flag to indicate edit mode
}

export default function AddProjectModal({
  onClose,
  onSubmit,
  project,
  isEditMode = false,
}: AddProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectJobNumber, setProjectJobNumber] = useState(""); // New state for job number
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [projectStatus, setProjectStatus] = useState("active"); // New state for project status

  useEffect(() => {
    if (isEditMode && project) {
      // Populate form fields with existing project data
      setProjectName(project.name || "");
      setProjectJobNumber(project.jobNumber || ""); // Set job number
      setProjectDescription(project.description || "");
      setProjectStartDate(project.startDate || "");
      setProjectEndDate(project.endDate || "");
      setProjectStatus(project.status || "active"); // Set status
    } else {
      // Reset form fields for adding a new project
      setProjectName("");
      setProjectJobNumber(""); // Reset job number
      setProjectDescription("");
      setProjectStartDate("");
      setProjectEndDate("");
      setProjectStatus("active"); // Default to active
    }
  }, [isEditMode, project]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prepare the project data
    const projectData: Partial<Project> = {
      id: project?.id, // Include the ID if editing
      name: projectName,
      jobNumber: projectJobNumber, // Include job number
      description: projectDescription,
      startDate: projectStartDate,
      endDate: projectEndDate,
      status: projectStatus, // Include status
    };

    // Optional: Perform validation here

    // Call the parent's onSubmit function with the project data
    onSubmit(projectData);

    // Close the modal
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg overflow-hidden shadow-lg max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold mb-4">
            {isEditMode ? "Edit Project" : "Add New Project"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Project Name:
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project Name"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Job Number:
              </label>
              <input
                type="text"
                value={projectJobNumber}
                onChange={(e) => setProjectJobNumber(e.target.value)}
                placeholder="Job Number"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Project Description:
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Project Description"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Start Date:
              </label>
              <input
                type="date"
                value={projectStartDate}
                onChange={(e) => setProjectStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                End Date:
              </label>
              <input
                type="date"
                value={projectEndDate}
                onChange={(e) => setProjectEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Status:
              </label>
              <select
                value={projectStatus}
                onChange={(e) => setProjectStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
              >
                {isEditMode ? "Update Project" : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
