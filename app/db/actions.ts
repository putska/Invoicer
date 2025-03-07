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
  equipment,
  laborSnapshots,
  vendors,
  purchaseOrders,
  attachments,
  laborData,
  materials,
  requests,
  tokens,
  forms,
  parts,
  stockLengths,
  optimizationJobs,
  cutPatterns,
  cuts,
  panels,
  panelSheets,
  panelJobs,
  panelPlacements,
  usedSheets,
} from "./schema";
import {
  Customer,
  Project,
  Activity,
  Category,
  User,
  Equipment,
  CategorySortOrderUpdate,
  ActivitySortOrderUpdate,
  Vendor,
  PurchaseOrder,
  LaborData,
  Material,
  Requisition,
  FormSubmission,
  Part,
  CutPatternItem,
  OptimizationResult,
  ExtListItem,
} from "../types";
import { desc, eq, and, inArray, sql, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Dropbox } from "dropbox";
import { getDropboxClient } from "../modules/dropbox/dropboxClient";
import {
  Panel,
  Sheet,
  PanelOptimizationResult,
} from "../components/panelOptimization";

//import fetch from "node-fetch";

//import { v4 as uuidv4 } from "uuid";

import { act } from "react";
import { access } from "fs";

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
  return await db
    .select()
    .from(projects)
    // .where(eq(projects.status, "active"))
    .orderBy(desc(projects.createdAt));
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
      jobNumber: project.jobNumber,
      description: project.description || "",
      startDate: project.startDate,
      endDate: project.endDate || undefined,
      status: project.status || "active",
    })
    .returning({
      id: projects.id,
      name: projects.name,
      jobNumber: projects.jobNumber,
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

//Fetch all categories for a given project ID
export const getCategoriesByProjectId = async (projectId: number) => {
  try {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.projectId, projectId));
    return result;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Could not fetch categories");
  }
};

/**
 * Fetch a category by its ID
 * @param categoryId - The ID of the category to fetch
 * @returns The category if found, otherwise null
 */
export const getCategoryById = async (
  categoryId: number
): Promise<Category | null> => {
  try {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    return result.length > 0
      ? {
          ...result[0],
          createdAt: result[0].createdAt.toISOString(),
          updatedAt: result[0].updatedAt.toISOString(),
        }
      : null;
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    throw new Error("Could not fetch category");
  }
};

/**
 * Fetch a category by its ID
 * @param activityId - The ID of the activity to fetch
 * @returns The activity if found, otherwise null
 */
export const getActivityById = async (
  activityId: number
): Promise<Activity | null> => {
  try {
    const result = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    return result.length > 0
      ? {
          ...result[0],
          categoryId: result[0].categoryId.toString(),
          equipmentId: result[0].equipmentId
            ? result[0].equipmentId.toString()
            : undefined,
          costCode: result[0].costCode ?? "",
          estimatedHours: result[0].estimatedHours ?? undefined,
          notes: result[0].notes ?? undefined,
          createdAt: result[0].createdAt.toISOString(),
          updatedAt: result[0].updatedAt.toISOString(),
        }
      : null;
  } catch (error) {
    console.error("Error fetching activity by ID:", error);
    throw new Error("Could not fetch activity");
  }
};

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
export const createCategory = async (
  categoryData: Partial<Category>
): Promise<Category> => {
  try {
    const nextSortOrder = await getNextCategorySortOrder(
      categoryData.projectId!
    );

    const newCategory = await db
      .insert(categories)
      .values({
        projectId: categoryData.projectId!,
        name: categoryData.name!,
        sortOrder: nextSortOrder,
      })
      .returning();

    return {
      ...newCategory[0],
      createdAt: newCategory[0].createdAt.toISOString(),
      updatedAt: newCategory[0].updatedAt.toISOString(),
    };
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
      .where(eq(categories.id, categoryId))
      .returning();
    return result.length > 0 ? result[0] : null;
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
  costCode: string;
  equipmentId?: number | null;
  name: string;
  sortOrder?: number;
  estimatedHours?: number;
  notes?: string;
  completed?: boolean;
}) => {
  try {
    const newSortOrder = await getNextActivitySortOrder(activity.categoryId);
    const [result] = await db
      .insert(activities)
      .values({
        categoryId: activity.categoryId,
        costCode: activity.costCode,
        equipmentId: activity.equipmentId,
        name: activity.name,
        sortOrder: newSortOrder,
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
    costCode: string;
    equipmentId?: number | null;
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
      .where(eq(activities.id, activityId))
      .returning();

    return result.length > 0 ? result[0] : null;
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

// Function to get all manpower records for a given projectId
export const getManpowerByProjectId = async (projectId: number) => {
  try {
    return await db
      .select({
        manpowerId: manpower.id,
        activityId: manpower.activityId,
        date: manpower.date,
        manpowerCount: manpower.manpower,
      })
      .from(manpower)
      .innerJoin(activities, eq(manpower.activityId, activities.id))
      .innerJoin(categories, eq(activities.categoryId, categories.id))
      .where(eq(categories.projectId, projectId));
  } catch (error) {
    console.error("Error fetching manpower records:", error);
    throw new Error("Failed to fetch manpower records");
  }
};

// Function to get the startDate for a given projectId
export const getProjectStartDate = async (projectId: number) => {
  try {
    const [project] = await db
      .select({ startDate: projects.startDate })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      throw new Error("Project not found");
    }

    return project.startDate;
  } catch (error) {
    console.error("Error fetching project start date:", error);
    throw new Error("Failed to fetch project start date");
  }
};

// Function to update the start date of a project
export const updateProjectStartDate = async (
  projectId: number,
  newStartDate: string
) => {
  try {
    const parsedDate = new Date(newStartDate);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid start date");
    }
    await db
      .update(projects)
      .set({ startDate: parsedDate.toISOString(), updatedAt: new Date() })
      .where(eq(projects.id, projectId));
  } catch (error) {
    console.error(
      "Error updating project start date for projectId",
      projectId,
      "with newStartDate",
      newStartDate,
      ":",
      error
    );
    throw new Error("Failed to update project start date");
  }
};

// Function to update the date of a manpower record
export const updateManpowerDate = async (manpowerId: number, newDate: Date) => {
  try {
    if (isNaN(newDate.getTime())) {
      throw new Error("Invalid manpower date");
    }
    await db
      .update(manpower)
      .set({ date: newDate.toISOString(), updatedAt: new Date() })
      .where(eq(manpower.id, manpowerId));
  } catch (error) {
    console.error(
      "Error updating manpower date for manpowerId",
      manpowerId,
      "with newDate",
      newDate.toISOString(),
      ":",
      error
    );
    throw new Error("Failed to update manpower date");
  }
};

export const getTreeViewData = async (projectId: number) => {
  try {
    // Fetch categories
    const fetchedCategories = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(eq(categories.projectId, projectId))
      .orderBy(categories.sortOrder);

    // Get list of category IDs
    const categoryIds = fetchedCategories.map(
      (category) => category.categoryId
    );

    // Fetch activities with equipment names
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
            equipmentId: activities.equipmentId,
            equipmentName: equipment.equipmentName,
          })
          .from(activities)
          .leftJoin(equipment, eq(activities.equipmentId, equipment.id))
          .where(inArray(activities.categoryId, categoryIds))
          .orderBy(activities.sortOrder)
      : [];

    // Combine categories and activities
    const result = fetchedCategories.map((category) => ({
      ...category,
      activities: fetchedActivities.filter(
        (activity) => activity.categoryId === category.categoryId
      ),
    }));

    // Ensure categories without activities have an empty array
    return result.map((category) => ({
      ...category,
      activities: category.activities || [],
    }));
  } catch (error) {
    console.error("Error fetching categories with activities:", error);
    throw new Error("Could not fetch categories with activities");
  }
};

