"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  Eye,
  ArrowLeft,
  FileText,
  Calculator,
  MessageSquare,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import * as THREE from "three";

// Import our components
import EnhancedBIMViewer from "../../components/EnhancedBimViewer";
import TakeoffManager from "../../components/TakeoffManager";
import CommentsPanel from "../../components/CommentsPanel";

import type {
  BIMModel as DBBIMModel,
  BIMElement as DBBIMElement,
  TakeoffItem,
} from "@/app/types";

// UI-friendly interfaces (using undefined instead of null)
interface BIMModel {
  id: number;
  name: string;
  description?: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadDate: Date;
  uploadedBy?: number;
  version?: string;
  revitVersion?: string;
  ifcSchema?: string;
  projectId?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  isActive: boolean;
  metadata?: any;
}

interface BIMElement {
  id: number;
  createdAt: Date;
  modelId: number;
  ifcId: string;
  elementType?: string;
  elementName?: string;
  level?: string;
  material?: string;
  properties?: any;
  geometryData?: any;
}

// Define our own comment interface for the UI (not extending database type)
interface UIModelComment {
  id: number;
  modelId: number;
  elementId?: number;
  title?: string;
  content: string;
  commentType?: string;
  position?: { x: number; y: number; z: number };
  status: string;
  priority?: string;
  assignedTo?: number;
  reportedBy?: number;
  dueDate?: Date;
  resolvedAt?: Date;
  resolvedBy?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define metadata structure for better type safety
interface ModelMetadata {
  totalElements?: number;
  elementTypes?: Record<string, number>;
  levels?: string[];
  materials?: string[];
  ifcSchema?: string;
}

export default function BIMPage() {
  // Main state
  const [models, setModels] = useState<BIMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<BIMModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Inter-component communication state
  const [selectedElement, setSelectedElement] = useState<
    BIMElement | undefined
  >(undefined);
  const [selectedPosition, setSelectedPosition] = useState<
    THREE.Vector3 | undefined
  >(undefined);
  const [selectedElementsForTakeoff, setSelectedElementsForTakeoff] = useState<
    number[]
  >([]);
  const [activeTab, setActiveTab] = useState("viewer");

  // Comments for 3D visualization
  const [comments, setComments] = useState<
    Array<{
      id: number;
      position: THREE.Vector3;
      text: string;
      status: string;
    }>
  >([]);

  // Helper function to convert database model to UI model
  const convertDBModelToUI = (dbModel: DBBIMModel): BIMModel => {
    console.log("Converting DB model to UI model:", dbModel);
    const uiModel = {
      id: dbModel.id,
      name: dbModel.name,
      description: dbModel.description || undefined,
      filePath: dbModel.filePath,
      fileName: dbModel.fileName,
      fileSize: dbModel.fileSize || undefined,
      mimeType: dbModel.mimeType || undefined,
      uploadDate: dbModel.uploadDate || new Date(),
      uploadedBy: dbModel.uploadedBy || undefined,
      version: dbModel.version || undefined,
      revitVersion: dbModel.revitVersion || undefined,
      ifcSchema: dbModel.ifcSchema || undefined,
      projectId: dbModel.projectId || undefined,
      createdAt: dbModel.createdAt || new Date(),
      updatedAt: dbModel.updatedAt || new Date(),
      createdBy: dbModel.createdBy || undefined,
      isActive: dbModel.isActive ?? true,
      metadata: dbModel.metadata,
    };
    console.log("Converted UI model:", uiModel);
    return uiModel;
  };

  // Helper function to convert database element to UI element
  const convertDBElementToUI = (dbElement: DBBIMElement): BIMElement => ({
    id: dbElement.id,
    createdAt: dbElement.createdAt || new Date(),
    modelId: dbElement.modelId,
    ifcId: dbElement.ifcId,
    elementType: dbElement.elementType || undefined,
    elementName: dbElement.elementName || undefined,
    level: dbElement.level || undefined,
    material: dbElement.material || undefined,
    properties: dbElement.properties,
    geometryData: dbElement.geometryData,
  });

  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/bim/models");
      const result = await response.json();
      if (result.success) {
        // Convert database models to UI models
        const uiModels = result.data.map(convertDBModelToUI);
        setModels(uiModels);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/bim/models", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        const uiModel = convertDBModelToUI(result.data);
        setModels((prev) => [uiModel, ...prev]);
        setUploadDialogOpen(false);
        (event.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error("Error uploading model:", error);
    }
  };

  // Handler for when an element is selected in the 3D viewer
  const handleElementSelect = (
    element: {
      id: number;
      createdAt: Date | null;
      modelId: number;
      ifcId: string;
      elementType: string | null;
      elementName: string | null;
      level: string | null;
      material: string | null;
      properties: unknown;
      geometryData: unknown;
    },
    position?: THREE.Vector3
  ) => {
    // Convert the incoming element to our BIMElement type
    const bimElement: BIMElement = {
      ...element,
      createdAt: element.createdAt || new Date(),
      elementType: element.elementType || undefined,
      elementName: element.elementName || undefined,
      level: element.level || undefined,
      material: element.material || undefined,
    };

    setSelectedElement(bimElement);
    if (position) {
      setSelectedPosition(position);
    }

    // If we're in takeoff mode, switch to takeoffs tab
    if (activeTab === "viewer") {
      // Could automatically switch to takeoffs tab, or just keep state
    }
  };

  // Handler for adding element to takeoff
  const handleAddToTakeoff = (element: BIMElement) => {
    setSelectedElementsForTakeoff((prev) => [...prev, element.id]);
    setActiveTab("takeoffs"); // Switch to takeoffs tab
  };

  // Handler for when an element is added to a takeoff
  const handleElementAddedToTakeoff = (element: {
    id: number;
    createdAt: Date | null;
    modelId: number;
    ifcId: string;
    elementType: string | null;
    elementName: string | null;
    level: string | null;
    material: string | null;
    properties: unknown;
    geometryData: unknown;
  }) => {
    setSelectedElementsForTakeoff((prev) => [...prev, element.id]);
  };

  // Handler for adding comments
  const handleAddComment = (position: THREE.Vector3, element?: BIMElement) => {
    setSelectedPosition(position);
    setSelectedElement(element); // element is already BIMElement | undefined
    setActiveTab("comments"); // Switch to comments tab
  };

  // Handler for when a comment is added
  const handleCommentAdded = (comment: UIModelComment) => {
    if (comment.position) {
      const position = new THREE.Vector3(
        comment.position.x,
        comment.position.y,
        comment.position.z
      );
      setComments((prev) => [
        ...prev,
        {
          id: comment.id,
          position,
          text: comment.title || comment.content || "Comment",
          status: comment.status || "open", // Provide default if null
        },
      ]);
    }
  };

  // Handler for comment status changes
  const handleCommentStatusChanged = (commentId: number, status: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, status } : comment
      )
    );
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading BIM models...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {selectedModel ? (
        /* Model View Mode */
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedModel(null);
                  setSelectedElement(undefined);
                  setSelectedPosition(undefined);
                  setActiveTab("viewer");
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Models
              </Button>
              <div>
                <h1 className="text-xl font-bold">{selectedModel.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedModel.description || "BIM Model Workspace"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedElement && (
                <Badge variant="outline" className="text-xs">
                  Selected: {selectedElement.elementName}
                </Badge>
              )}
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <div className="px-4 pt-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="viewer"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    3D Viewer
                  </TabsTrigger>
                  <TabsTrigger
                    value="takeoffs"
                    className="flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Takeoffs
                    {selectedElementsForTakeoff.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {selectedElementsForTakeoff.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Comments
                    {comments.filter((c) => c.status === "open").length > 0 && (
                      <Badge variant="destructive" className="ml-1 text-xs">
                        {comments.filter((c) => c.status === "open").length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="viewer" className="flex-1 m-0">
                <EnhancedBIMViewer
                  model={selectedModel}
                  onElementSelect={handleElementSelect}
                />
              </TabsContent>

              <TabsContent value="takeoffs" className="flex-1 m-0">
                <TakeoffManager
                  model={{
                    ...selectedModel,
                    description: selectedModel.description ?? null,
                    fileSize: selectedModel.fileSize ?? null,
                    mimeType: selectedModel.mimeType ?? null,
                    uploadDate: selectedModel.uploadDate ?? null,
                    uploadedBy: selectedModel.uploadedBy ?? null,
                    version: selectedModel.version ?? null,
                    revitVersion: selectedModel.revitVersion ?? null,
                    ifcSchema: selectedModel.ifcSchema ?? null,
                    projectId: selectedModel.projectId ?? null,
                    createdAt: selectedModel.createdAt ?? null,
                    updatedAt: selectedModel.updatedAt ?? null,
                    createdBy: selectedModel.createdBy ?? null,
                    metadata: selectedModel.metadata ?? {},
                  }}
                  selectedElement={
                    selectedElement
                      ? {
                          ...selectedElement,
                          elementType: selectedElement.elementType ?? null,
                          elementName: selectedElement.elementName ?? null,
                          level: selectedElement.level ?? null,
                          material: selectedElement.material ?? null,
                          createdAt: selectedElement.createdAt || null,
                          properties: selectedElement.properties ?? {},
                          geometryData: selectedElement.geometryData ?? {},
                        }
                      : undefined
                  }
                  onElementAdd={handleElementAddedToTakeoff}
                />
              </TabsContent>

              <TabsContent value="comments" className="flex-1 m-0">
                <CommentsPanel
                  model={selectedModel}
                  selectedElement={selectedElement}
                  selectedPosition={selectedPosition}
                  onCommentAdded={handleCommentAdded}
                  onCommentStatusChanged={handleCommentStatusChanged}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        /* Model Management Mode */
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">BIM Model Manager</h1>
              <p className="text-muted-foreground">
                Upload, view, and analyze your Revit models with material
                takeoffs and collaboration tools
              </p>
            </div>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Model
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload BIM Model</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Model Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter model name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Enter model description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="file">IFC File</Label>
                    <Input
                      id="file"
                      name="file"
                      type="file"
                      accept=".ifc,.ifczip"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload IFC files exported from Revit
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Models Grid */}
          {models.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No BIM models yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Upload your first IFC file from Revit to get started with 3D
                  visualization and material takeoffs
                </p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Model
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <Card
                  key={model.id}
                  className="hover:shadow-md transition-shadow group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Uploaded {formatDate(model.uploadDate)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {model.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {model.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Size:</span>
                        <span>
                          {model.fileSize
                            ? formatFileSize(model.fileSize)
                            : "Unknown"}
                        </span>
                      </div>

                      {/* Temporarily disabled metadata to avoid TypeScript issues */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Elements:</span>
                        <span>Processing...</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={model.isActive ? "default" : "secondary"}
                        >
                          {model.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => setSelectedModel(model)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Open Model
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
