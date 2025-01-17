import React from "react";
import Link from "next/link";

// Define the type for props
interface ProjectNameRendererProps {
  value: string; // This represents the project name
  data: {
    id: number; // The ID of the project
  };
}

const ProjectNameRenderer: React.FC<ProjectNameRendererProps> = (props) => {
  const projectId = props.data.id;
  const projectName = props.value;

  return <Link href={`/modules/labor/${projectId}`}>{projectName}</Link>;
};

export default ProjectNameRenderer;
