"use client";
import { useCallback, useEffect, useState, useContext } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import ProjectsTable from "../../components/ProjectsGrid";
import AddProjectModal from "../../components/AddProjectModal";
import StartDateConfirmationDialog from "../../components/StartDateConfirmationDialog"; // Add this import
import { PermissionContext } from "../../context/PermissionContext";
import { Project } from "../../types";

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

  // State for start date confirmation dialog
  const [showStartDateDialog, setShowStartDateDialog] =
    useState<boolean>(false);
  const [pendingProjectUpdate, setPendingProjectUpdate] =
    useState<Partial<Project> | null>(null);

  // Get the user's permission level
  const { hasWritePermission } = useContext(PermissionContext);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects`);
      const data = await res.json();
      setProjects(data.projects);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProjects();
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
      fetchProjects();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const performProjectUpdate = async (
    projectData: Partial<Project>,
    adjustLabor: boolean = false
  ) => {
    if (!projectData.id) return;

    setLoading(true);

    try {
      // Check if we need to adjust labor and the start date has changed
      if (adjustLabor) {
        const originalProject = projects.find(
          (proj) => proj.id === projectData.id
        );
        if (
          originalProject &&
          projectData.startDate &&
          projectData.startDate !== originalProject.startDate
        ) {
          // Call the updateStartDate API route
          const response = await fetch(`/api/projects/updateStartDate`, {
            method: "PUT",
            body: JSON.stringify({
              projectId: projectData.id,
              newStartDate: projectData.startDate,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(
              result.error || "Failed to update project start date"
            );
          }

          console.log("Start date and manpower records updated successfully");
        }
      }

      // Update the project as usual
      const response = await fetch(`/api/projects/${projectData.id}`, {
        method: "PUT",
        body: JSON.stringify(projectData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      alert(result.message);

      // Refresh the projects list
      fetchProjects();
    } catch (err) {
      console.error("Error updating project:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectData: Partial<Project>) => {
    if (!projectData.id) return;

    // Check if the start date has changed
    const originalProject = projects.find((proj) => proj.id === projectData.id);

    const hasStartDateChanged =
      originalProject &&
      projectData.startDate &&
      projectData.startDate !== originalProject.startDate;

    if (hasStartDateChanged) {
      // Show confirmation dialog
      setPendingProjectUpdate(projectData);
      setShowStartDateDialog(true);
    } else {
      // No start date change, proceed normally
      await performProjectUpdate(projectData, false);
    }
  };

  const handleStartDateConfirmation = async (adjustLabor: boolean) => {
    if (pendingProjectUpdate) {
      await performProjectUpdate(pendingProjectUpdate, adjustLabor);
    }
    setShowStartDateDialog(false);
    setPendingProjectUpdate(null);
  };

  const handleStartDateCancel = () => {
    setShowStartDateDialog(false);
    setPendingProjectUpdate(null);
  };

  const deleteProject = async (id: number) => {
    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      alert(result.message);
      fetchProjects();
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
      <main className="min-h-[90vh] flex flex-col items-start p-6">
        <div className="md:w-5/6 w-full h-full">
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="opacity-70 mb-4">Create and view all your projects</p>

          <div className="w-full mb-4">
            <h2 className="bg-blue-500 text-white p-2 rounded-t-md">
              Projects
            </h2>
            <div className="ag-theme-alpine w-full mb-4 flex-1 overflow-auto">
              <ProjectsTable
                projects={projects}
                deleteProject={deleteProject}
                editProject={handleEditProject}
                defaultFilter={{
                  field: "status",
                  filter: "equals",
                  value: "active",
                }}
              />
            </div>
          </div>

          {/* Add Project Button */}
          {hasWritePermission && (
            <div className="flex justify-start mt-4">
              <button
                className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-700 .z-10"
                onClick={handleAddProject}
                title="Add a new project"
              >
                Add Project
              </button>
            </div>
          )}

          {/* Add Project Modal */}
          {showModal && (
            <AddProjectModal
              onClose={() => setShowModal(false)}
              onSubmit={editMode ? updateProject : createProject}
              project={currentProject}
              isEditMode={editMode}
            />
          )}

          {/* Start Date Confirmation Dialog */}
          <StartDateConfirmationDialog
            isOpen={showStartDateDialog}
            onConfirm={handleStartDateConfirmation}
            onCancel={handleStartDateCancel}
          />

          <Link
            href="/modules/summary"
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block"
          >
            Back to summary page
          </Link>
        </div>
      </main>
    </div>
  );
}
