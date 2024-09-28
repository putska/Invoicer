// app/components/ProjectsGrid.tsx

"use client"; // Ensure this is a Client Component

import React, { useContext, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { PermissionContext } from "@/context/PermissionContext"; // Adjust the import path accordingly
import { FaEdit, FaTrash, FaList } from "react-icons/fa";
import { useRouter } from "next/navigation";

import { Project } from "@types";

interface ProjectsGridProps {
  projects: Project[];
  deleteProject: (id: number) => void;
  editProject: (project: Project) => void;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  deleteProject,
  editProject,
}) => {
  const { hasWritePermission, isLoaded } = useContext(PermissionContext);
  const router = useRouter();

  // Define column definitions with cell renderers for actions
  const columnDefs: ColDef<Project>[] = useMemo(
    () => [
      { headerName: "Name", field: "name", sortable: true, filter: true },
      {
        headerName: "Description",
        field: "description",
        sortable: true,
        filter: true,
      },
      {
        headerName: "Start Date",
        field: "startDate",
        sortable: true,
        filter: true,
      },
      {
        headerName: "End Date",
        field: "endDate",
        sortable: true,
        filter: true,
      },
      { headerName: "Status", field: "status", sortable: true, filter: true },
      {
        headerName: "Actions",
        // Omit 'field' since it's not a part of Project
        cellRenderer: (params: ICellRendererParams<Project>) => {
          const project = params.data;

          if (!project) {
            return null; // Or render a fallback UI for missing data
          }

          return (
            <div className="flex space-x-2 h-full">
              {/* Edit Button */}
              <button
                onClick={() => editProject(project)}
                className={`text-blue-500 hover:text-blue-700 ${
                  !hasWritePermission || !isLoaded
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
                disabled={!hasWritePermission || !isLoaded}
                title={
                  hasWritePermission
                    ? "Edit Project"
                    : "You do not have permission to edit projects"
                }
                aria-disabled={!hasWritePermission || !isLoaded}
              >
                <FaEdit />
              </button>
              {/* Delete Button */}
              <button
                onClick={() =>
                  project.id !== undefined && deleteProject(project.id)
                }
                className={`text-red-500 hover:text-red-700 ${
                  !hasWritePermission || !isLoaded
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
                disabled={!hasWritePermission || !isLoaded}
                title={
                  hasWritePermission
                    ? "Delete Project"
                    : "You do not have permission to delete projects"
                }
                aria-disabled={!hasWritePermission || !isLoaded}
              >
                <FaTrash />
              </button>
              {/* Categories Button */}
              <button
                onClick={() =>
                  router.push(`/projects/${project.id}/activities`)
                }
                className="text-green-500 hover:text-green-700"
                title="Manage Categories"
              >
                <FaList />
              </button>
            </div>
          );
        },
      },
    ],
    [hasWritePermission, isLoaded, deleteProject, editProject, router]
  );

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
    };
  }, []);

  // Handle grid ready event to set the initial page if necessary
  const onGridReady = (params: any) => {
    if (projects.length > 0) {
      params.api.paginationGoToPage(0); // Navigate to the first page
    }
  };

  // Only render Ag-Grid when data is available
  if (!isLoaded) {
    return <p>Loading permissions...</p>;
  }

  if (projects.length === 0) {
    return <p>No projects available.</p>;
  }

  return (
    <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
      <AgGridReact<Project>
        rowData={projects}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        paginationAutoPageSize={true}
        pagination={true}
        onGridReady={onGridReady}
      />
    </div>
  );
};

export default ProjectsGrid;
