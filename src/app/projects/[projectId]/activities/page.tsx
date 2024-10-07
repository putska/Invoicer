"use client";

import * as React from "react";
import { useCallback, useState, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import { PermissionContext } from "../../../../context/PermissionContext";
import { FaEdit, FaTrash, FaList } from "react-icons/fa"; // Ensure these are imported if used elsewhere
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Equipment,
  CategorySortOrderUpdate,
  ActivitySortOrderUpdate,
} from "../../../../../types";

interface Category {
  categoryId: number;
  categoryName: string;
  sortOrder: number;
  activities: Activity[];
}

interface Activity {
  activityId: number; // from the combined query
  activityName: string; // from the combined query
  sortOrder: number;
  estimatedHours: number;
  notes: string;
  completed: boolean;
  categoryId: number; // from the combined query
  equipmentId: number | null; // Nullable field if no equipment is assigned
  equipmentName?: string | null; // Optional field to hold the equipment name
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
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(
    undefined
  );
  const [projectName, setProjectName] = useState<string>("");
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
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const previousCategoriesRef = useRef<Category[]>([]);

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
      if (Array.isArray(data.project) && data.project.length > 0) {
        const project = data.project[0];
        setCurrentProject(project);
        setProjectName(project.name);
      }
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

          // Ensure data.treeViewData is an array
          if (!Array.isArray(data.treeViewData)) {
            throw new Error(
              "Invalid data format: Expected an array of categories"
            );
          }

