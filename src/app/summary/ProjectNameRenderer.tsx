// ProjectNameRenderer.jsx
import React from "react";
import Link from "next/link";

const ProjectNameRenderer = (props) => {
  const projectId = props.data.project_id;
  const projectName = props.value;

  return <Link href={`/labor/${projectId}`}>{projectName}</Link>;
};

export default ProjectNameRenderer;
