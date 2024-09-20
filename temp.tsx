"use client";

import React, { useState, useEffect } from "react";
import SideNav from "../components/SideNav";
import {
  APICategory,
  Category,
  APIActivity,
  Activity,
  Project,
} from "../../../types";

interface TreeViewDataResponse {
  message: string;
  treeViewData: APICategory[];
}

const ActivitiesPage = () => {
  const [projectList, setProjectList] = useState<Project[]>([]); // Explicit use of Project type
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState<number | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch project list here (you can adjust this if needed)
    const fetchProjects = async () => {
      const res = await fetch("/api/projects"); // Adjust endpoint
      const data = await res.json();
      setProjectList(data.projects); // Assuming your API returns { projects: [...] }
    };

    fetchProjects();
  }, []);

  // Fetch the categories and activities for the selected project
  useEffect(() => {
    if (selectedProject) {
      const fetchCategoriesAndActivities = async () => {
        const res = await fetch(
          `/api/getTreeViewData?projectId=${selectedProject}`
        );
        const data: { treeViewData: APICategory[] } = await res.json();

        // Assuming data is in the format: [{ parent: Category, children: [Activity] }]
        const fetchedCategories = data.treeViewData.map((categoryItem) => ({
          id: categoryItem.categoryId, // Use the correct field name from the API
          name: categoryItem.categoryName,
          projectId: String(selectedProject),
          sortOrder: categoryItem.sortOrder,
          // Convert the activities from APIActivity[] to Activity[]
          activities: (categoryItem.activities as unknown as APIActivity[]).map(
            (activity: APIActivity): Activity => ({
              id: activity.activityId, // Convert from API field to Activity field
              name: activity.activityName, // Convert from API field to Activity field
              sortOrder: activity.activitySortOrder, // Convert from API field to Activity field
              estimatedHours: activity.estimatedHours,
              notes: activity.notes,
              completed: activity.completed,
              categoryId: activity.categoryId, // Ensure categoryId is also mapped
              createdAt: activity.createdAt, // Optional field
              updatedAt: activity.updatedAt, // Optional field
            })
          ),
        }));

        setCategories(fetchedCategories);
      };

      fetchCategoriesAndActivities();
    }
  }, [selectedProject]);

  // Function to handle adding a category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject,
          name: categoryName,
          sortOrder: categorySortOrder,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      setCategoryName("");
      setCategorySortOrder(null);
      setLoading(false);
      // Refetch categories after adding a new one
      const fetchCategoriesAndActivities = async () => {
        const res = await fetch(
          `/api/getTreeViewData?projectId=${selectedProject}`
        );
        const data: TreeViewDataResponse = await res.json(); // Specify the expected response type

        // Assuming data is in the format: [{ parent: Category, children: [Activity] }]
        const fetchedCategories = data.treeViewData.map((categoryItem) => ({
          id: categoryItem.id,
          name: categoryItem.name,
          projectId: String(selectedProject),
          sortOrder: categoryItem.sortOrder,
          activities: categoryItem.activities || [], // Ensure activities is always an array
        }));

        setCategories(fetchedCategories);
      };
      fetchCategoriesAndActivities();
    } catch (err) {
      console.error("Error adding category:", err);
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    const selectedCategory = categories.find(
      (category) => category.id === categoryId
    );
    setActivities(selectedCategory?.activities || []);
  };

  const handleActivityChange = (
    categoryIndex: number,
    activityIndex: number,
    field: string,
    value: any
  ) => {
    // Create a shallow copy of categories
    const updatedCategories = [...categories];

    // Ensure the category exists at the given index
    const selectedCategory = updatedCategories[categoryIndex];
    if (!selectedCategory) {
      console.error(`Category at index ${categoryIndex} does not exist.`);
      return;
    }

    // Ensure that the activities array exists
    selectedCategory.activities = selectedCategory.activities || [];

    // Ensure the activity exists at the given index
    const selectedActivity = selectedCategory.activities[activityIndex];
    if (!selectedActivity) {
      console.error(
        `Activity at index ${activityIndex} does not exist in category ${categoryIndex}.`
      );
      return;
    }

    // Update the activity in the specific category
    selectedCategory.activities[activityIndex] = {
      ...selectedActivity,
      [field]: value,
    };

    // Update the state with the modified categories
    setCategories(updatedCategories);
  };

  const addActivity = (categoryIndex: number) => {
    const updatedCategories = [...categories];

    // Ensure that the category's activities array exists
    if (!updatedCategories[categoryIndex].activities) {
      updatedCategories[categoryIndex].activities = []; // Initialize as an empty array if undefined
    }

    // Assert that activities is not undefined from this point onward
    (updatedCategories[categoryIndex].activities as Activity[]).push({
      name: "",
      sortOrder: 0,
      estimatedHours: 0,
      completed: false,
      categoryId: String(updatedCategories[categoryIndex].id),
    });

    setCategories(updatedCategories); // Update the state with the new activity
  };

  return (
    <div className="w-full">
      <main className="min-h-[90vh] flex items-start">
        <SideNav />

        <div className="md:w-5/6 w-full h-full p-6">
          <h2 className="text-2xl font-bold">Categories & Activities</h2>
          <p className="opacity-70 mb-4">
            Select a project and manage its categories and activities
          </p>

          <div className="mb-4">
            <label className="block mb-2">Select Project</label>
            <select
              className="w-full p-2 border border-gray-200 rounded-sm"
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

          {selectedProject && (
            <>
              <div className="mb-4">
                <label className="block mb-2">Select Category</label>
                <select
                  className="w-full p-2 border border-gray-200 rounded-sm"
                  value={selectedCategory || ""}
                  onChange={(e) => handleCategorySelect(Number(e.target.value))}
                >
                  <option key="default" value="">
                    -- Select a Category --
                  </option>
                  {categories.map((category) => {
                    return (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <form
                className="w-full"
                onSubmit={handleAddCategory}
                method="POST"
              >
                <div className="w-full flex items-center space-x-4 mb-3">
                  <section className="w-1/2">
                    <label>Category Name</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-200 rounded-sm"
                      value={categoryName}
                      required
                      onChange={(e) => setCategoryName(e.target.value)}
                    />
                  </section>

                  <section className="w-1/2">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-200 rounded-sm"
                      value={categorySortOrder || ""}
                      onChange={(e) =>
                        setCategorySortOrder(Number(e.target.value))
                      }
                    />
                  </section>
                </div>

                <h3 className="text-xl font-bold">Activities</h3>
                {categories.map((category, categoryIndex) => (
                  <div key={category.id}>
                    <h3 className="text-lg font-bold">{category.name}</h3>

                    {category.activities && category.activities.length > 0 ? (
                      category.activities.map((activity, activityIndex) => (
                        <div
                          key={activity.id}
                          className="w-full flex items-center space-x-4 mb-3"
                        >
                          <section className="w-1/3">
                            <label>Activity Name</label>
                            <input
                              type="text"
                              className="w-full p-2 border border-gray-200 rounded-sm"
                              value={activity.name}
                              required
                              onChange={(e) =>
                                handleActivityChange(
                                  categoryIndex,
                                  activityIndex,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                          </section>

                          <section className="w-1/3">
                            <label>Sort Order</label>
                            <input
                              type="number"
                              className="w-full p-2 border border-gray-200 rounded-sm"
                              value={activity.sortOrder || ""}
                              onChange={(e) =>
                                handleActivityChange(
                                  categoryIndex,
                                  activityIndex,
                                  "sortOrder",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </section>

                          <section className="w-1/3">
                            <label>Estimated Hours</label>
                            <input
                              type="number"
                              className="w-full p-2 border border-gray-200 rounded-sm"
                              value={activity.estimatedHours || ""}
                              onChange={(e) =>
                                handleActivityChange(
                                  categoryIndex,
                                  activityIndex,
                                  "estimatedHours",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </section>
                        </div>
                      ))
                    ) : (
                      <p>
                        No activities added yet. Use the button below to add
                        some.
                      </p>
                    )}

                    <button
                      type="button"
                      className="bg-gray-500 text-white p-2 rounded-md mb-6"
                      onClick={() => addActivity(categoryIndex)}
                    >
                      Add Activity
                    </button>
                  </div>
                ))}

                <button
                  className="bg-blue-500 text-white p-2 rounded-md mb-6"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Category"}
                </button>
              </form>
            </>
          )}

          {selectedProject && (
            <div>
              <h3 className="text-xl font-bold mt-6">Existing Categories</h3>
              {categories.map((category) => (
                <div key={category.id}>
                  <h4 className="text-lg font-bold">{category.name}</h4>
                  <ul>
                    {category.activities && category.activities.length > 0 ? (
                      category.activities.map((activity) => (
                        <li key={activity.id}>{activity.name}</li>
                      ))
                    ) : (
                      <li>No activities added yet.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ActivitiesPage;