export async function findManpowerByActivityAndDate(
  activityId: number,
  date: string
) {
  const result = await db
    .select()
    .from(manpower)
    .where(and(eq(manpower.activityId, activityId), eq(manpower.date, date)))
    .limit(1);

  return result[0] || null; // Return the first matching record or null if none found
}

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
      costCode: activities.costCode,
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
    const allUsers = await db.select().from(users).execute();
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

// Update a user's record (email, first_name, last_name, permission_level)
export const updateUser = async (user: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  permission_level: string;
}): Promise<void> => {
  try {
    await db
      .update(users)
      .set({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        permission_level: user.permission_level,
      })
      .where(eq(users.id, user.id))
      .execute();
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Could not update user");
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

//👇🏻 get equipment list by project ID
export const getEquipmentByProjectId = async (projectId: number) => {
  try {
    const result = await db
      .select()
      .from(equipment)
      .where(eq(equipment.projectId, projectId))
      .orderBy(desc(equipment.createdAt));
    return result;
  } catch (error) {
    console.error("Error fetching equipment:", error);
    throw new Error("Could not fetch equipment");
  }
};

//👇🏻 add a new equipment item
export const addEquipment = async (equipmentItem: Equipment) => {
  try {
    const [newEquipment] = await db
      .insert(equipment)
      .values({
        projectId: equipmentItem.projectId,
        equipmentName: equipmentItem.equipmentName,
        sortOrder: equipmentItem.sortOrder || 0,
        costPerDay: equipmentItem.costPerDay,
        costPerWeek: equipmentItem.costPerWeek,
        costPerMonth: equipmentItem.costPerMonth,
        deliveryFee: equipmentItem.deliveryFee,
        pickupFee: equipmentItem.pickupFee,
        notes: equipmentItem.notes || "",
      })
      .returning();
    return newEquipment;
  } catch (error) {
    console.error("Error adding equipment:", error);
    throw new Error("Could not add equipment");
  }
};

//👇🏻 update an existing equipment item
export const updateEquipment = async (
  equipmentId: number,
  updatedData: Partial<Equipment>
) => {
  try {
    const { id, createdAt, ...dataToUpdate } = updatedData;

    dataToUpdate.updatedAt = new Date();

    const result = await db
      .update(equipment)
      .set(dataToUpdate) // Use dataToUpdate instead of updatedData
      .where(eq(equipment.id, equipmentId));
    return result;
  } catch (error) {
    console.error("Error updating equipment:", error);
    throw new Error("Could not update equipment");
  }
};
//👇🏻 get single equipment item by ID
export const getEquipmentById = async (equipmentId: number) => {
  try {
    const [equipmentItem] = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);
    return equipmentItem || null;
  } catch (error) {
    console.error("Error fetching equipment:", error);
    throw new Error("Could not fetch equipment");
  }
};

//👇🏻 delete an equipment item
export const deleteEquipment = async (equipmentId: number) => {
  try {
    const result = await db
      .delete(equipment)
      .where(eq(equipment.id, equipmentId));
    return result;
  } catch (error) {
    console.error("Error deleting equipment:", error);
    throw new Error("Could not delete equipment");
  }
};

/**
 * Updates the sortOrder of multiple categories in the database.
 * @param updatedCategories Array of categories with updated sortOrder.
 */
export const updateCategorySortOrderInDB = async (
  updatedCategories: CategorySortOrderUpdate[]
): Promise<void> => {
  try {
    for (const category of updatedCategories) {
      await db
        .update(categories)
        .set({ sortOrder: category.sortOrder })
        .where(eq(categories.id, category.categoryId));
    }
  } catch (error) {
    console.error("Failed to update category sort order:", error);
    throw new Error("Database update failed for categories.");
  }
};

/**
 * Updates the sortOrder and possibly the categoryId of multiple activities in the database.
 * @param updatedActivities Array of activities with updated sortOrder and optionally categoryId.
 */
export const updateActivitySortOrderInDB = async (
  updatedActivities: ActivitySortOrderUpdate[]
): Promise<void> => {
  try {
    for (const activity of updatedActivities) {
      const updateData: Partial<ActivitySortOrderUpdate> = {
        sortOrder: activity.sortOrder,
      };
      if (activity.categoryId !== undefined) {
        updateData.categoryId = activity.categoryId;
      }

      await db
        .update(activities)
        .set(updateData)
        .where(eq(activities.id, activity.activityId));
    }
  } catch (error) {
    console.error("Failed to update activity sort order:", error);
    throw new Error("Database update failed for activities.");
  }
};

/**
 * Updates the sortOrder of multiple categories and activities in the database.
 * Note: Transactions are not supported in neon-http driver.
 * So updates are performed sequentially without atomicity.
 * @param updatedCategories Array of categories with updated sortOrder.
 * @param updatedActivities Array of activities with updated sortOrder and optionally categoryId.
 */
export const updateSortOrdersInDB = async (
  updatedCategories: CategorySortOrderUpdate[],
  updatedActivities: ActivitySortOrderUpdate[]
): Promise<void> => {
  try {
    if (updatedCategories.length > 0) {
      await updateCategorySortOrderInDB(updatedCategories);
    }

    if (updatedActivities.length > 0) {
      await updateActivitySortOrderInDB(updatedActivities);
    }
  } catch (error) {
    console.error("Failed to update sort orders:", error);
    throw error; // Re-throw to let the caller handle
  }
};

/**
 * Helper function to get the next sortOrder for categories
 * Ensures that new categories are added to the end of the list
 * @param projectId - The ID of the project to which the category belongs
 * @returns The next sortOrder number
 */
export const getNextCategorySortOrder = async (
  projectId: number
): Promise<number> => {
  try {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.projectId, projectId))
      .orderBy(desc(categories.sortOrder))
      .limit(1);

    const maxSortOrder = result.length > 0 ? result[0].sortOrder : -1;
    return (maxSortOrder ?? -1) + 1;
  } catch (error) {
    console.error("Error calculating next sortOrder for categories:", error);
    throw new Error("Could not calculate sortOrder for new category");
  }
};

