export default function ProjectsTable({
  projects,
  deleteProject,
}: {
  projects: Project[];
  deleteProject: (id: number) => void;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {projects.length > 0 &&
          projects.map((project) => (
            <tr key={project.id}>
              <td className="text-sm">{project.name}</td>
              <td className="text-sm">{project.description}</td>
              <td className="text-sm">{project.startDate}</td>
              <td className="text-sm">{project.endDate}</td>
              <td className="text-sm">{project.status}</td>
              <td className="text-sm">
                <button
                  className="p-2 bg-red-500 text-red-50 text-xs rounded-sm"
                  onClick={() => {
                    if (project.id !== undefined) {
                      deleteProject(project.id);
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
