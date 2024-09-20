"use client";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import ProjectsTable from "../components/ProjectsTable";
import AddProjectModal from "../components/AddProjectModal"; // We'll modify this to handle both adding and editing

export default function Projects() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // State for modal visibility and mode
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(
    null
  );

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects`); // Fetch all projects
      const data = await res.json();
      setProjects(data.projects);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProjects(); // Initial fetch when the component mounts
    }
  }, [isLoaded, isSignedIn, fetchProjects]);

  const createProject = async (projectData: Partial<Project>) => {
    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          userID: user?.id,
          ...projectData,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      alert(result.message);
      fetchProjects(); // Refresh the projects list
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectData: Partial<Project>) => {
    if (!projectData.id) return; // Ensure the project has an ID
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectData.id}`, {
        method: "PUT",
        body: JSON.stringify(projectData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      alert(result.message);
      fetchProjects(); // Refresh the projects list
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      alert(result.message);
      fetchProjects(); // Refresh the projects list
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddProject = () => {
    setCurrentProject(null);
    setEditMode(false);
    setShowModal(true);
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setEditMode(true);
    setShowModal(true);
  };

  if (!isLoaded || !isSignedIn) {
    return <p>Loading...</p>;
  }

  return (
    <div className="w-full">
      <main className="min-h-[90vh] flex items-start">
        <div className="md:w-5/6 w-full h-full p-6">
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="opacity-70 mb-4">Create and view all your projects</p>

          <div className="w-full">
            <h2 className="bg-blue-500 text-white p-2 rounded-t-md">
              Projects
            </h2>
            <div className="ag-theme-alpine w-full" style={{ height: 400 }}>
              <ProjectsTable
                projects={projects}
                deleteProject={deleteProject}
                editProject={handleEditProject} // Pass the edit handler
              />
            </div>
          </div>

          <div className="flex flex-col items-start mt-4">
            <button
              className="bg-blue-500 text-white p-2 rounded-md mb-4"
              onClick={handleAddProject}
            >
              Add Project
            </button>

            {/* Render the modal when showModal is true */}
            {showModal && (
              <AddProjectModal
                onClose={() => setShowModal(false)}
                onSubmit={editMode ? updateProject : createProject}
                project={currentProject} // Pass the current project if editing
                isEditMode={editMode} // Indicate if we're in edit mode
              />
            )}

            <Link
              href="/summary"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Back to summary page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
