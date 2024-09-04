"use client";
import ProjectsTable from "../components/ProjectsTable";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import SideNav from "@/app/components/SideNav";

export default function Projects() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [projectName, setProjectName] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [projectStartDate, setProjectStartDate] = useState<string>("");
  const [projectEndDate, setProjectEndDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [projects, setProjects] = useState([]);

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

  const createProject = async () => {
    setLoading(true);
    try {
      const request = await fetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          userID: user?.id,
          name: projectName,
          description: projectDescription,
          startDate: projectStartDate,
          endDate: projectEndDate,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const response = await request.json();
      alert(response.message);
      setProjectName("");
      setProjectDescription("");
      setProjectStartDate("");
      setProjectEndDate("");
      fetchProjects(); // Fetch projects again after creating a new project
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createProject();
  };

  const deleteProject = async (id: number) => {
    try {
      const request = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
      });
      const response = await request.json();
      alert(response.message);
      fetchProjects(); // Fetch projects again after deleting a project
    } catch (err) {
      console.log(err);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return <p>Loading...</p>;
  }

  return (
    <div className="w-full">
      <main className="min-h-[90vh] flex items-start">
        <SideNav />

        <div className="md:w-5/6 w-full h-full p-6">
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="opacity-70 mb-4">Create and view all your projects</p>

          <form className="w-full" onSubmit={handleAddProject} method="POST">
            <div className="w-full flex items-center space-x-4 mb-3">
              <section className="w-1/2">
                <label>Project Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-200 rounded-sm"
                  value={projectName}
                  required
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </section>

              <section className="w-1/2">
                <label>Start Date</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-200 rounded-sm"
                  value={projectStartDate}
                  required
                  onChange={(e) => setProjectStartDate(e.target.value)}
                />
              </section>
            </div>

            <div className="w-full flex items-center space-x-4 mb-3">
              <section className="w-1/2">
                <label>End Date</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-200 rounded-sm"
                  value={projectEndDate}
                  onChange={(e) => setProjectEndDate(e.target.value)}
                />
              </section>
            </div>

            <label htmlFor="description">Project Description</label>
            <textarea
              name="description"
              id="description"
              rows={3}
              className="w-full p-2 border border-gray-200 rounded-sm"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              required
            />

            <button
              className="bg-blue-500 text-white p-2 rounded-md mb-6"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Project"}
            </button>
          </form>

          <ProjectsTable projects={projects} deleteProject={deleteProject} />
        </div>
      </main>
    </div>
  );
}
