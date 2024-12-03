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
} from "../types";
import { desc, eq, and, inArray, sql, max } from "drizzle-orm";
import { Dropbox } from "dropbox";
import { getDropboxClient } from "../modules/dropbox/dropboxClient";
//import fetch from "node-fetch";

//import { v4 as uuidv4 } from "uuid";

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
    const [newVendor] = await db.insert(vendors).values(vendorData).returning();
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

// /app/db/actions.ts

// Get all purchase orders for a specific job number
export const getPOsByJobNumber = async (jobNumber: string) => {
  try {
    const result = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.jobNumber, jobNumber))
      .orderBy(purchaseOrders.poDate); // You can adjust the sorting as needed
    return result;
  } catch (error) {
    console.error("Error fetching purchase orders by job number:", error);
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

// Add a new PO
export const addPurchaseOrder = async (poData: Omit<PurchaseOrder, "id">) => {
  try {
    const [newPO] = await db
      .insert(purchaseOrders)
      .values({
        ...poData,
        poAmount: poData.poAmount.toString(), // Convert poAmount to string
        freight: poData.freight.toString(), // Convert freight to string
        boxingCharges: poData.boxingCharges?.toString(), // Convert boxingCharges to string if defined
        taxRate: poData.taxRate?.toString(), // Convert taxRate to string if defined
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
      poAmount:
        updatedData.poAmount !== undefined
          ? updatedData.poAmount.toString()
          : undefined,
      freight:
        updatedData.freight !== undefined
          ? updatedData.freight.toString()
          : undefined,
      boxingCharges:
        updatedData.boxingCharges !== undefined
          ? updatedData.boxingCharges.toString()
          : undefined,
      taxRate:
        updatedData.taxRate !== undefined
          ? updatedData.taxRate.toString()
          : undefined, // taxRate is likely a decimal stored as a string
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
    const dbx = await getDropboxClient(); // Initialize Dropbox client

    // Upload the file to Dropbox
    const uploadResponse = await dbx.filesUpload({
      path: `/${fileName}`,
      contents: fileData, // Buffer
    });

    const dropboxFileUrl = uploadResponse.result.path_display; // Get the file path in Dropbox
    const fileUrl = dropboxFileUrl; // Use the Dropbox file path as the file URL
    // Ensure values are not undefined
    if (!tableName || !recordId || !fileName || !fileUrl || !fileSize) {
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
      uploadedAt: new Date(), // Timestamp for when the file was uploaded
    });

    return { success: true, uploadResponse };
  } catch (error) {
    console.error("Error uploading file:", error);
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
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });

    // Delete the file from Dropbox
    await dbx.filesDeleteV2({ path: attachment.fileUrl }); // Make sure you're accessing the fileUrl from the object

    // Delete the record from the attachments table
    await db.delete(attachments).where(eq(attachments.id, attachmentId));

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
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });

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
