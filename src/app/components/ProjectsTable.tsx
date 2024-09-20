import React from "react";
import { FaEdit, FaTrash, FaList } from "react-icons/fa"; // Import icons (you might need to install react-icons)
import Link from "next/link";

interface Project {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status?: string;
}

interface ProjectsTableProps {
  projects: Project[];
  deleteProject: (id: number) => void;
  editProject: (project: Project) => void; // New prop
}

export default function ProjectsTable({
  projects,
  deleteProject,
  editProject,
}: ProjectsTableProps) {
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          {/* Table headers */}
          <th className="py-2">Name</th>
          <th className="py-2">Description</th>
          <th className="py-2">Start Date</th>
          <th className="py-2">End Date</th>
          <th className="py-2">Status</th>
          <th className="py-2">Actions</th> {/* New column for actions */}
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.id}>
            {/* Table cells */}
            <td className="py-2">{project.name}</td>
            <td className="py-2">{project.description}</td>
            <td className="py-2">{project.startDate}</td>
            <td className="py-2">{project.endDate}</td>
            <td className="py-2">{project.status}</td>
            <td className="py-2 flex space-x-2">
              {/* Edit button */}
              <button
                onClick={() => editProject(project)}
                className="text-blue-500 hover:text-blue-700"
              >
                <FaEdit />
              </button>
              {/* Delete button */}
              <button
                onClick={() => deleteProject(project.id)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTrash />
              </button>
              {/* Categories button */}
              <Link href={`/projects/${project.id}/activities`} passHref>
                <button
                  className="text-green-500 hover:text-green-700"
                  title="Manage Categories"
                >
                  <FaList />
                </button>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
