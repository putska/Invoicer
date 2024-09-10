import {
  invoicesDB,
  customersDB,
  bankInfoDB,
  projectsDB,
  categoriesDB,
  activitiesDB,
  manpowerDB,
  averageManpowerDB,
} from ".";
import {
  invoicesTable,
  customersTable,
  bankInfoTable,
  projects,
  categories,
  activities,
  manpower,
} from "./schema";
import { Customer, Project, Activity, Category } from "../../../types";
import { desc, eq, and, inArray, sql } from "drizzle-orm";

import { act } from "react";

//👇🏻 add a new row to the invoices table
export const createInvoice = async (invoice: any) => {
  await invoicesDB.insert(invoicesTable).values({
    owner_id: invoice.user_id,
    customer_id: invoice.customer_id,
    title: invoice.title,
    items: invoice.items,
    total_amount: invoice.total_amount,
  });
};

//👇🏻 get all user's invoices
export const getUserInvoices = async (user_id: string) => {
  return await invoicesDB
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.owner_id, user_id))
    .orderBy(desc(invoicesTable.created_at));
};

//👇🏻 get single invoice
export const getSingleInvoice = async (id: number) => {
  return await invoicesDB
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, id));
};

//👇🏻 get customers list
export const getCustomers = async (user_id: string) => {
  return await customersDB
    .select()
    .from(customersTable)
    .where(eq(customersTable.owner_id, user_id))
    .orderBy(desc(customersTable.created_at));
};

//👇🏻 get single customer
export const getSingleCustomer = async (name: string) => {
  return await customersDB
    .select()
    .from(customersTable)
    .where(eq(customersTable.name, name));
};

//👇🏻 add a new row to the customers table
export const addCustomer = async (customer: Customer) => {
  await customersDB.insert(customersTable).values({
    owner_id: customer.user_id,
    name: customer.name,
    email: customer.email,
    address: customer.address,
  });
};

//👇🏻 delete a customer
export const deleteCustomer = async (id: number) => {
  await customersDB.delete(customersTable).where(eq(customersTable.id, id));
};

//👇🏻 get user's bank info
export const getUserBankInfo = async (user_id: string) => {
  return await bankInfoDB
    .select()
    .from(bankInfoTable)
    .where(eq(bankInfoTable.owner_id, user_id));
};

//👇🏻 update bank info table
export const updateBankInfo = async (info: any) => {
  await bankInfoDB
    .insert(bankInfoTable)
    .values({
      owner_id: info.user_id,
      bank_name: info.bank_name,
      account_number: info.account_number,
      account_name: info.account_name,
      currency: info.currency,
    })
    .onConflictDoUpdate({
      target: bankInfoTable.owner_id,
      set: {
        bank_name: info.bank_name,
        account_number: info.account_number,
        account_name: info.account_name,
        currency: info.currency,
      },
    });
};

//👇🏻 get projects list
export const getProjects = async () => {
  return await projectsDB
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt));
};

//👇🏻 get single project
export const getSingleProject = async (name: string) => {
  return await projectsDB
    .select()
    .from(projects)
    .where(eq(projects.name, name));
};

//👇🏻 add a new row to the projects table
export const addProject = async (project: Project) => {
  const [newProject] = await projectsDB
    .insert(projects)
    .values({
      name: project.name,
      description: project.description || "",
      startDate: project.startDate,
      endDate: project.endDate || undefined,
      status: project.status || "active",
    })
    .returning({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      startDate: projects.startDate,
      endDate: projects.endDate,
      status: projects.status,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    }); // This returns the full inserted row

  return newProject;
};

// Get manpower data by project ID
export const getManpowerByProjectId = async (projectId: number) => {
  try {
    const result = await manpowerDB
      .select()
      .from(manpower)
      .where(eq(manpower.id, projectId)); // Assuming you have projectId in manpower table
    return result;
  } catch (error) {
    console.error("Error fetching manpower:", error);
    throw new Error("Could not fetch manpower");
  }
};

// Fetch all manpower data
export const getAllManpower = async () => {
  try {
    const result = await manpowerDB.select().from(manpower);
    return result;
  } catch (error) {
    console.error("Error fetching manpower data:", error);
    throw new Error("Could not fetch manpower data.");
  }
};

// Add manpower data
export const addManpower = async (
  activityId: number,
  date: string,
  manpowerCount: number
) => {
  try {
    await manpowerDB.insert(manpower).values({
      activityId,
      date: date, // Ensure the date is passed correctly
      manpower: manpowerCount,
    });
    return { message: "Manpower data added successfully!" };
  } catch (error) {
    console.error("Error adding manpower:", error);
    throw new Error("Failed to add manpower data.");
  }
};

// Update manpower data
export const updateManpower = async (
  activityId: number,
  date: string,
  manpowerCount: number
) => {
  try {
    await manpowerDB
      .update(manpower)
      .set({ manpower: manpowerCount, updatedAt: new Date() })
      .where(and(eq(manpower.activityId, activityId), eq(manpower.date, date))); // Update based on activityId and date
    return { message: "Manpower data updated successfully!" };
  } catch (error) {
    console.error("Error updating manpower:", error);
    throw new Error("Failed to update manpower data.");
  }
};

//👇🏻 delete a project
export const deleteProject = async (id: number) => {
  return await projectsDB.delete(projects).where(eq(projects.id, id));
};

// Fetch all categories for a given project ID
// export const getCategoriesByProjectId = async (projectId: number) => {
//   try {
//     const result = await categoriesDB
//       .select()
//       .from(categories)
//       .where(eq(categories.projectId, projectId));
//     return result;
//   } catch (error) {
//     console.error("Error fetching categories:", error);
//     throw new Error("Could not fetch categories");
//   }
//};

