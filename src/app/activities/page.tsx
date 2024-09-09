"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

interface Project {
  id: number;
  name: string;
}

interface Category {
  categoryId: number;
  categoryName: string;
  sortOrder: number;
  activities: Activity[];
}

interface Activity {
  activityId: number;
  activityName: string;
  sortOrder: number;
  estimatedHours: number;
  notes: string;
  completed: boolean;
}

interface APIProjectResponse {
  projects: Project[];
}

export default function ProjectAccordion() {
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>("");
  const [newSortOrder, setNewSortOrder] = useState<number>(0);
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [completed, setCompleted] = useState<boolean>(false);
  const [dialogType, setDialogType] = useState<"category" | "activity" | null>(
    null
  );
  const [categoryToAddTo, setCategoryToAddTo] = useState<number | null>(null);

  // Fetch the project list
  useEffect(() => {
    const fetchProjects = async () => {
      const res = await fetch("/api/projects");
      const data: APIProjectResponse = await res.json();
      setProjectList(data.projects);
    };
    fetchProjects();
  }, []);

  // Fetch categories and activities based on selected project
  useEffect(() => {
    if (selectedProject) {
      const fetchCategoriesAndActivities = async () => {
        const res = await fetch(
          `/api/getTreeViewData?projectId=${selectedProject}`
        );
        const data = await res.json();
        setCategories(data.treeViewData);
      };
      fetchCategoriesAndActivities();
    }
  }, [selectedProject]);

  // Handle dialog open for adding category or activity
  const handleOpenDialog = (
    type: "category" | "activity",
    categoryId?: number
  ) => {
    setDialogOpen(true);
    setDialogType(type);
    setCategoryToAddTo(categoryId || null);
  };

  const handleAddNewItem = async () => {
    try {
      // Add new category
      if (dialogType === "category") {
        const res = await fetch(`/api/categories`, {
          method: "POST",
          body: JSON.stringify({
            projectId: selectedProject,
            name: newItemName,
            sortOrder: newSortOrder,
          }),
          headers: { "Content-Type": "application/json" },
        });
        const { newCategory } = await res.json();
        setCategories((prevCategories) => [
          ...prevCategories,
          {
            categoryId: newCategory.id,
            categoryName: newCategory.name,
            sortOrder: newCategory.sortOrder,
            activities: [],
          },
        ]);
      }

      // Add new activity
      else if (dialogType === "activity" && categoryToAddTo !== null) {
        const res = await fetch(`/api/activities`, {
          method: "POST",
          body: JSON.stringify({
            categoryId: categoryToAddTo,
            name: newItemName,
            sortOrder: newSortOrder,
            estimatedHours,
            notes,
            completed,
          }),
          headers: { "Content-Type": "application/json" },
        });
        const { newActivity } = await res.json();

        setCategories((prevCategories) =>
          prevCategories.map((cat) =>
            cat.categoryId === categoryToAddTo
              ? {
                  ...cat,
                  activities: [
                    ...cat.activities,
                    {
                      activityId: newActivity.id,
                      activityName: newActivity.name,
                      sortOrder: newActivity.sortOrder,
                      estimatedHours: newActivity.estimatedHours,
                      notes: newActivity.notes,
                      completed: newActivity.completed,
                    },
                  ],
                }
              : cat
          )
        );
      }

      setDialogOpen(false);
      setNewItemName("");
      setNewSortOrder(0);
      setEstimatedHours(0);
      setNotes("");
      setCompleted(false);
    } catch (error) {
      console.error("Error adding new item:", error.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">
        Select a project to view categories and activities
      </h2>

      {/* Project Selector */}
      <div className="my-4">
        <label className="block mb-2">Select Project</label>
        <select
          className="w-full p-2 border border-gray-200 rounded-md"
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(Number(e.target.value))}
        >
          <option value="">-- Select a Project --</option>
          {projectList.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Categories and Activities */}
      {selectedProject && (
        <div>
          <div className="hs-accordion-treeview-root" role="tree">
            {/* Render categories */}
            {categories.map((category) => (
              <div key={category.categoryId} className="hs-accordion">
                <div className="hs-accordion-heading py-1 flex items-center gap-x-0.5">
                  <button className="hs-accordion-toggle w-4 h-4 flex justify-center items-center hover:bg-gray-100 rounded-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M5 12h14" />
                      <path
                        className="hs-accordion-active:hidden"
                        d="M12 5v14"
                      />
                    </svg>
                  </button>
                  <div className="grow px-2 cursor-pointer">
                    <span className="text-sm text-gray-800">
                      {category.categoryName}
                    </span>
                  </div>
                </div>

                <div className="hs-accordion-content w-full">
                  <div className="ps-7">
                    {/* Render activities */}
                    {category.activities.map((activity) => (
                      <div
                        key={activity.activityId}
                        className="py-1 px-2 cursor-pointer hover:bg-gray-50"
                      >
                        <span className="text-sm text-gray-800">
                          {activity.activityName}
                        </span>
                      </div>
                    ))}
                    {/* Add New Activity */}
                    <div
                      className="py-1 px-2 cursor-pointer"
                      onClick={() =>
                        handleOpenDialog("activity", category.categoryId)
                      }
                    >
                      <span className="text-sm text-blue-500 underline">
                        Add new activity
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Add New Category */}
            <div
              className="py-1 cursor-pointer"
              onClick={() => handleOpenDialog("category")}
            >
              <span className="text-sm text-blue-500 underline">
                Add new category
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {dialogType === "category" ? "Add New Category" : "Add New Activity"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={
              dialogType === "category" ? "Category Name" : "Activity Name"
            }
            type="text"
            fullWidth
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Sort Order"
            type="number"
            fullWidth
            value={newSortOrder}
            onChange={(e) => setNewSortOrder(Number(e.target.value))}
          />
          {dialogType === "activity" && (
            <>
              <TextField
                margin="dense"
                label="Estimated Hours"
                type="number"
                fullWidth
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
              />
              <TextField
                margin="dense"
                label="Notes"
                type="text"
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={completed}
                    onChange={(e) => setCompleted(e.target.checked)}
                  />
                }
                label="Completed"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNewItem}>Add</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
