// modules/bim/[id]/viewer/client.tsx
"use client";

import { useState } from "react";
import SimpleBIMViewer from "../../../../components/bim/SimpleBIMViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BIMModel, ElementSelectionEvent } from "../../../../types";

interface BIMViewerClientProps {
  model: BIMModel;
}

export default function BIMViewerClient({ model }: BIMViewerClientProps) {
  const router = useRouter();
  const [selectedElementInfo, setSelectedElementInfo] =
    useState<ElementSelectionEvent | null>(null);

  const handleElementSelect = (event: ElementSelectionEvent) => {
    setSelectedElementInfo(event);
    console.log("Element selected:", event);
  };

  const handleBackToBIM = () => {
    router.push("/modules/bim");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleBackToBIM}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to BIM
          </Button>
          <div>
            <h1 className="font-semibold">{model.name}</h1>
            <p className="text-sm text-muted-foreground">{model.fileName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedElementInfo && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1 rounded-md">
              <Info className="w-4 h-4" />
              <span>Selected: {selectedElementInfo.element.elementName}</span>
            </div>
          )}

          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1">
        <SimpleBIMViewer model={model} onElementSelect={handleElementSelect} />
      </div>
    </div>
  );
}