/**
 * Helper function to get the next sortOrder for activities within a category
 * Ensures that new activities are added to the end of the list within their category
 * @param categoryId - The ID of the category to which the activity belongs
 * @returns The next sortOrder number
 */
export const getNextActivitySortOrder = async (
  categoryId: number
): Promise<number> => {
  try {
    const result = await db
      .select()
      .from(activities)
      .where(eq(activities.categoryId, categoryId))
      .orderBy(desc(activities.sortOrder))
      .limit(1);

    const maxSortOrder = result.length > 0 ? result[0].sortOrder : -1;
    return (maxSortOrder ?? -1) + 1;
  } catch (error) {
    console.error("Error calculating next sortOrder for activities:", error);
    throw new Error("Could not calculate sortOrder for new activity");
  }
};

// Function to store a snapshot
export const storeSnapshot = async (
  projectId: number,
  snapshotData: object
) => {
  try {
    const snapshotId = new Date().toISOString(); // Use the current date and time as the snapshotId
    await db.insert(laborSnapshots).values({
      snapshotId,
      projectId,
      createdAt: new Date(),
      snapshotData: JSON.stringify(snapshotData), // Convert the object to JSON
    });
    return snapshotId; // Return the generated snapshotId
  } catch (error) {
    console.error("Error storing snapshot:", error);
    throw new Error("Failed to store snapshot");
  }
};

// Function to retrieve snapshots for a project
export const getSnapshotsByProjectId = async (projectId: number) => {
  try {
    return await db
      .select()
      .from(laborSnapshots)
      .where(eq(laborSnapshots.projectId, projectId));
  } catch (error) {
    console.error("Error retrieving snapshots:", error);
    throw new Error("Failed to retrieve snapshots");
  }
};

// Function to retrieve a specific snapshot by snapshotId
export const getSnapshotById = async (snapshotId: string) => {
  try {
    return await db
      .select()
      .from(laborSnapshots)
      .where(eq(laborSnapshots.snapshotId, snapshotId));
  } catch (error) {
    console.error("Error retrieving snapshot:", error);
    throw new Error("Failed to retrieve snapshot");
  }
};

// Get all vendors
export const getAllVendors = async () => {
  try {
    const result = await db.select().from(vendors).orderBy(vendors.vendorName);
    return result;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw new Error("Could not fetch vendors");
  }
};

// Get vendor by ID
export const getVendorById = async (vendorId: number) => {
  try {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1);
    return vendor || null;
  } catch (error) {
    console.error("Error fetching vendor:", error);
    throw new Error("Could not fetch vendor");
  }
};

// Add a new vendor
export const addVendor = async (vendorData: Omit<Vendor, "id">) => {
  try {
    const [newVendor] = await db
      .insert(vendors)
      .values({
        ...vendorData,
        vendorAddress: vendorData.vendorAddress || "",
        vendorCity: vendorData.vendorCity || "",
        vendorState: vendorData.vendorState || "",
        vendorZip: vendorData.vendorZip || "",
        vendorPhone: vendorData.vendorPhone || "",
        vendorEmail: vendorData.vendorEmail || "",
        vendorContact: vendorData.vendorContact || "",
        taxable: vendorData.taxable || false,
      })
      .returning();
    return newVendor;
  } catch (error) {
    console.error("Error adding vendor:", error);
    throw new Error("Could not add vendor");
  }
};

// Update an existing vendor
export const updateVendor = async (
  vendorId: number,
  updatedData: Partial<Vendor>
) => {
  try {
    const result = await db
      .update(vendors)
      .set(updatedData)
      .where(eq(vendors.id, vendorId));
    return result;
  } catch (error) {
    console.error("Error updating vendor:", error);
    throw new Error("Could not update vendor");
  }
};

// Delete a vendor
export const deleteVendor = async (vendorId: number) => {
  try {
    const result = await db.delete(vendors).where(eq(vendors.id, vendorId));
    return result;
  } catch (error) {
    console.error("Error deleting vendor:", error);
    throw new Error("Could not delete vendor");
  }
};

// Get all POs by vendor ID
export const getPOsByVendorId = async (vendorId: number) => {
  try {
    const result = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.vendorId, vendorId))
      .orderBy(purchaseOrders.poDate);
    return result;
  } catch (error) {
    console.error("Error fetching POs:", error);
    throw new Error("Could not fetch purchase orders");
  }
};

// Example of "get all POs" function
export const getAllPOs = async () => {
  try {
    const result = await db
      .select()
      .from(purchaseOrders)
      .orderBy(purchaseOrders.poNumber);
    return result;
  } catch (error) {
    console.error("Error fetching all POs:", error);
    throw new Error("Could not fetch purchase orders");
  }
};

// Example of "get all POs" function
export const getNextPO = async (): Promise<string> => {
  try {
    const result = await db
      .select({ poNumber: purchaseOrders.poNumber }) // Only fetch the poNumber field
      .from(purchaseOrders)
      .orderBy(desc(purchaseOrders.poNumber)) // Sort by poNumber descending
      .limit(1); // Get the highest poNumber

    // Get the last poNumber or default to "0"
    const lastPoNumber = result[0]?.poNumber || "0";

    // Convert to a number, increment, and convert back to a string
    const nextPoNumber = (parseInt(lastPoNumber, 10) + 1).toString();

    return nextPoNumber; // Return the incremented PO number as a string
  } catch (error) {
    console.error("Error fetching the next PO number:", error);
    throw new Error("Could not generate the next PO number");
  }
};

// used by the PO module to show the project name and the vendor name
export const getPurchaseOrdersWithDetails = async () => {
  try {
    const result = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        jobId: purchaseOrders.jobId,
        projectName: projects.name, // Retrieve project name
        vendorId: purchaseOrders.vendorId,
        vendorName: vendors.vendorName, // Retrieve vendor name
        projectManager: purchaseOrders.projectManager,
        poDate: purchaseOrders.poDate,
        dueDate: purchaseOrders.dueDate,
        amount: purchaseOrders.amount,
        shipTo: purchaseOrders.shipTo,
        costCode: purchaseOrders.costCode,
        shortDescription: purchaseOrders.shortDescription,
        longDescription: purchaseOrders.longDescription,
        notes: purchaseOrders.notes,
        received: purchaseOrders.received,
        backorder: purchaseOrders.backorder,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        // Add a subquery to count the number of attachments for each PO.
        attachmentCount: sql<number>`(
          SELECT COUNT(*) FROM ${attachments}
          WHERE ${attachments.recordId} = ${purchaseOrders.id}
            AND ${attachments.tableName} = 'purchase_orders'
        )`,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id)) // Join with vendors
      .leftJoin(projects, eq(purchaseOrders.jobId, projects.id)) // Join with projects
      .orderBy(desc(purchaseOrders.poNumber)); // Order by PO number

    return result; // Return the combined data
  } catch (error) {
    console.error("Error fetching purchase orders with details:", error);
    throw new Error("Could not fetch purchase orders with details");
  }
};

