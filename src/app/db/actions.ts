import { db } from "./lib/drizzle";
import {
  invoicesTable,
  customersTable,
  bankInfoTable,
  projects,
  categories,
  activities,
  manpower,
  users,
} from "./schema";
import { Customer, Project, Activity, Category, User } from "../../../types";
import { desc, eq, and, inArray, sql } from "drizzle-orm";

import { act } from "react";

//👇🏻 add a new row to the invoices table
export const createInvoice = async (invoice: any) => {
  await db.insert(invoicesTable).values({
    owner_id: invoice.user_id,
    customer_id: invoice.customer_id,
    title: invoice.title,
    items: invoice.items,
    total_amount: invoice.total_amount,
  });
};

//👇🏻 get all user's invoices
export const getUserInvoices = async (user_id: string) => {
  return await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.owner_id, user_id))
    .orderBy(desc(invoicesTable.created_at));
};

//👇🏻 get single invoice
export const getSingleInvoice = async (id: number) => {
  return await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
};

//👇🏻 get customers list
export const getCustomers = async (user_id: string) => {
  return await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.owner_id, user_id))
    .orderBy(desc(customersTable.created_at));
};

//👇🏻 get single customer
export const getSingleCustomer = async (name: string) => {
  return await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.name, name));
};

//👇🏻 add a new row to the customers table
export const addCustomer = async (customer: Customer) => {
  await db.insert(customersTable).values({
    owner_id: customer.user_id,
    name: customer.name,
    email: customer.email,
    address: customer.address,
  });
};

//👇🏻 delete a customer
export const deleteCustomer = async (id: number) => {
  await db.delete(customersTable).where(eq(customersTable.id, id));
};

//👇🏻 get user's bank info
export const getUserBankInfo = async (user_id: string) => {
  return await db
    .select()
    .from(bankInfoTable)
    .where(eq(bankInfoTable.owner_id, user_id));
};

//👇🏻 update bank info table
export const updateBankInfo = async (info: any) => {
  await db
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
  return await db.select().from(projects).orderBy(desc(projects.createdAt));
};

//👇🏻 get single project
export const getSingleProject = async (projectId: string) => {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.id, Number(projectId)));
};

