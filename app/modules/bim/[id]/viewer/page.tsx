// modules/bim/[id]/viewer/page.tsx
import { notFound } from "next/navigation";
import { getBIMModel } from "../../../../db/actions";
import BIMViewerClient from "./client";

interface BIMViewerPageProps {
  params: {
    id: string;
  };
}

export default async function BIMViewerPage({ params }: BIMViewerPageProps) {
  const modelId = parseInt(params.id);

  if (isNaN(modelId)) {
    notFound();
  }

  const model = await getBIMModel(modelId);

  if (!model) {
    notFound();
  }

  return (
    <div className="h-screen w-full">
      <BIMViewerClient model={model} />
    </div>
  );
}