// Get all POs by status
export const getPOsByStatus = async (
  statusField: "received" | "backorder",
  statusValue: string
) => {
  try {
    const result = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders[statusField], statusValue)); // Dynamically use the status field
    return result;
  } catch (error) {
    console.error("Error fetching POs by status:", error);
    throw new Error("Could not fetch purchase orders");
  }
};

// Get all purchase orders for a specific jobID
export const getPOsByJobId = async (jobId: number) => {
  try {
    const result = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.jobId, jobId)) // Changed field from jobNumber to jobId
      .orderBy(purchaseOrders.poDate); // Adjust sorting if needed
    return result;
  } catch (error) {
    console.error("Error fetching purchase orders by job ID:", error);
    throw new Error("Could not fetch purchase orders");
  }
};

// Get a PO by ID
export const getPOById = async (poId: number) => {
  try {
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, poId))
      .limit(1);
    return po || null;
  } catch (error) {
    console.error("Error fetching PO:", error);
    throw new Error("Could not fetch purchase order");
  }
};

// get ID by PO number
export async function getPOByNumber(poNumber: string) {
  const result = await db
    .select({ id: purchaseOrders.id })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.poNumber, poNumber))
    .limit(1);

  return result[0]?.id;
}

// Add a new PO
export const addPurchaseOrder = async (poData: Omit<PurchaseOrder, "id">) => {
  try {
    const [newPO] = await db
      .insert(purchaseOrders)
      .values({
        ...poData,
        costCode: poData.costCode || "", // Ensure costCode is always a string
      })
      .returning();
    return newPO;
  } catch (error) {
    console.error("Error adding PO:", error);
    throw new Error("Could not add purchase order");
  }
};

export const updatePurchaseOrder = async (
  poId: number,
  updatedData: Partial<PurchaseOrder>
) => {
  try {
    const updatedDataWithStrings = {
      ...updatedData,
    };

    const result = await db
      .update(purchaseOrders)
      .set(updatedDataWithStrings)
      .where(eq(purchaseOrders.id, poId));

    return result;
  } catch (error) {
    console.error("Error updating PO:", error);
    throw new Error("Could not update purchase order");
  }
};

// Delete a PO
export const deletePurchaseOrder = async (poId: number) => {
  try {
    const result = await db
      .delete(purchaseOrders)
      .where(eq(purchaseOrders.id, poId));
    return result;
  } catch (error) {
    console.error("Error deleting PO:", error);
    throw new Error("Could not delete purchase order");
  }
};

// Upload a file to Dropbox and store metadata in the database
export async function uploadAttachment({
  tableName,
  recordId,
  notes,
  fileName,
  fileSize,
  fileData, // Now passed as Buffer
}: {
  tableName: string;
  recordId: number;
  notes: string;
  fileName: string;
  fileSize: number;
  fileData: Buffer; // Buffer type
}) {
  try {
    // Add SMS-specific path formatting
    const finalFileName =
      tableName === "purchase_orders"
        ? `/PO-${recordId}/${fileName}`
        : `/${fileName}`;

    const dbx = await getDropboxClient();

    const uploadResponse = await dbx.filesUpload({
      //path: `/${fileName}`,
      path: finalFileName, // Use the formatted file name
      contents: fileData, // Buffer
    });

    const dropboxFileUrl = uploadResponse.result.path_display; // Get the file path in Dropbox

    // Create shared link immediately after upload
    const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: dropboxFileUrl!, // Use the path from the upload response
    });

    const sharedLink = sharedLinkResponse.result.url.replace("?dl=0", "?raw=1");

    // Ensure values are not undefined
    if (!tableName || !recordId || !fileName || !dropboxFileUrl || !fileSize) {
      throw new Error("Missing required fields for the attachment");
    }

    // Insert metadata into the Neon database (attachments table)
    const result = await db.insert(attachments).values({
      tableName, // The table where this attachment belongs
      recordId, // Foreign key to the record this attachment belongs to
      fileName, // Original file name
      fileUrl: dropboxFileUrl, // Dropbox URL/path of the file
      fileSize, // File size in bytes
      notes: notes || "", // Optional notes
      sharedLink: sharedLink, // Shared link for download
      uploadedAt: new Date(), // Timestamp for when the file was uploaded
    });

    // Now notify connected clients of the update.
    // For example, fetch the new count of attachments for this record:
    // const updatedAttachments = await db
    //   .select()
    //   .from(attachments)
    //   .where(
    //     and(
    //       eq(attachments.tableName, tableName),
    //       eq(attachments.recordId, recordId)
    //     )
    //   );
    // const newAttachmentCount = updatedAttachments.length;

    // const io = getSocket();
    // if (io) {
    //   io.emit("edit", {
    //     poId: recordId, // You can adjust this property based on your client expectations
    //     updatedFields: {
    //       attachmentCount: newAttachmentCount,
    //     },
    //   });
    // }

    return { success: true, uploadResponse, sharedLink };
  } catch (error) {
    console.error("Error uploading file or creating shared link:", error);
    throw new Error("File upload and metadata storage failed.");
  }
}

// Get attachments for a specific record
export const getAttachments = async (tableName: string, recordId: number) => {
  try {
    // Query the database to get all attachments linked to the specific record
    const result = await db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.tableName, tableName),
          eq(attachments.recordId, recordId)
        )
      );

    return result;
  } catch (error) {
    console.error("Error fetching attachments:", error);
    throw new Error("Failed to fetch attachments.");
  }
};

// Delete attachment from Dropbox and database
export const deleteAttachment = async (attachmentId: number) => {
  try {
    // Get the attachment record from the database
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId))
      .limit(1);

    if (!attachment) throw new Error("Attachment not found.");

    // Use the same getDropboxClient() function as your upload flow
    const dbx = await getDropboxClient();

    // Delete the file from Dropbox
    console.log("Attachment path: ", attachment.fileUrl);
    try {
      await dbx.filesDeleteV2({ path: attachment.fileUrl });
    } catch (err) {
      console.error(
        "Error deleting file from Dropbox:",
        (err as { error_summary?: string; message?: string }).error_summary ||
          (err as { message?: string }).message
      );
    }

    // Delete the record from the attachments table
    await db.delete(attachments).where(eq(attachments.id, attachmentId));

    // Notify connected clients that an attachment was removed.
    // Here, we re-calculate the attachment count for the associated record.
    // const updatedAttachments = await db
    //   .select()
    //   .from(attachments)
    //   .where(
    //     and(
    //       eq(attachments.tableName, attachment.tableName),
    //       eq(attachments.recordId, attachment.recordId)
    //     )
    //   );
    // const newAttachmentCount = updatedAttachments.length;

    // const io = getSocket();
    // if (io) {
    //   io.emit("edit", {
    //     poId: attachment.recordId, // Adjust as needed
    //     updatedFields: {
    //       attachmentCount: newAttachmentCount,
    //     },
    //   });
    // }

    return { success: true };
  } catch (error) {
    console.error("Error deleting attachment:", error);
    throw new Error("Failed to delete attachment.");
  }
};