// Fetch all activities for a given category ID
export const getActivitiesByCategoryId = async (categoryId: number) => {
  try {
    const result = await activitiesDB
      .select()
      .from(activities)
      .where(eq(activities.categoryId, categoryId));
    return result;
  } catch (error) {
    console.error("Error fetching activities:", error);
    throw new Error("Could not fetch activities");
  }
};

// Create a new category
export const createCategory = async (category: {
  projectId: number;
  name: string;
  sortOrder?: number;
}) => {
  try {
    // Insert the new activity and return the inserted record
    const [result] = await categoriesDB
      .insert(categories)
      .values({
        projectId: category.projectId,
        name: category.name,
        sortOrder: category.sortOrder,
      })
      .returning(); // Ensure this returns the inserted row

    return result; // Return the newly inserted activity
  } catch (error) {
    console.error("Error creating category:", error);
    throw new Error("Could not create category");
  }
};

// Update an existing category
export const updateCategory = async (
  categoryId: number,
  updatedData: Partial<{
    name: string;
    sortOrder?: number;
  }>
) => {
  try {
    const result = await categoriesDB
      .update(categories)
      .set(updatedData)
      .where(eq(categories.id, categoryId));
    return result;
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Could not update category");
  }
};

// Delete a category by ID
export const deleteCategory = async (categoryId: number) => {
  try {
    const result = await categoriesDB
      .delete(categories)
      .where(eq(categories.id, categoryId));
    return result;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Could not delete category");
  }
};

// Create a new activity
export const createActivity = async (activity: {
  categoryId: number;
  name: string;
  sortOrder?: number;
  estimatedHours?: number;
  notes?: string;
  completed?: boolean;
}) => {
  try {
    console.log("Activity Data:", activity); // Log the incoming activity data

    const [result] = await activitiesDB
      .insert(activities)
      .values({
        categoryId: activity.categoryId,
        name: activity.name,
        sortOrder: activity.sortOrder || 0,
        estimatedHours: activity.estimatedHours || 0,
        notes: activity.notes || "",
        completed: activity.completed || false,
      })
      .returning();

    console.log("Insert result:", result); // Log the result after the insert
    return result;
  } catch (error) {
    console.error("Error during activity creation:", error); // Log the error
    throw new Error("Could not create activity");
  }
};

// Update an existing activity
export const updateActivity = async (
  activityId: number,
  updatedData: Partial<{
    name: string;
    sortOrder?: number;
    estimatedHours?: number;
    notes?: string;
    completed?: boolean;
  }>
) => {
  try {
    const result = await activitiesDB
      .update(activities)
      .set(updatedData)
      .where(eq(activities.id, activityId));
    return result;
  } catch (error) {
    console.error("Error updating activity:", error);
    throw new Error("Could not update activity");
  }
};

// Delete an activity by ID
export const deleteActivity = async (activityId: number) => {
  try {
    const result = await activitiesDB
      .delete(activities)
      .where(eq(activities.id, activityId));
    return result;
  } catch (error) {
    console.error("Error deleting activity:", error);
    throw new Error("Could not delete activity");
  }
};

export const getTreeViewData = async (projectId: number) => {
  try {
    // Fetch categories using `inArray`
    const fetchedCategories = await categoriesDB
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(eq(categories.projectId, projectId)); // Use `eq` instead of `inArray`

    // Log the fetched categories
    console.log("Fetched categories with `inArray`:", fetchedCategories);

    // Get list of category IDs from the fetched categories
    const categoryIds = fetchedCategories.map(
      (category) => category.categoryId
    );

    // Fetch activities for the categories using `inArray`
    const fetchedActivities = categoryIds.length
      ? await categoriesDB
          .select({
            activityId: activities.id,
            activityName: activities.name,
            activitySortOrder: activities.sortOrder,
            estimatedHours: activities.estimatedHours,
            notes: activities.notes,
            completed: activities.completed,
            categoryId: activities.categoryId,
          })
          .from(activities)
          .where(inArray(activities.categoryId, categoryIds)) // Fetch activities for the fetched categories
      : [];

    // Combine categories and activities, ensuring categories without activities are included
    const result = fetchedCategories.map((category) => ({
      ...category,
      activities: fetchedActivities.filter(
        (activity) => activity.categoryId === category.categoryId
      ),
    }));
    console.log("Result:", result);
    // Ensure categories without activities return an empty array for `activities`
    return result.map((category) => ({
      ...category,
      activities: category.activities || [], // Return an empty array if no activities
    }));
  } catch (error) {
    console.error("Error fetching categories with activities:", error);
    throw new Error("Could not fetch categories with activities");
  }
};

// Function to get the average manpower by month and year
export async function getAverageManpowerByMonthAndYear() {
  try {
    const query = sql`
      SELECT 
        p.id AS project_id,
        p.name AS project_name,
        EXTRACT(YEAR FROM m.date) AS year,
        EXTRACT(MONTH FROM m.date) AS month,
        AVG(m.manpower) AS average_manpower
      FROM 
        ${projects} p
      JOIN 
        ${categories} c ON p.id = c.project_id
      JOIN 
        ${activities} a ON c.id = a.category_id
      JOIN 
        ${manpower} m ON a.id = m.activity_id
      GROUP BY 
        p.id, p.name, year, month
      ORDER BY 
        p.id, year, month;
    `;

    const result = await projectsDB.execute(query);

    // Map the results to plain objects
    const mappedResults = result.rows.map((row) => ({
      project_id: row.project_id,
      project_name: row.project_name,
      year: row.year,
      month: row.month,
      average_manpower: row.average_manpower,
    }));

    return mappedResults;
  } catch (error) {
    console.error("Error fetching average manpower:", error);
    throw new Error("Could not fetch average manpower");
  }
}