//👇🏻 add a new row to the projects table
export const addProject = async (project: Project) => {
  const [newProject] = await db
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

export const updateProject = async (
  projectId: number,
  updatedData: Partial<Project>
) => {
  try {
    // Exclude 'id' and 'createdAt' from updatedData
    const { id, createdAt, ...dataToUpdate } = updatedData;

    // Update 'updatedAt' to the current timestamp
    dataToUpdate.updatedAt = new Date();

    const result = await db
      .update(projects)
      .set(dataToUpdate)
      .where(eq(projects.id, projectId));
    return result;
  } catch (error) {
    console.error("Error updating project:", error);
    throw new Error("Could not update project");
  }
};

// Get manpower data by project ID
export const getManpowerByProjectId = async (projectId: number) => {
  try {
    const result = await db
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
    const result = await db.select().from(manpower);
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
    await db.insert(manpower).values({
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
    await db
      .update(manpower)
      .set({ manpower: manpowerCount, updatedAt: new Date() })
      .where(and(eq(manpower.activityId, activityId), eq(manpower.date, date))); // Update based on activityId and date
    return { message: "Manpower data updated successfully!" };
  } catch (error) {
    console.error("Error updating manpower:", error);
    throw new Error("Failed to update manpower data.");
  }
};

export const deleteManpower = async (activityId: number, date: string) => {
  return await db.delete(manpower).where(
    and(
      eq(manpower.activityId, activityId),
      eq(manpower.date, date) // Convert date string to Date object
    )
  );
};

//👇🏻 delete a project
export const deleteProject = async (id: number) => {
  return await db.delete(projects).where(eq(projects.id, id));
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
    const result = await db
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
    const [result] = await db
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
    const result = await db
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
    const result = await db
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
    const [result] = await db
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
    const result = await db
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
    const result = await db
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
    const fetchedCategories = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(eq(categories.projectId, projectId)); // Use `eq` instead of `inArray`

    // Get list of category IDs from the fetched categories
    const categoryIds = fetchedCategories.map(
      (category) => category.categoryId
    );

    // Fetch activities for the categories using `inArray`
    const fetchedActivities = categoryIds.length
      ? await db
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
      WITH per_project_per_day AS (
        SELECT
          p.id AS project_id,
          p.name AS project_name,
          EXTRACT(YEAR FROM m.date) AS year,
          EXTRACT(MONTH FROM m.date) AS month,
          m.date,
          SUM(m.manpower) AS total_manpower_on_day
        FROM
          ${projects} p
        LEFT JOIN 
          ${categories} c ON p.id = c.project_id
        LEFT JOIN 
          ${activities} a ON c.id = a.category_id
        LEFT JOIN 
          ${manpower} m ON a.id = m.activity_id
        GROUP BY
          p.id, p.name, m.date
      )
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        per_day.year,
        per_day.month,
        SUM(per_day.total_manpower_on_day) AS total_manpower,
        COUNT(DISTINCT per_day.date) AS days_with_manpower,
        COALESCE(
          SUM(per_day.total_manpower_on_day) / NULLIF(COUNT(DISTINCT per_day.date), 0),
          0
        )::FLOAT AS average_manpower_per_day_with_manpower
      FROM
        ${projects} p
      LEFT JOIN per_project_per_day per_day ON p.id = per_day.project_id
      GROUP BY
        p.id, p.name, per_day.year, per_day.month
      ORDER BY
        p.id, per_day.year, per_day.month;
    `;

    const result = await db.execute(query);

    // Map the results to plain objects
    const mappedResults = result.rows.map((row) => ({
      project_id: row.project_id,
      project_name: row.project_name,
      year: row.year,
      month: row.month,
      total_manpower: row.total_manpower || 0,
      days_with_manpower: row.days_with_manpower || 0,
      average_manpower_per_day_with_manpower:
        row.average_manpower_per_day_with_manpower || 0,
    }));

    return mappedResults;
  } catch (error) {
    console.error("Error fetching average manpower:", error);
    throw new Error("Could not fetch average manpower");
  }
}

// db/fieldMonitor.ts

export const getFieldMonitorData = async (projectId: number) => {
  const result = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      sortOrder: categories.sortOrder,
      activityId: activities.id,
      activityName: activities.name,
      estimatedHours: activities.estimatedHours,
      completed: activities.completed,
      notes: activities.notes,
    })
    .from(categories)
    .innerJoin(activities, eq(activities.categoryId, categories.id))
    .where(eq(categories.projectId, projectId))
    .orderBy(categories.sortOrder, activities.sortOrder);

  // Log the result to see the structure

  return result;
};

// Fetch a user by Clerk ID
export const getUserByClerkId = async (clerkId: string) => {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerk_id, clerkId))
      .limit(1)
      .execute();

    return user[0] || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Could not fetch user");
  }
};

// Fetch all users
export const getAllUsers = async () => {
  try {
    const result = await db.execute(sql`SELECT * from users`);
    console.log("SQL Select Users: ", result.rows);
    const allUsers = await db.select().from(users).execute();
    console.log("All Users: ", allUsers);
    //return allUsers;
    return result.rows;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Could not fetch users");
  }
};

// Update a user's permission level by userId (UUID)
export const updateUserPermission = async (
  userId: string,
  permissionLevel: string
): Promise<void> => {
  try {
    await db
      .update(users)
      .set({ permission_level: permissionLevel })
      .where(eq(users.id, userId))
      .execute();
  } catch (error) {
    console.error("Error updating user permission:", error);
    throw new Error("Could not update user permission");
  }
};

// Create a new user
export const createUser = async (userData: {
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  permission_level: string;
}) => {
  try {
    const [newUser] = await db
      .insert(users)
      .values({
        clerk_id: userData.clerk_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        permission_level: "read",
      })
      .returning();

    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Could not create user");
  }
};