// Verify file size in Dropbox matches the file size in the database
export const verifyFileSize = async (attachmentId: number) => {
  try {
    if (!process.env.DROPBOX_ACCESS_TOKEN) {
      throw new Error("Can't find Access Token for Dropbox");
    }

    // Get the attachment record from the database
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId))
      .limit(1);

    if (!attachment) throw new Error("Attachment not found.");

    // Initialize Dropbox
    const dbx = await getDropboxClient();

    // Get file metadata from Dropbox
    const metadata = await dbx.filesGetMetadata({ path: attachment.fileUrl });

    // Compare file sizes (metadata.size comes from Dropbox API)
    if (
      "size" in metadata.result &&
      metadata.result.size !== attachment.fileSize
    ) {
      throw new Error("File size mismatch!");
    }

    return { success: true };
  } catch (error) {
    console.error("Error verifying file size:", error);
    throw new Error("File size verification failed.");
  }
};

//👇🏻 Retrieve labor data for a specific project
export const getLaborDataByProject = async (jobNumber: string) => {
  return await db
    .select()
    .from(laborData)
    .where(eq(laborData.jobNumber, jobNumber))
    .orderBy(laborData.date);
};

//👇🏻 Retrieve total hours for a specific project
export const getTotalHoursByProject = async (jobNumber: string) => {
  const result = await db
    .select({
      //totalHours: db.sum(laborData.hours), // Aggregate sum directly
      totalHours: sql<number>`SUM(COALESCE(${laborData.hours}, 0))`, // Using SQL template
    })
    .from(laborData)
    .where(eq(laborData.jobNumber, jobNumber));

  // If totalHours is null, default to 0
  return result[0]?.totalHours ?? 0;
};

//👇🏻 Retrieve total hours for a specific project
export const getTotalHoursGroupedByCostCode = async (jobNumber: string) => {
  const result = await db
    .select({
      costCodeNumber: laborData.costCodeNumber,
      totalHours: sql<number>`SUM(COALESCE(${laborData.hours}, 0))`, // Using SQL template
    })
    .from(laborData)
    .where(eq(laborData.jobNumber, jobNumber))
    .groupBy(laborData.costCodeNumber);

  // Handle case where totalHours might be null in the aggregation
  return result.map((row) => ({
    ...row,
    totalHours: row.totalHours ?? 0,
  }));
};

//👇🏻 Retrieve labor data by cost code number, sorted by date (newest to oldest)
export const getLaborDataByCostCode = async (
  jobNumber: string,
  costCodeNumber: string
) => {
  return await db
    .select()
    .from(laborData)
    .where(
      and(
        eq(laborData.jobNumber, jobNumber),
        eq(laborData.costCodeNumber, costCodeNumber)
      )
    )
    .orderBy(desc(laborData.date));
};

export async function getLaborDataByUniqueFields(
  eid: number,
  date: string,
  jobNumber: string,
  costCodeNumber: string,
  hours: number
) {
  console.log("Checking for existing record with:", {
    eid,
    date,
    jobNumber,
    costCodeNumber,
    hours,
  });

  const existingRecord = await db
    .select()
    .from(laborData)
    .where(
      and(
        eq(laborData.eid, eid),
        eq(laborData.date, date),
        eq(laborData.jobNumber, jobNumber),
        eq(laborData.costCodeNumber, costCodeNumber || ""),
        eq(laborData.hours, hours)
      )
    )
    .limit(1); // Ensure only one record is returned
  return existingRecord;
}

export const getLastLaborDateForProject = async (jobNumber: string) => {
  const result = await db
    .select({
      lastLaborDate: max(laborData.date), // Use the max function to find the latest date
    })
    .from(laborData)
    .where(eq(laborData.jobNumber, jobNumber));

  // Return the last labor date
  return result[0]?.lastLaborDate || null;
};

//👇🏻 Retrieve a single labor data entry by its ID
export const getSingleLaborData = async (id: number) => {
  return await db.select().from(laborData).where(eq(laborData.id, id));
};

