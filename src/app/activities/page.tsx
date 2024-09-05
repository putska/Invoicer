"use client";

import React, { useState, useEffect } from "react";
import SideNav from "../components/SideNav";
import { Category, Activity, Project } from "../../../types";

interface TreeViewDataResponse {
  message: string;
  treeViewData: Category[];
}

const ActivitiesPage = () => {
  const [projectList, setProjectList] = useState([]);
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
        const data: TreeViewDataResponse = await res.json(); // Specify the expected response type
        console.log("data from categories", data);
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
        console.log("data from categories", data);
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
    const updatedCategories = [...categories];

    // Ensure that the category's activities array exists
    if (!updatedCategories[categoryIndex].activities) {
      updatedCategories[categoryIndex].activities = []; // Initialize as an empty array if undefined
    }

    // Update the activity in the specific category
    updatedCategories[categoryIndex].activities[activityIndex] = {
      ...updatedCategories[categoryIndex].activities[activityIndex],
      [field]: value,
    };

    setCategories(updatedCategories); // Update the state with the modified categories
  };

  const addActivity = (categoryIndex: number) => {
    const updatedCategories = [...categories];

    // Ensure that the category's activities array exists
    if (!updatedCategories[categoryIndex].activities) {
      updatedCategories[categoryIndex].activities = []; // Initialize as an empty array if undefined
    }

    // Add a new empty activity to the selected category, including categoryId
    updatedCategories[categoryIndex].activities.push({
      name: "",
      sortOrder: 0,
      estimatedHours: 0,
      completed: false,
      categoryId: String(updatedCategories[categoryIndex].id), // Ensure categoryId is assigned
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
                  <option value="">-- Select a Category --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
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
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <div
                      key={index}
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
                            handleActivityChange(index, "name", e.target.value)
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
                              index,
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
                              index,
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
                    No activities added yet. Use the button below to add some.
                  </p>
                )}

                <button
                  type="button"
                  className="bg-gray-500 text-white p-2 rounded-md mb-6"
                  onClick={() =>
                    addActivity(
                      categories.findIndex((c) => c.id === selectedCategory)
                    )
                  }
                >
                  Add Activity
                </button>

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
              {categories.map((category, index) => (
                <div key={index}>
                  <h4 className="text-lg font-bold">{category.name}</h4>
                  <ul>
                    {category.activities && category.activities.length > 0 ? (
                      category.activities.map((activity, actIndex) => (
                        <li key={actIndex}>{activity.name}</li>
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