          // Sort categories by sortOrder
          const sortedCategories: Category[] = data.treeViewData
            .slice() // Create a shallow copy to avoid mutating the original data
            .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder)
            .map((category: Category) => ({
              ...category,
              // Sort activities within each category by sortOrder
              activities: category.activities
                .slice() // Create a shallow copy of activities
                .sort((a: Activity, b: Activity) => a.sortOrder - b.sortOrder),
            }));

          setCategories(sortedCategories);
          console.log("Categories and activities:", sortedCategories);
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
      setProjectName(project?.name || "");
      console.log("Current project name:", projectName);
    }
  }, [projectId, projects]);

  // Store a reference to the previous state
  useEffect(() => {
    previousCategoriesRef.current = categories;
  }, [categories]);

  // Fetch equipment based on projectId
  const fetchEquipment = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/equipment?projectId=${projectId}`);
      const data = await res.json();
      setEquipmentList(data.equipment);
    } catch (err) {
      console.log(err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  // Helper function to get the next sortOrder for categories
  const getNextCategorySortOrder = (categories: Category[]): number => {
    if (categories.length === 0) return 0;
    return Math.max(...categories.map((cat) => cat.sortOrder)) + 1;
  };

  // Helper function to get the next sortOrder for activities within a category
  const getNextActivitySortOrder = (activities: Activity[]): number => {
    if (activities.length === 0) return 0;
    return Math.max(...activities.map((act) => act.sortOrder)) + 1;
  };

  const handleSubmit = async () => {
    try {
      if (dialogType === "activity" && categoryToAddTo !== null) {
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
                equipmentId: selectedEquipment?.id || null, // Ensure this is a number or null
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
                              equipmentId: selectedEquipment?.id || null, // Fix this to a number
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
              equipmentId: selectedEquipment?.id || null, // Use id for equipmentId
              notes,
              completed,
            }),
            headers: { "Content-Type": "application/json" },
          });
          const { newActivity } = await res.json();
          console.log("New activity:", newActivity);
          setCategories((prevCategories) =>
            prevCategories.map((cat) =>
              cat.categoryId === categoryToAddTo
                ? {
                    ...cat,
                    activities: [
                      ...cat.activities,
                      {
                        activityId: newActivity.activityId,
                        categoryId: categoryToAddTo,
                        activityName: newActivity.activityName,
                        sortOrder: newActivity.sortOrder || 0,
                        estimatedHours: newActivity.estimatedHours || 0,
                        equipmentId: newActivity.equipmentId || null, // Use the correct type
                        equipmentName: newActivity.equipmentName || null,
                        notes: newActivity.notes || "",
                        completed: newActivity.completed || false,
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
      setSelectedEquipment(null);
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
      setSelectedEquipment(null);
      setCategoryToAddTo(null);
    } else if (type === "activity") {
      setCurrentItemId(item.activityId);
      setNewItemName(item.activityName);
      setNewSortOrder(item.sortOrder || 0);
      setEstimatedHours(item.estimatedHours || 0);
      setNotes(item.notes || "");
      setCompleted(item.completed || false);
      setCategoryToAddTo(parentCategoryId || null);

      // Set selectedEquipment to the currently assigned equipment
      if (item.equipmentId) {
        const selected =
          equipmentList.find(
            (equipment) => equipment.id === item.equipmentId
          ) || null;
        setSelectedEquipment(selected);
      } else {
        setSelectedEquipment(null);
      }
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

  //const handleEquipmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //  const selectedId = Number(e.target.value);
  //  const selected =
  //    equipmentList.find((equipment) => equipment.id === selectedId) || null;
  //  setSelectedEquipment(selected);
  //};

  const handleEquipmentChange = (value: string) => {
    const selected =
      equipmentList.find((equipment) => equipment.id === Number(value)) || null;
    setSelectedEquipment(selected); // Set the full Equipment object or null
  };

  // handleDragEnd.js or within your component
  const handleDragEnd = async (result: any) => {
    // Replace 'any' with your DropResult type if available
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    // Clone the current state
    const newCategories = Array.from(categories);

    // Store the previous state for potential reversion
    const previousCategories = previousCategoriesRef.current;

    let updatedCategories: CategorySortOrderUpdate[] = [];
    let updatedActivities: ActivitySortOrderUpdate[] = [];

    if (type === "CATEGORY") {
      // Reordering categories
      const [movedCategory] = newCategories.splice(source.index, 1);
      newCategories.splice(destination.index, 0, movedCategory);

      // Update sortOrder based on new index
      updatedCategories = newCategories.map((category, index) => ({
        categoryId: category.categoryId,
        sortOrder: index,
      }));

      // Optimistically update the state
      setCategories(newCategories);
    } else if (type === "ACTIVITY") {
      // Moving activities within or between categories
      const sourceCategoryId = parseInt(
        source.droppableId.replace("activities-", ""),
        10
      );
      const destCategoryId = parseInt(
        destination.droppableId.replace("activities-", ""),
        10
      );

      const sourceCategoryIndex = newCategories.findIndex(
        (cat) => cat.categoryId === sourceCategoryId
      );
      const destCategoryIndex = newCategories.findIndex(
        (cat) => cat.categoryId === destCategoryId
      );

      if (sourceCategoryIndex === -1 || destCategoryIndex === -1) {
        console.error("Invalid category IDs");
        return;
      }

      const sourceCategory = newCategories[sourceCategoryIndex];
      const destCategory = newCategories[destCategoryIndex];

      const sourceActivities = Array.from(sourceCategory.activities);
      const [movedActivity] = sourceActivities.splice(source.index, 1);

      if (sourceCategoryId === destCategoryId) {
        // Reordering within the same category
        sourceActivities.splice(destination.index, 0, movedActivity);

        // Update sortOrder for activities within the source category
        updatedActivities = sourceActivities.map((activity, index) => ({
          activityId: activity.activityId,
          sortOrder: index,
          // categoryId remains unchanged
        }));

        // Update the activities in the category
        newCategories[sourceCategoryIndex].activities = sourceActivities;
      } else {
        // Moving to a different category
        movedActivity.categoryId = destCategoryId;
        const destActivities = Array.from(destCategory.activities);
        destActivities.splice(destination.index, 0, movedActivity);

        // Update sortOrder for activities in both source and destination categories
        const updatedSourceActivities = sourceActivities.map(
          (activity, index) => ({
            activityId: activity.activityId,
            sortOrder: index,
            // categoryId remains unchanged
          })
        );

        const updatedDestActivities = destActivities.map((activity, index) => ({
          activityId: activity.activityId,
          sortOrder: index,
          categoryId: destCategoryId,
        }));

        // Update the activities in both categories
        newCategories[sourceCategoryIndex].activities = sourceActivities;
        newCategories[destCategoryIndex].activities = destActivities;

        updatedActivities = [
          ...updatedSourceActivities,
          ...updatedDestActivities,
        ];
      }

      // Optimistically update the state
      setCategories(newCategories);
    }

    try {
      // Send the combined update to the backend
      const response = await fetch("/api/activities/updateSortOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categories: updatedCategories,
          activities: updatedActivities,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update sort order");
      }

      // Optionally, handle success (e.g., show a notification)
    } catch (error: any) {
      // Type as 'any' to access error.message
      console.error("Error updating sort order:", error);
      // Revert to the previous state
      setCategories(previousCategories);
      alert("Failed to update sort order. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <main className="min-h-[90vh] flex items-start">
        <div className="md:w-5/6 w-full h-full p-6">
          <div className="p-4">
            {currentProject ? (
              <h1 className="text-2xl font-semibold mb-4">
                Categories and activities for {projectName}
              </h1>
            ) : (
              <p className="text-gray-500 mb-4">
                Loading project information...
              </p>
            )}

            {/* Categories and Activities */}

            {projectId && (
              <DragDropContext onDragEnd={handleDragEnd}>
                {/* Draggable Categories */}
                <Droppable droppableId="categories" type="CATEGORY">
                  {(provided) => (
                    <div
                      className="hs-accordion-treeview-root"
                      role="tree"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {/* Render categories sorted by sortOrder */}
                      {categories
                        .slice() // create a shallow copy to avoid mutating sate
                        .sort((a, b) => a.sortOrder - b.sortOrder) // Sort by sortOrder
                        .map((category, index) => (
                          <Draggable
                            key={category.categoryId}
                            draggableId={`category-${category.categoryId}`}
                            index={index}
                            isDragDisabled={!hasWritePermission}
                          >
                            {(provided) => (
                              <div
                                className="hs-accordion"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <div
                                  className="hs-accordion-heading py-1 flex items-center gap-x-0.5"
                                  {...provided.dragHandleProps}
                                >
                                  {/* Drag handle with FaList Icon */}
                                  <FaList className="text-gray-400 mr-2" />
                                  {/* Expand/Collapse Button */}
                                  <button
                                    className="hs-accordion-toggle w-4 h-4 flex justify-center items-center hover:bg-gray-100 rounded-md"
                                    onClick={() =>
                                      toggleCategory(category.categoryId)
                                    }
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
                                          expandedCategories[
                                            category.categoryId
                                          ]
                                            ? "hidden"
                                            : ""
                                        }
                                        d="M12 5v14"
                                      />
                                    </svg>
                                  </button>
                                  <div className="grow px-2 flex items-center">
                                    <span
                                      className={`text-lg text-gray-800 
                          ${
                            hasWritePermission
                              ? "hover:text-blue-700 cursor-pointer "
                              : "cursor-not-allowed text-gray-400"
                          }`}
                                      onClick={() =>
                                        hasWritePermission
                                          ? handleEditDialog(
                                              "category",
                                              category
                                            )
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
                                          ? handleDeleteCategory(
                                              category.categoryId
                                            )
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

                                {/* Activities */}
                                {expandedCategories[category.categoryId] && (
                                  <Droppable
                                    droppableId={`activities-${category.categoryId}`}
                                    type="ACTIVITY"
                                  >
                                    {(provided) => (
                                      <div
                                        className="hs-accordion-content w-full"
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                      >
                                        <div className="ps-7">
                                          {/* Render activities */}
                                          {category.activities
                                            .slice() // create a shallow copy to avoid mutating state
                                            .sort(
                                              (a, b) =>
                                                a.sortOrder - b.sortOrder
                                            ) // Sort by sortOrder
                                            .map((activity, index) => (
                                              <Draggable
                                                key={activity.activityId}
                                                draggableId={`activity-${activity.activityId}`}
                                                index={index}
                                                isDragDisabled={
                                                  !hasWritePermission
                                                }
                                              >
                                                {(provided) => (
                                                  <div
                                                    className="py-1 px-2 cursor-pointer hover:bg-gray-50 flex items-center"
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                  >
                                                    <FaList className="text-gray-400 mr-2" />
                                                    <span
                                                      className={`text-lg text-gray-800 ${
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
                                                      {activity.activityName
                                                        ? activity.activityName
                                                        : "Unnamed Activity"}
                                                    </span>
                                                    {activity.equipmentId && (
                                                      <span className="ml-2 text-lg text-gray-500">
                                                        (
                                                        {
                                                          equipmentList.find(
                                                            (e) =>
                                                              e.id ===
                                                              activity.equipmentId
                                                          )?.equipmentName
                                                        }
                                                        )
                                                      </span>
                                                    )}
                                                    <button
                                                      className={`text-red-500 hover:text-red-700 ml-2 ${
                                                        !hasWritePermission
                                                          ? "cursor-not-allowed opacity-50"
                                                          : ""
                                                      }`}
                                                      onClick={() => {
                                                        if (
                                                          hasWritePermission &&
                                                          activity.activityId !==
                                                            undefined
                                                        ) {
                                                          handleDeleteActivity(
                                                            activity.activityId
                                                          );
                                                        }
                                                      }}
                                                      disabled={
                                                        !hasWritePermission
                                                      }
                                                      aria-disabled={
                                                        !hasWritePermission
                                                      }
                                                      title={
                                                        hasWritePermission
                                                          ? "Delete Activity"
                                                          : "You do not have permission to delete activities"
                                                      }
                                                    >
                                                      x
                                                    </button>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                          {provided.placeholder}
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
                                              className={`text-lg text-blue-500 underline 
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
                                              aria-disabled={
                                                !hasWritePermission
                                              }
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
                                  </Droppable>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
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
                          className={`text-lg text-blue-500 underline 
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
                      <button
                        onClick={() => router.back()}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Back to Projects
                      </button>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
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
                    {/* Dropdown for selecting equipment */}
                    <TextField
                      select
                      label="Equipment"
                      value={selectedEquipment?.id || ""} // Make sure the value is correctly set
                      onChange={(e) => handleEquipmentChange(e.target.value)} // Handle change
                      fullWidth
                      disabled={!hasWritePermission}
                    >
                      {/* Option for no equipment */}
                      <MenuItem value="">None</MenuItem>

                      {/* Map over the equipment list */}
                      {equipmentList.map((equipment) => (
                        <MenuItem key={equipment.id} value={equipment.id}>
                          {equipment.equipmentName}
                        </MenuItem>
                      ))}
                    </TextField>

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