//👇🏻 Add a new labor data entry
export const addLaborData = async (entry: Omit<LaborData, "id">) => {
  try {
    const [newEntry] = await db
      .insert(laborData)
      .values({
        ...entry,
        hours: entry.hours,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newEntry;
  } catch (error) {
    console.error("Error adding labor data:", error);
    throw new Error("Could not add labor data");
  }
};

//👇🏻 Update an existing labor data entry
export const updateLaborData = async (
  id: number,
  entry: Partial<LaborData>
) => {
  await db
    .update(laborData)
    .set({
      ...entry,
      hours: entry.hours,
      updatedAt: new Date(),
    })
    .where(eq(laborData.id, id));
};

//👇🏻 Delete a labor data entry by its ID
export const deleteLaborData = async (id: number) => {
  await db.delete(laborData).where(eq(laborData.id, id));
};

// Retrieve all materials
export const getAllMaterials = async () => {
  return await db.select().from(materials).orderBy(materials.name);
};

// Retrieve a single material by ID
export const getMaterialById = async (id: number) => {
  return await db.select().from(materials).where(eq(materials.id, id));
};

// Add a new material
export const addMaterial = async (
  material: Omit<Material, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const [newMaterial] = await db
      .insert(materials)
      .values({
        ...material,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newMaterial;
  } catch (error) {
    console.error("Error adding material:", error);
    throw new Error("Could not add material");
  }
};

// Update an existing material
export const updateMaterial = async (
  id: number,
  material: Partial<Material>
) => {
  const { createdAt, ...updateFields } = material;
  await db
    .update(materials)
    .set({
      ...updateFields,
      updatedAt: new Date(),
    })
    .where(eq(materials.id, id));
};

// Delete a material by ID
export const deleteMaterial = async (id: number) => {
  await db.delete(materials).where(eq(materials.id, id));
};

// Retrieve all requests
export const getAllRequests = async () => {
  try {
    const result = await db.execute(sql`
      SELECT 
        requests.id,
        requests.job_id AS "jobId",
        projects.name AS "jobName",
        requests.material_id AS "materialId",
        requests.quantity,
        requests.requested_by AS "requestedBy",
        requests.status,
        requests.comments,
        requests.created_at AS "createdAt",
        requests.updated_at AS "updatedAt",
        users.first_name || ' ' || users.last_name AS "userName",
        materials.name AS "materialName"
      FROM requests
      JOIN users ON requests.requested_by = users.id
      JOIN materials ON requests.material_id = materials.id
      JOIN projects ON requests.job_id = projects.id
    `);
    return result.rows; // Return the rows with joined data
  } catch (error) {
    console.error("Error fetching all requests:", error);
    throw new Error("Could not fetch requests");
  }
};

// Retrieve a single request by ID
export const getRequestById = async (id: number) => {
  return await db.select().from(requests).where(eq(requests.id, id));
};

// Retrieve requests for a specific material
export const getRequestsByMaterialId = async (materialId: number) => {
  return await db
    .select()
    .from(requests)
    .where(eq(requests.materialId, materialId))
    .orderBy(requests.createdAt);
};

// Add a new request
export const addRequest = async (
  request: Omit<Requisition, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const [newRequest] = await db
      .insert(requests)
      .values({
        ...request,
        jobId: Number(request.jobId), // Ensure jobId is a number
      })
      .returning();
    return newRequest;
  } catch (error) {
    console.error("Error adding request:", error);
    throw new Error("Could not add request");
  }
};

// Update an existing request
export const updateRequest = async (id: number, request: Partial<Request>) => {
  await db
    .update(requests)
    .set({
      ...request,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, id));
};

// Delete a request by ID
export const deleteRequest = async (id: number) => {
  await db.delete(requests).where(eq(requests.id, id));
};

export async function getToken(service: string) {
  return await db.select().from(tokens).where(eq(tokens.service, service));
}

export async function upsertToken(
  service: string,
  values: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
  }
) {
  return await db
    .insert(tokens)
    .values({
      service,
      accessToken: values.accessToken,
      refreshToken: values.refreshToken,
      expiresAt: values.expiresAt,
    })
    .onConflictDoUpdate({
      target: tokens.service,
      set: {
        accessToken: values.accessToken,
        refreshToken: values.refreshToken,
        expiresAt: values.expiresAt,
      },
    });
}

// Begin Safety form Actions

// Get all safety forms
export async function getAllFormSubmissions(includeDeleted = false) {
  if (includeDeleted) {
    // Return all records, including deleted ones
    return await db.select().from(forms);
  } else {
    // Return only records where isDeleted is false
    return await db.select().from(forms).where(eq(forms.isDeleted, false));
  }
}

// Create a new form submission
export async function createFormSubmission(
  input: Omit<
    FormSubmission,
    "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
  >
): Promise<FormSubmission> {
  const [result] = await db
    .insert(forms)
    .values({
      formName: input.formName,
      pdfName: input.pdfName,
      jobName: input.jobName,
      userName: input.userName,
      dateCreated: input.dateCreated,
      formData: input.formData,
      submissionDate: input.submissionDate,
      isDeleted: false,
      deletedAt: null,
    })
    .returning();
  return {
    id: result.id,
    formName: result.formName,
    pdfName: result.pdfName,
    jobName: result.jobName,
    userName: result.userName,
    dateCreated: result.dateCreated ?? "",
    submissionDate: result.submissionDate,
    formData: result.formData as Record<string, any>,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    isDeleted: result.isDeleted,
    deletedAt: result.deletedAt ?? null,
  };
}

// Get a form submission by id
export async function getFormSubmission(
  id: number
): Promise<FormSubmission | null> {
  const result = await db
    .select()
    .from(forms)
    .where(
      and(
        eq(forms.id, id),
        eq(forms.isDeleted, false) // Exclude soft-deleted
      )
    )
    .limit(1);
  if (!result.length) return null;
  const record = result[0];
  return {
    id: record.id,
    formName: record.formName,
    pdfName: record.pdfName,
    jobName: record.jobName,
    userName: record.userName,
    dateCreated: record.dateCreated ?? "",
    submissionDate: record.submissionDate,
    formData: record.formData as Record<string, any>,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: record.isDeleted,
    deletedAt: record.deletedAt ?? null,
  };
}

// Update a form submission by id
export async function updateFormSubmission(
  id: number,
  input: Partial<
    Omit<
      FormSubmission,
      "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
    >
  >
): Promise<FormSubmission | null> {
  const [result] = await db
    .update(forms)
    .set({
      formName: input.formName,
      pdfName: input.pdfName,
      jobName: input.jobName,
      userName: input.userName,
      dateCreated: input.dateCreated,
      submissionDate: input.submissionDate,
      formData: input.formData,
      updatedAt: new Date(), // update the timestamp
    })
    .where(eq(forms.id, id))
    .returning();
  if (!result) return null;
  return {
    id: result.id,
    formName: result.formName,
    pdfName: result.pdfName,
    jobName: result.jobName,
    userName: result.userName,
    dateCreated: result.dateCreated ?? "",
    submissionDate: result.submissionDate,
    formData: result.formData as Record<string, any>,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    isDeleted: result.isDeleted ?? null,
    deletedAt: result.deletedAt ?? new Date(),
  };
}

// Delete a form submission by id (soft delete)
export async function deleteFormSubmission(id: number): Promise<boolean> {
  const [result] = await db
    .update(forms)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(), // Track when deletion happened
    })
    .where(eq(forms.id, id))
    .returning();
  return !!result;
}

// End Safety form Actions

// Begin Opti

// Part actions
export async function getParts(userId: string) {
  return await db.select().from(parts).where(eq(parts.userId, userId));
}

export async function addPart(
  part: Omit<typeof parts.$inferInsert, "id" | "createdAt">
) {
  const result = await db.insert(parts).values(part).returning();
  revalidatePath("/optimize");
  return result[0];
}

export async function deletePart(id: number) {
  await db.delete(parts).where(eq(parts.id, id));
  revalidatePath("/optimize");
}

// Stock length actions
export async function getStockLengths(userId: string) {
  return await db
    .select()
    .from(stockLengths)
    .where(eq(stockLengths.userId, userId));
}

export async function addStockLength(
  stockLength: Omit<typeof stockLengths.$inferInsert, "id" | "createdAt">
) {
  const result = await db.insert(stockLengths).values(stockLength).returning();
  revalidatePath("/optimize");
  return result[0];
}

export async function updateStockLength(
  id: number,
  data: Partial<typeof stockLengths.$inferInsert>
) {
  const result = await db
    .update(stockLengths)
    .set(data)
    .where(eq(stockLengths.id, id))
    .returning();

  revalidatePath("/optimize");
  return result[0];
}

// Optimization job actions
export async function createOptimizationJob(
  userId: string,
  name: string,
  bladeWidth: number
) {
  const result = await db
    .insert(optimizationJobs)
    .values({
      userId,
      name,
      status: "pending",
      bladeWidth: bladeWidth.toString(),
    })
    .returning();

  revalidatePath("/optimize");
  return result[0];
}

export async function updateOptimizationJob(
  id: number,
  data: Partial<typeof optimizationJobs.$inferInsert>
) {
  const result = await db
    .update(optimizationJobs)
    .set(data)
    .where(eq(optimizationJobs.id, id))
    .returning();

  revalidatePath("/optimize");
  return result[0];
}

export async function getOptimizationJobs(userId: string) {
  return await db
    .select()
    .from(optimizationJobs)
    .where(eq(optimizationJobs.userId, userId))
    .orderBy(optimizationJobs.createdAt);
}

