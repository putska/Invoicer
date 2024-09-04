"use client";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import SideNav from "@/app/components/SideNav";

interface Activity {
  name: string;
  sortOrder?: number;
  estimatedHours?: number;
  notes?: string;
}

interface Category {
  id: number;
  name: string;
  sortOrder?: number;
  activities: Activity[];
}

interface Project {
  id: number;
  name: string;
}

export default function CategoriesAndActivities() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [categorySortOrder, setCategorySortOrder] = useState<
    number | undefined
  >();
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined
  >();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects`);
      const data = await res.json();
      setProjectList(data.projects);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const res = await fetch(`/api/categories?projectId=${selectedProject}`);
      const data = await res.json();
      setCategories(data.categories);
    } catch (err) {
      console.log(err);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProjects();
    }
  }, [isLoaded, isSignedIn, fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      fetchCategories();
    }
  }, [selectedProject, fetchCategories]);

  const addActivity = () => {
    setActivities([
      ...activities,
      { name: "", sortOrder: activities.length + 1 },
    ]);
  };

  const handleActivityChange = (index: number, field: string, value: any) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
  };

  const createCategory = async () => {
    if (!selectedProject) {
      alert("Please select a project before adding a category.");
      return;
    }

    setLoading(true);
    try {
      const request = await fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProject,
          name: categoryName,
          sortOrder: categorySortOrder,
          activities,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const response = await request.json();
      alert(response.message);
      setCategoryName("");
      setCategorySortOrder(undefined);
      setActivities([]);
      fetchCategories(); // Refresh the categories list
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setCategoryName(category.name);
      setCategorySortOrder(category.sortOrder);
      setActivities(category.activities || []);
    }
    setSelectedCategory(categoryId);
  };

  const handleAddCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createCategory();
  };

  if (!isLoaded || !isSignedIn) {
    return <p>Loading...</p>;
  }

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
              value={selectedProject}
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
                  value={selectedCategory}
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
                  onClick={addActivity}
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
                    {category.activities && activities.length > 0 ? (
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
}
