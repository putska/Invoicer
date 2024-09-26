"use client";

import * as React from "react";
import { useCallback, useState, useEffect, useContext } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { PermissionContext } from "@/context/PermissionContext";
import { FaEdit, FaTrash, FaList } from "react-icons/fa"; // Ensure these are imported if used elsewhere

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

interface Project {
  id: number;
  name: string;
  // Add other relevant fields if necessary
}

export default function ActivitiesPage({
  params,
}: {
  params: { projectId: string };
}) {
  const projectId = parseInt(params.projectId, 10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(
    undefined
  );
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
  const [expandedCategories, setExpandedCategories] = useState<{
    [key: number]: boolean;
  }>({});
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);

  // Get the user's permission level
  const { hasWritePermission } = useContext(PermissionContext);

  const fetchCurrentProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`); // Fetch specific project
      if (!res.ok) {
        throw new Error(`Error fetching project: ${res.statusText}`);
      }
      const data = await res.json();
      setCurrentProject(data.project);
    } catch (err) {
      console.error(err);
      // Optionally, set an error state here to display to the user
    }
  }, [projectId]);

  // Fetch categories and activities based on projectId
  useEffect(() => {
    if (projectId) {
      fetchCurrentProject(); // Initial fetch when the component mounts
      const fetchCategoriesAndActivities = async () => {
        try {
          const res = await fetch(
            `/api/getTreeViewData?projectId=${projectId}`
          );
          if (!res.ok) {
            throw new Error(
              `Error fetching categories and activities: ${res.statusText}`
            );
          }
          const data = await res.json();
          setCategories(data.treeViewData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchCategoriesAndActivities();
    }
  }, [projectId, fetchCurrentProject]);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find((project) => project.id === projectId);
      setCurrentProject(project);
    }
  }, [projectId, projects]);

  const handleSubmit = async () => {
    try {
      if (dialogType === "category") {
        if (currentItemId) {
          // Update existing category
          const res = await fetch(
            `/api/categories?categoryId=${currentItemId}`,
            {
              method: "PUT",
              body: JSON.stringify({
                projectId: projectId,
                name: newItemName,
                sortOrder: newSortOrder,
              }),
              headers: { "Content-Type": "application/json" },
            }
          );
          if (res.ok) {
            // Update category in state
            setCategories((prevCategories) =>
              prevCategories.map((cat) =>
                cat.categoryId === currentItemId
                  ? {
                      ...cat,
                      categoryName: newItemName,
                      sortOrder: newSortOrder,
                    }
                  : cat
              )
            );
          }
        } else {
          // Add new category
          const res = await fetch(`/api/categories`, {
            method: "POST",
            body: JSON.stringify({
              projectId: projectId,
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
      } else if (dialogType === "activity" && categoryToAddTo !== null) {
        if (currentItemId) {
          // Update existing activity
          const res = await fetch(
            `/api/activities?activityId=${currentItemId}`,
            {
              method: "PUT",
              body: JSON.stringify({
                categoryId: categoryToAddTo,
                name: newItemName,
                sortOrder: newSortOrder,
                estimatedHours,
                notes,
                completed,
              }),
              headers: { "Content-Type": "application/json" },
            }
          );
          if (res.ok) {
            // Update activity in state
            setCategories((prevCategories) =>
              prevCategories.map((cat) =>
                cat.categoryId === categoryToAddTo
                  ? {
                      ...cat,
                      activities: cat.activities.map((activity) =>
                        activity.activityId === currentItemId
                          ? {
                              ...activity,
                              activityName: newItemName,
                              sortOrder: newSortOrder,
                              estimatedHours,
                              notes,
                              completed,
                            }
                          : activity
                      ),
                    }
                  : cat
              )
            );
          }
        } else {
          // Add new activity
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
      }

      // Reset dialog state
      setDialogOpen(false);
      setCurrentItemId(null);
      setNewItemName("");
      setNewSortOrder(0);
      setEstimatedHours(0);
      setNotes("");
      setCompleted(false);
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prevState) => ({
      ...prevState,
      [categoryId]: !prevState[categoryId],
    }));
  };

  const handleOpenDialog = (
    type: "category" | "activity",
    categoryId?: number
  ) => {
    if (!hasWritePermission) return; // Prevent opening dialog if no permission

    setDialogOpen(true);
    setDialogType(type);
    setCurrentItemId(null);
    setNewItemName("");
    setNewSortOrder(0);
    setEstimatedHours(0);
    setNotes("");
    setCompleted(false);
    setCategoryToAddTo(categoryId || null);
  };

  const handleEditDialog = (
    type: "category" | "activity",
    item: any,
    parentCategoryId?: number
  ) => {
    if (!hasWritePermission) return; // Prevent editing if no permission

    setDialogType(type);
    setDialogOpen(true);

    if (type === "category") {
      setCurrentItemId(item.categoryId);
      setNewItemName(item.categoryName);
      setNewSortOrder(item.sortOrder || 0);
      // Reset activity-specific fields
      setEstimatedHours(0);
      setNotes("");
      setCompleted(false);
      setCategoryToAddTo(null);
    } else if (type === "activity") {
      setCurrentItemId(item.activityId);
      setNewItemName(item.activityName);
      setNewSortOrder(item.sortOrder || 0);
      setEstimatedHours(item.estimatedHours || 0);
      setNotes(item.notes || "");
      setCompleted(item.completed || false);
      setCategoryToAddTo(parentCategoryId || null);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!hasWritePermission) return; // Prevent deletion if no permission

    try {
      const res = await fetch(`/api/categories?categoryId=${categoryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCategories((prevCategories) =>
          prevCategories.filter((cat) => cat.categoryId !== categoryId)
        );
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!hasWritePermission) return; // Prevent deletion if no permission

    try {
      const response = await fetch(`/api/activities?activityId=${activityId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCategories((prevCategories) =>
          prevCategories.map((cat) => ({
            ...cat,
            activities: cat.activities.filter(
              (activity) => activity.activityId !== activityId
            ),
          }))
        );
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  return (
    <div className="w-full">
      <main className="min-h-[90vh] flex items-start">
        <div className="md:w-5/6 w-full h-full p-6">
          <div className="p-4">
            {currentProject ? (
              <h1 className="text-2xl font-semibold mb-4">
                Categories and activities for {currentProject.name}
              </h1>
            ) : (
              <p className="text-gray-500 mb-4">
                Loading project information...
              </p>
            )}

            {/* Categories and Activities */}
            {projectId && (
              <div>
                <div className="hs-accordion-treeview-root" role="tree">
                  {/* Render categories */}
                  {categories.map((category) => (
                    <div key={category.categoryId} className="hs-accordion">
                      <div className="hs-accordion-heading py-1 flex items-center gap-x-0.5">
                        <button
                          className="hs-accordion-toggle w-4 h-4 flex justify-center items-center hover:bg-gray-100 rounded-md"
                          onClick={() => toggleCategory(category.categoryId)}
                          aria-label={
                            expandedCategories[category.categoryId]
                              ? "Collapse category"
                              : "Expand category"
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M5 12h14" />
                            <path
                              className={
                                expandedCategories[category.categoryId]
                                  ? "hidden"
                                  : ""
                              }
                              d="M12 5v14"
                            />
                          </svg>
                        </button>
                        <div className="grow px-2 flex items-center">
                          <span
                            className={`text-sm text-gray-800 
                                        ${
                                          hasWritePermission
                                            ? "hover:text-blue-700 cursor-pointer"
                                            : "cursor-not-allowed text-gray-400"
                                        }`}
                            onClick={() =>
                              hasWritePermission
                                ? handleEditDialog("category", category)
                                : null
                            }
                            title={
                              hasWritePermission
                                ? "Edit Category"
                                : "You do not have permission to edit categories"
                            }
                          >
                            {category.categoryName}
                          </span>

                          {/* Delete Category Button */}
                          <button
                            className={`text-red-500 hover:text-red-700 ml-2 
                                        ${
                                          !hasWritePermission
                                            ? "cursor-not-allowed opacity-50"
                                            : ""
                                        }`}
                            onClick={() =>
                              hasWritePermission
                                ? handleDeleteCategory(category.categoryId)
                                : null
                            }
                            disabled={!hasWritePermission}
                            aria-disabled={!hasWritePermission}
                            title={
                              hasWritePermission
                                ? "Delete Category"
                                : "You do not have permission to delete categories"
                            }
                          >
                            x
                          </button>
                        </div>
                      </div>

                      {expandedCategories[category.categoryId] && (
                        <div className="hs-accordion-content w-full">
                          <div className="ps-7">
                            {/* Render activities */}
                            {category.activities.map((activity) => (
                              <div
                                key={activity.activityId}
                                className="py-1 px-2 cursor-pointer hover:bg-gray-50 flex items-center"
                              >
                                <span
                                  className={`text-sm text-gray-800 
                                              ${
                                                hasWritePermission
                                                  ? "hover:text-blue-700 cursor-pointer"
                                                  : "cursor-not-allowed text-gray-400"
                                              }`}
                                  onClick={() =>
                                    hasWritePermission
                                      ? handleEditDialog(
                                          "activity",
                                          activity,
                                          category.categoryId
                                        )
                                      : null
                                  }
                                  title={
                                    hasWritePermission
                                      ? "Edit Activity"
                                      : "You do not have permission to edit activities"
                                  }
                                >
                                  {activity.activityName}
                                </span>
                                {/* Delete Activity Button */}
                                <button
                                  className={`text-red-500 hover:text-red-700 ml-2 
                                              ${
                                                !hasWritePermission
                                                  ? "cursor-not-allowed opacity-50"
                                                  : ""
                                              }`}
                                  onClick={() =>
                                    hasWritePermission
                                      ? handleDeleteActivity(
                                          activity.activityId
                                        )
                                      : null
                                  }
                                  disabled={!hasWritePermission}
                                  aria-disabled={!hasWritePermission}
                                  title={
                                    hasWritePermission
                                      ? "Delete Activity"
                                      : "You do not have permission to delete activities"
                                  }
                                >
                                  x
                                </button>
                              </div>
                            ))}
                            {/* Add New Activity */}
                            <div
                              className="py-1 px-2"
                              onClick={() =>
                                hasWritePermission
                                  ? handleOpenDialog(
                                      "activity",
                                      category.categoryId
                                    )
                                  : null
                              }
                              title={
                                hasWritePermission
                                  ? "Add new activity"
                                  : "You do not have permission to add activities"
                              }
                            >
                              <button
                                className={`text-sm text-blue-500 underline 
                                            ${
                                              !hasWritePermission
                                                ? "cursor-not-allowed text-gray-400"
                                                : "hover:text-blue-700"
                                            }`}
                                onClick={() =>
                                  hasWritePermission
                                    ? handleOpenDialog(
                                        "activity",
                                        category.categoryId
                                      )
                                    : null
                                }
                                disabled={!hasWritePermission}
                                aria-disabled={!hasWritePermission}
                                title={
                                  hasWritePermission
                                    ? "Add new activity"
                                    : "You do not have permission to add activities"
                                }
                              >
                                Add new activity
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Add New Category */}
                  <div
                    className="py-1"
                    onClick={() =>
                      hasWritePermission && handleOpenDialog("category")
                    }
                    title={
                      hasWritePermission
                        ? "Add new category"
                        : "You do not have permission to add categories"
                    }
                  >
                    <button
                      className={`text-sm text-blue-500 underline 
                                  ${
                                    !hasWritePermission
                                      ? "cursor-not-allowed text-gray-400"
                                      : "hover:text-blue-700"
                                  }`}
                      onClick={() =>
                        hasWritePermission && handleOpenDialog("category")
                      }
                      disabled={!hasWritePermission}
                      aria-disabled={!hasWritePermission}
                      title={
                        hasWritePermission
                          ? "Add new category"
                          : "You do not have permission to add categories"
                      }
                    >
                      Add new category
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
              <DialogTitle>
                {dialogType === "category"
                  ? currentItemId
                    ? "Edit Category"
                    : "Add New Category"
                  : currentItemId
                  ? "Edit Activity"
                  : "Add New Activity"}
              </DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label={
                    dialogType === "category"
                      ? "Category Name"
                      : "Activity Name"
                  }
                  type="text"
                  fullWidth
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  disabled={!hasWritePermission}
                />
                <TextField
                  margin="dense"
                  label="Sort Order"
                  type="number"
                  fullWidth
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(Number(e.target.value))}
                  disabled={!hasWritePermission}
                />
                {dialogType === "activity" && (
                  <>
                    <TextField
                      margin="dense"
                      label="Estimated Hours"
                      type="number"
                      fullWidth
                      value={estimatedHours}
                      onChange={(e) =>
                        setEstimatedHours(Number(e.target.value))
                      }
                      disabled={!hasWritePermission}
                    />
                    <TextField
                      margin="dense"
                      label="Notes"
                      type="text"
                      fullWidth
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={!hasWritePermission}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={completed}
                          onChange={(e) => setCompleted(e.target.checked)}
                          disabled={!hasWritePermission}
                        />
                      }
                      label="Completed"
                    />
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!hasWritePermission}
                  aria-disabled={!hasWritePermission}
                >
                  {currentItemId ? "Update" : "Add"}
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
}
