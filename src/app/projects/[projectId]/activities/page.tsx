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

export default function ActivitiesPage({
  params,
}: {
  params: { projectId: string };
}) {
  const projectId = parseInt(params.projectId, 10);

  const [categories, setCategories] = useState<Category[]>([]);
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

  // Fetch categories and activities based on projectId
  useEffect(() => {
    if (projectId) {
      const fetchCategoriesAndActivities = async () => {
        try {
          const res = await fetch(
            `/api/getTreeViewData?projectId=${projectId}`
          );
          const data = await res.json();

          setCategories(data.treeViewData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchCategoriesAndActivities();
    }
  }, [projectId]);

  const handleAddNewItem = async () => {
    try {
      if (dialogType === "category") {
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
        // Rest of the code...
      } else if (dialogType === "activity" && categoryToAddTo !== null) {
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
        // Rest of the code...
      }

      // Reset dialog state
      setDialogOpen(false);
      setNewItemName("");
      setNewSortOrder(0);
      setEstimatedHours(0);
      setNotes("");
      setCompleted(false);
    } catch (error) {
      console.error("Error adding new item:", error);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prevState) => ({
      ...prevState,
      [categoryId]: !prevState[categoryId],
    }));
  };

  // Handle dialog open for adding category or activity
  const handleOpenDialog = (
    type: "category" | "activity",
    categoryId?: number
  ) => {
    setDialogOpen(true);
    setDialogType(type);
    setCategoryToAddTo(categoryId || null);
  };

  const handleEditDialog = (type: string, item: any) => {
    setDialogType(type);
    setCurrentItemId(item.id);
    setNewItemName(item.name);
    setNewSortOrder(item.sortOrder || 0);
    if (type === "activity") {
      setEstimatedHours(item.estimatedHours || 0);
      setNotes(item.notes || "");
      setCompleted(item.completed || false);
    }
    setDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId: number) => {
    // Implement the logic to delete a category
    console.log(`Delete category ${categoryId}`);
  };

  const handleDeleteActivity = (activityId: number) => {
    // Implement the logic to delete an activity
    console.log(`Delete activity ${activityId}`);
  };

  return (
    <div className="w-full">
      <main className="min-h-[90vh] flex items-start">
        <div className="md:w-5/6 w-full h-full p-6">
          <div className="p-4">
            <h2 className="text-lg font-bold">
              Select a project to view categories and activities
            </h2>

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
                        <div className="grow px-2 cursor-pointer flex items-center">
                          <span
                            className="text-sm text-gray-800"
                            onClick={() =>
                              handleEditDialog("category", category)
                            }
                          >
                            {category.categoryName}
                          </span>

                          <button
                            className="text-red-500 hover:text-red-700 ml-2"
                            onClick={() =>
                              handleDeleteCategory(category.categoryId)
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
                                className="py-1 px-2 cursor-pointer hover:bg-gray-50"
                              >
                                <span
                                  className="text-sm text-gray-800"
                                  onClick={() =>
                                    handleEditDialog("activity", activity)
                                  }
                                >
                                  {activity.activityName}
                                </span>
                                <button
                                  className="text-red-500 hover:text-red-700 ml-2"
                                  onClick={() =>
                                    handleDeleteActivity(activity.activityId)
                                  }
                                >
                                  x
                                </button>
                              </div>
                            ))}
                            {/* Add New Activity */}
                            <div
                              className="py-1 px-2 cursor-pointer"
                              onClick={() =>
                                handleOpenDialog(
                                  "activity",
                                  category.categoryId
                                )
                              }
                            >
                              <span className="text-sm text-blue-500 underline">
                                Add new activity
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
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
                {dialogType === "category"
                  ? "Add New Category"
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
                      onChange={(e) =>
                        setEstimatedHours(Number(e.target.value))
                      }
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
        </div>
      </main>
    </div>
  );
}
