// modules/bim/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Upload, FileText, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import type { BIMModel } from "../../types";

export default function BIMModulePage() {
  const [models, setModels] = useState<BIMModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/bim/models");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch models");
      }

      if (result.success) {
        setModels(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch models");
      }
    } catch (err) {
      console.error("Error fetching BIM models:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch models");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Loading BIM models...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
            <h3 className="text-lg font-semibold">Error Loading Models</h3>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={fetchModels}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">BIM Models</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view your Building Information Models
          </p>
        </div>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Upload Model
        </Button>
      </div>

      {/* Models Grid */}
      {models.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No BIM Models</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first IFC file to get started with BIM viewing and
            analysis.
          </p>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Your First Model
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {model.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {model.fileName}
                    </p>
                  </div>
                  {model.ifcSchema && (
                    <Badge variant="secondary" className="ml-2">
                      {model.ifcSchema}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {model.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {model.description}
                  </p>
                )}

                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1" />
                  {model.uploadDate
                    ? new Date(model.uploadDate).toLocaleDateString()
                    : "Unknown date"}
                  {model.fileSize && (
                    <>
                      <span className="mx-2">•</span>
                      {(model.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button asChild className="flex-1">
                    <Link href={`/modules/bim/${model.id}/viewer`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Model
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
