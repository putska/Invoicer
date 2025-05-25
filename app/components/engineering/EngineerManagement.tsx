// components/engineering/EngineerManagement.tsx
"use client";

import { useState } from "react";
import { Engineer, CreateEngineerForm } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Edit,
  UserX,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EngineerManagementProps {
  engineers: Engineer[];
  onCreateEngineer: (engineer: CreateEngineerForm) => Promise<void>;
  onUpdateEngineer: (id: number, data: Partial<Engineer>) => Promise<void>;
  onDeactivateEngineer: (id: number) => Promise<void>;
}

export function EngineerManagement({
  engineers,
  onCreateEngineer,
  onUpdateEngineer,
  onDeactivateEngineer,
}: EngineerManagementProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleCreateEngineer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    const engineer: CreateEngineerForm = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    };

    try {
      await onCreateEngineer(engineer);
      setIsCreateOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      console.error("Failed to create engineer:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateEngineer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEngineer) return;

    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    };

    try {
      await onUpdateEngineer(editingEngineer.id, updates);
      setEditingEngineer(null);
    } catch (error) {
      console.error("Failed to update engineer:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <CardTitle>Manage Engineers</CardTitle>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Add Engineer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Engineer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEngineer} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Engineer's name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="engineer@company.com"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Engineer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <div className="space-y-2">
            {engineers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No engineers added yet. Click "Add Engineer" to get started.
              </p>
            ) : (
              engineers.map((engineer) => (
                <div
                  key={engineer.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-md border",
                    engineer.active ? "bg-white" : "bg-gray-50 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{engineer.name}</p>
                      <p className="text-sm text-gray-500">{engineer.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Dialog
                      open={editingEngineer?.id === engineer.id}
                      onOpenChange={(open) => !open && setEditingEngineer(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingEngineer(engineer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Engineer</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={handleUpdateEngineer}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                              id="edit-name"
                              name="name"
                              required
                              defaultValue={engineer.name}
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                              id="edit-email"
                              name="email"
                              type="email"
                              required
                              defaultValue={engineer.email}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingEngineer(null)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">Update Engineer</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {engineer.active && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (
                            confirm(
                              `Remove ${engineer.name} from the schedule?`
                            )
                          ) {
                            onDeactivateEngineer(engineer.id);
                          }
                        }}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