export async function getOptimizationJobById(id: number) {
  const jobData = await db
    .select()
    .from(optimizationJobs)
    .where(eq(optimizationJobs.id, id))
    .limit(1);

  if (jobData.length === 0) {
    return null;
  }

  return jobData[0];
}

// Store optimization results
export async function saveOptimizationResults(
  jobId: number,
  results: OptimizationResult
) {
  // First, update the job with summary data
  await db
    .update(optimizationJobs)
    .set({
      resultsJson: JSON.stringify(results.summary),
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(optimizationJobs.id, jobId));

  // Then save each cutting pattern
  for (const pattern of results.cutPattern) {
    // Check your schema to confirm the exact field name for job ID reference
    // It could be "optimization_job_id" or something similar
    const cutPatternResult = await db
      .insert(cutPatterns)
      .values({
        jobId: jobId, // Use the exact field name from your schema
        stockLength: pattern.stockLength.toString(), // Convert to string for decimal field
        stockId: pattern.stockId,
        remainingLength: pattern.remainingLength.toString(), // Convert to string for decimal field
      })
      .returning();

    const cutPatternId = cutPatternResult[0].id;

    // Save all cuts for this pattern
    await Promise.all(
      pattern.cuts.map((cut, index) =>
        db.insert(cuts).values({
          cutPatternId: cutPatternId, // Use the exact field name from your schema
          partNo: cut.part_no,
          length: cut.length.toString(), // Convert to string for decimal field
          markNo: cut.mark || "",
          finish: cut.finish || "",
          fab: cut.fab || "",
          position: index,
        })
      )
    );
  }

  revalidatePath("/optimize");
  return true;
}

// Load optimization results
export async function getOptimizationResults(
  jobId: number
): Promise<OptimizationResult | null> {
  // First get the job data
  const job = await getOptimizationJobById(jobId);

  if (!job || !job.resultsJson) {
    return null;
  }

  // Get all cut patterns for this job
  const cutPatternData = await db
    .select()
    .from(cutPatterns)
    .where(eq(cutPatterns.jobId, jobId)) // Use correct field name
    .orderBy(cutPatterns.stockId);

  // For each pattern, get its cuts
  const cutPattern = await Promise.all(
    cutPatternData.map(async (pattern) => {
      const cutsData = await db
        .select()
        .from(cuts)
        .where(eq(cuts.cutPatternId, pattern.id)) // Use correct field name
        .orderBy(cuts.position);

      return {
        stockLength: Number(pattern.stockLength),
        stockId: pattern.stockId,
        remainingLength: Number(pattern.remainingLength),
        cuts: cutsData.map((cut) => ({
          part_no: cut.partNo || "", // Provide default values for null fields
          length: Number(cut.length),
          mark: cut.markNo || "", // Convert null to empty string
          finish: cut.finish || "", // Convert null to empty string
          fab: cut.fab || "", // Convert null to empty string
          release: undefined,
        })),
      };
    })
  );

  // Calculate stock lengths needed from the patterns
  const stockLengthsMap = new Map<
    string,
    { part_no: string; finish: string; stockLength: number; quantity: number }
  >();

  cutPattern.forEach((pattern) => {
    if (pattern.cuts.length === 0) return;

    const partNo = pattern.cuts[0].part_no;
    const finish = pattern.cuts[0].finish;
    const key = `${partNo}|${finish}|${pattern.stockLength}`;

    if (stockLengthsMap.has(key)) {
      const entry = stockLengthsMap.get(key)!;
      entry.quantity += 1;
    } else {
      stockLengthsMap.set(key, {
        part_no: partNo,
        finish: finish,
        stockLength: pattern.stockLength,
        quantity: 1,
      });
    }
  });

  return {
    summary: JSON.parse(job.resultsJson),
    cutPattern,
    stockLengthsNeeded: Array.from(stockLengthsMap.values()),
  };
}

// End Opti

// Begin Panel Optimization

// Panel actions
export async function getPanels(userId: string) {
  return await db.select().from(panels).where(eq(panels.userId, userId));
}

export async function getPanelsByJob(jobId: number) {
  return await db.select().from(panels).where(eq(panels.jobId, jobId));
}

export async function addPanel(
  panel: Omit<typeof panels.$inferInsert, "id" | "createdAt" | "updatedAt">
) {
  const result = await db.insert(panels).values(panel).returning();
  revalidatePath("/panel-optimize");
  return result[0];
}

export async function deletePanel(id: number) {
  await db.delete(panels).where(eq(panels.id, id));
  revalidatePath("/panel-optimize");
}

// Sheet actions
export async function getPanelSheets(userId: string) {
  return await db
    .select()
    .from(panelSheets)
    .where(eq(panelSheets.userId, userId));
}

export async function addPanelSheet(
  sheet: Omit<typeof panelSheets.$inferInsert, "id" | "createdAt" | "updatedAt">
) {
  const result = await db.insert(panelSheets).values(sheet).returning();
  revalidatePath("/panel-optimize");
  return result[0];
}

export async function updatePanelSheet(
  id: number,
  data: Partial<typeof panelSheets.$inferInsert>
) {
  const result = await db
    .update(panelSheets)
    .set(data)
    .where(eq(panelSheets.id, id))
    .returning();

  revalidatePath("/panel-optimize");
  return result[0];
}

export async function deletePanelSheet(id: number) {
  await db.delete(panelSheets).where(eq(panelSheets.id, id));
  revalidatePath("/panel-optimize");
}

// Job actions
export async function createPanelJob(
  userId: string,
  name: string,
  bladeWidth: number,
  allowRotation: boolean = true
) {
  const result = await db
    .insert(panelJobs)
    .values({
      userId,
      name,
      status: "pending",
      bladeWidth: bladeWidth.toString(), // Convert to string for decimal field
      allowRotation,
    })
    .returning();

  revalidatePath("/panel-optimize");
  return result[0];
}

export async function updatePanelJob(
  id: number,
  data: Partial<typeof panelJobs.$inferInsert>
) {
  const result = await db
    .update(panelJobs)
    .set(data)
    .where(eq(panelJobs.id, id))
    .returning();

  revalidatePath("/panel-optimize");
  return result[0];
}

export async function getPanelJobs(userId: string) {
  return await db
    .select()
    .from(panelJobs)
    .where(eq(panelJobs.userId, userId))
    .orderBy(panelJobs.createdAt);
}

export async function getPanelJobById(id: number) {
  const jobData = await db
    .select()
    .from(panelJobs)
    .where(eq(panelJobs.id, id))
    .limit(1);

  if (jobData.length === 0) {
    return null;
  }

  return jobData[0];
}

// Updated savePanelOptimizationResults function in panel-actions.ts

export async function savePanelOptimizationResults(
  jobId: number,
  results: PanelOptimizationResult,
  inputPanels: Panel[],
  inputSheets: Sheet[]
) {
  try {
    // First, get the job data to retrieve userId
    const job = await getPanelJobById(jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    const userId = job.userId;

    // Update the job with summary data
    await db
      .update(panelJobs)
      .set({
        resultsJson: JSON.stringify(results.summary),
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(panelJobs.id, jobId));

    // Map to track original sheet IDs to database IDs
    const sheetIdMap = new Map<number, number>();

    // Save all sheets to the database first
    for (const sheet of inputSheets) {
      const originalId = sheet.id;

      // Check if this sheet already exists in the database
      let dbSheet;
      if (sheet.id && sheet.id > 0) {
        const existingSheets = await db
          .select()
          .from(panelSheets)
          .where(eq(panelSheets.id, sheet.id));

        if (existingSheets.length > 0) {
          dbSheet = existingSheets[0];
          sheetIdMap.set(originalId, dbSheet.id);
          continue; // Sheet already exists, skip to next
        }
      }

      // Sheet doesn't exist, insert it
      const result = await db
        .insert(panelSheets)
        .values({
          userId,
          width: sheet.width.toString(),
          height: sheet.height.toString(),
          qty: sheet.qty,
          material: "", // Add default or actual value if available
          thickness: "0", // Add default or actual value if available
        })
        .returning();

      // Map original ID to database ID
      sheetIdMap.set(originalId, result[0].id);
    }

    // Map to track original panel IDs to database IDs
    const panelIdMap = new Map<number, number>();

    // Save all panels to the database
    for (const panel of inputPanels) {
      const originalId = panel.id;

      // Skip if panel already has a positive ID (assuming it exists in DB)
      if (panel.id && panel.id > 0) {
        const existingPanels = await db
          .select()
          .from(panels)
          .where(eq(panels.id, panel.id));

        if (existingPanels.length > 0) {
          panelIdMap.set(originalId, panel.id);
          continue; // Panel already exists, skip to next
        }
      }

      // Insert new panel
      const result = await db
        .insert(panels)
        .values({
          userId,
          jobId,
          width: panel.width.toString(),
          height: panel.height.toString(),
          qty: panel.qty,
          mark_no: panel.mark_no,
          finish: panel.finish || "",
          material: "", // Add default or actual value if available
          allowRotation: true,
        })
        .returning();

      // Map original ID to database ID
      panelIdMap.set(originalId, result[0].id);
    }

    // Track sheets we've already saved to avoid duplicates
    const savedSheetNumbers = new Set<number>();

    // Now save used sheets with correct IDs
    for (const sheet of results.sheets) {
      // Skip if we've already saved this sheet number
      if (savedSheetNumbers.has(sheet.sheetNo)) {
        continue;
      }

      // Use the mapped database ID instead of the original
      const dbSheetId = sheetIdMap.get(sheet.sheetId);

      if (!dbSheetId) {
        console.error(`Missing database ID for sheet ${sheet.sheetId}`);
        continue; // Skip this sheet if we don't have a database ID
      }

      await db.insert(usedSheets).values({
        jobId,
        sheetId: dbSheetId, // Use the database ID
        sheetNo: sheet.sheetNo,
        usedArea: sheet.usedArea.toString(),
        wastePercentage: sheet.wastePercentage.toString(),
      });

      // Mark this sheet number as saved
      savedSheetNumbers.add(sheet.sheetNo);
    }

    // Save placements with correct IDs
    for (const placement of results.placements) {
      // Use the mapped database IDs
      const dbPanelId = panelIdMap.get(placement.panelId);
      const dbSheetId = sheetIdMap.get(placement.sheetId);

      if (!dbPanelId || !dbSheetId) {
        console.error(
          `Missing database ID for panel ${placement.panelId} or sheet ${placement.sheetId}`
        );
        continue; // Skip this placement if IDs are missing
      }

      await db.insert(panelPlacements).values({
        jobId,
        panelId: dbPanelId,
        sheetId: dbSheetId,
        sheetNo: placement.sheetNo,
        x: placement.x.toString(),
        y: placement.y.toString(),
        width: placement.width.toString(),
        height: placement.height.toString(),
        rotated: placement.rotated,
      });
    }

    revalidatePath("/panel-optimize");
    return true;
  } catch (error) {
    console.error("Error saving panel optimization results:", error);
    throw error;
  }
}

// Load optimization results
export async function getPanelOptimizationResults(
  jobId: number
): Promise<PanelOptimizationResult | null> {
  // First get the job data
  const job = await getPanelJobById(jobId);

  if (!job || !job.resultsJson) {
    return null;
  }

  // Get all used sheets for this job with their dimensions
  const usedSheetsData = await db
    .select({
      id: usedSheets.id,
      jobId: usedSheets.jobId,
      sheetId: usedSheets.sheetId,
      sheetNo: usedSheets.sheetNo,
      usedArea: usedSheets.usedArea,
      wastePercentage: usedSheets.wastePercentage,
      width: panelSheets.width,
      height: panelSheets.height,
    })
    .from(usedSheets)
    .leftJoin(panelSheets, eq(usedSheets.sheetId, panelSheets.id))
    .where(eq(usedSheets.jobId, jobId));

  // Get all placements for this job with panel details
  const placementsData = await db
    .select({
      id: panelPlacements.id,
      jobId: panelPlacements.jobId,
      panelId: panelPlacements.panelId,
      sheetId: panelPlacements.sheetId,
      sheetNo: panelPlacements.sheetNo,
      x: panelPlacements.x,
      y: panelPlacements.y,
      width: panelPlacements.width,
      height: panelPlacements.height,
      rotated: panelPlacements.rotated,
      mark_no: panels.mark_no,
    })
    .from(panelPlacements)
    .leftJoin(panels, eq(panelPlacements.panelId, panels.id))
    .where(eq(panelPlacements.jobId, jobId));

  // Convert database records to the format expected by the UI
  const sheets = usedSheetsData
    .filter((sheet) => sheet.sheetId !== null) // Filter out records with null sheetId
    .map((sheet) => ({
      sheetId: sheet.sheetId as number, // Type assertion since we filtered out nulls
      sheetNo: sheet.sheetNo,
      width: Number(sheet.width || 0),
      height: Number(sheet.height || 0),
      usedArea: Number(sheet.usedArea),
      wastePercentage: Number(sheet.wastePercentage),
    }));

  const placements = placementsData
    .filter(
      (placement) => placement.panelId !== null && placement.sheetId !== null
    ) // Filter out records with null IDs
    .map((placement) => ({
      panelId: placement.panelId as number, // Type assertion since we filtered out nulls
      sheetId: placement.sheetId as number, // Type assertion since we filtered out nulls
      sheetNo: placement.sheetNo,
      x: Number(placement.x),
      y: Number(placement.y),
      width: Number(placement.width),
      height: Number(placement.height),
      rotated: placement.rotated || false, // Default to false if null
      mark: placement.mark_no || "",
    }));

  return {
    sheets,
    placements,
    summary: JSON.parse(job.resultsJson),
  };
}
