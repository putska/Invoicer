import "server-only";

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
  glass,
  glassDescript,
  glassTO,
  engineers,
  engineeringTasks,
  taskAssignments,
  taskHistory,
  engineeringTaskChecklists,
  engineeringTaskChecklistItems,
  noteCategories,
  engineeringNotes,
  noteChecklists,
  noteChecklistItems,
  noteStatuses,
  noteStatusAssignments,
  bimModels,
  bimElements,
  holidays,
  gridMullions,
  gridGlassPanels,
  gridConfigurations,
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
  Panel,
  Sheet,
  PanelOptimizationResult,
  GlassData,
  TakeoffRequest,
  ProcessedGlassData,
  CreateEngineerForm,
  CreateTaskForm,
  TaskMoveData,
  HistoryDetail,
  UpdateTaskForm,
  EngineerWithTasks,
  ScheduleData,
  Engineer,
  DateRange,
  GanttTask,
  TaskWithAssignment,
  CreateNoteCategoryForm,
  UpdateNoteCategoryForm,
  CreateEngineeringNoteForm,
  UpdateEngineeringNoteForm,
  CreateNoteChecklistForm,
  CreateNoteChecklistItemForm,
  UpdateNoteChecklistItemForm,
  ReorderCategoriesForm,
  ReorderNotesForm,
  ReorderChecklistItemsForm,
  NoteCategoryWithNotes,
  EngineeringNoteWithChecklists,
  NoteChecklistWithItems,
  ChecklistSummary,
  NoteStatus,
  EngineeringNoteWithStatuses,
  AssignStatusToNoteForm,
  RemoveStatusFromNoteForm,
  DeleteImpactSummary,
  BIMModel,
  BIMElement,
  NewBIMElement,
  Holiday,
  HolidayType,
  CreateHolidayRequest,
  UpdateHolidayRequest,
  DeleteHolidayRequest,
  GetHolidaysRequest,
  Estimate,
  Bid,
  Elevation,
  Opening,
  Mullion,
  GlassPanel,
  Door,
  SpecialCondition,
  EstimateWithBids,
  BidWithElevations,
  ElevationWithOpenings,
  CreateEstimateInput,
  UpdateEstimateInput,
  CreateBidInput,
  UpdateBidInput,
  CreateElevationInput,
  UpdateElevationInput,
  CreateOpeningInput,
  UpdateOpeningInput,
  OpeningWithDetails,
  CreateMullionInput,
  CreateDoorInput,
  CreateSpecialConditionInput,
  BidSummary,
  ElevationSummary,
  GridMullion,
  GridGlassPanel,
  GridConfiguration,
  CreateGridMullionInput,
  CreateGridGlassPanelInput,
  CreateGridConfigurationInput,
  UpdateGridMullionInput,
  UpdateGridGlassPanelInput,
  OpeningWithGrid,
  GridDimensions,
} from "../types";
import {
  estimates,
  bids,
  elevations,
  openings,
  mullions,
  glassPanels,
  doors,
  specialConditions,
} from "./schema";
import {
  desc,
  eq,
  and,
  inArray,
  sql,
  max,
  not,
  or,
  gte,
  lte,
  ilike,
  asc,
  count,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDropboxClient } from "../modules/dropbox/dropboxClient";
import { GridCalculator } from "../utils/gridCalculator";

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
// export const deleteCategory = async (categoryId: number) => {
//   try {
//     const result = await db
//       .delete(categories)
//       .where(eq(categories.id, categoryId));
//     return result;
//   } catch (error) {
//     console.error("Error deleting category:", error);
//     throw new Error("Could not delete category");
//   }
// };

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
// export const deleteActivity = async (activityId: number) => {
//   try {
//     const result = await db
//       .delete(activities)
//       .where(eq(activities.id, activityId));
//     return result;
//   } catch (error) {
//     console.error("Error deleting activity:", error);
//     throw new Error("Could not delete activity");
//   }
// };

// Added functionality for cascading deletes in the Category and Activity tables (for manpopwer records)

// Get manpower records for an activity
export const getManpowerByActivityId = async (activityId: number) => {
  try {
    const result = await db
      .select()
      .from(manpower)
      .where(eq(manpower.activityId, activityId));
    return result;
  } catch (error) {
    console.error("Error fetching manpower for activity:", error);
    throw new Error("Could not fetch manpower records");
  }
};

// Get all manpower records for activities in a category
export const getManpowerByCategoryId = async (categoryId: number) => {
  try {
    const result = await db
      .select({
        id: manpower.id,
        activityId: manpower.activityId,
        date: manpower.date,
        manpower: manpower.manpower,
        createdAt: manpower.createdAt,
        updatedAt: manpower.updatedAt,
      })
      .from(manpower)
      .innerJoin(activities, eq(manpower.activityId, activities.id))
      .where(eq(activities.categoryId, categoryId));
    return result;
  } catch (error) {
    console.error("Error fetching manpower for category:", error);
    throw new Error("Could not fetch manpower records for category");
  }
};

// Calculate delete impact for an activity
export const getActivityDeleteImpact = async (
  activityId: number
): Promise<DeleteImpactSummary> => {
  try {
    // Get activity details
    const activity = await db
      .select({
        estimatedHours: activities.estimatedHours,
      })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    // Count manpower records
    const manpowerCountResult = await db
      .select({ count: count() })
      .from(manpower)
      .where(eq(manpower.activityId, activityId));

    return {
      activityCount: 1,
      manpowerCount: manpowerCountResult[0]?.count || 0,
      totalEstimatedHours: activity[0]?.estimatedHours || 0,
    };
  } catch (error) {
    console.error("Error calculating activity delete impact:", error);
    throw new Error("Could not calculate delete impact");
  }
};

// Calculate delete impact for a category
export const getCategoryDeleteImpact = async (
  categoryId: number
): Promise<DeleteImpactSummary> => {
  try {
    // Get all activities in the category
    const categoryActivities = await db
      .select({
        id: activities.id,
        estimatedHours: activities.estimatedHours,
      })
      .from(activities)
      .where(eq(activities.categoryId, categoryId));

    const activityIds = categoryActivities.map((a) => a.id);
    const totalEstimatedHours = categoryActivities.reduce(
      (sum, a) => sum + (a.estimatedHours || 0),
      0
    );

    // Count total manpower records for all activities in the category
    let manpowerCount = 0;
    if (activityIds.length > 0) {
      const manpowerCountResult = await db
        .select({ count: count() })
        .from(manpower)
        .innerJoin(activities, eq(manpower.activityId, activities.id))
        .where(eq(activities.categoryId, categoryId));

      manpowerCount = manpowerCountResult[0]?.count || 0;
    }

    return {
      categoryCount: 1,
      activityCount: categoryActivities.length,
      manpowerCount,
      totalEstimatedHours,
    };
  } catch (error) {
    console.error("Error calculating category delete impact:", error);
    throw new Error("Could not calculate delete impact");
  }
};

// Updated delete functions - these will now work with cascade deletes
// Delete a category by ID (will cascade to activities and manpower)
export const deleteCategoryWithCascade = async (categoryId: number) => {
  try {
    // The cascade deletes will handle activities and manpower automatically
    const result = await db
      .delete(categories)
      .where(eq(categories.id, categoryId));
    return result;
  } catch (error) {
    console.error("Error deleting category with cascade:", error);
    throw new Error("Could not delete category");
  }
};

// Delete an activity by ID (will cascade to manpower)
export const deleteActivityWithCascade = async (activityId: number) => {
  try {
    // The cascade delete will handle manpower automatically
    const result = await db
      .delete(activities)
      .where(eq(activities.id, activityId));
    return result;
  } catch (error) {
    console.error("Error deleting activity with cascade:", error);
    throw new Error("Could not delete activity");
  }
};

// Keep the original functions for backward compatibility
export const deleteCategory = deleteCategoryWithCascade;
export const deleteActivity = deleteActivityWithCascade;

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

    if (!attachment) throw new Error("Attachment not found");

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
    return await db
      .select()
      .from(forms)
      .where(eq(forms.isDeleted, false))
      .orderBy(desc(forms.createdAt));
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

export async function searchSafetyForms(query: string) {
  if (!query || query.trim() === "") {
    // If no query provided, return all forms that aren't deleted
    const allForms = await db
      .select()
      .from(forms)
      .where(not(forms.isDeleted))
      .orderBy(desc(forms.createdAt));

    return { submissions: allForms };
  }

  // Format the search term for SQL LIKE/ILIKE
  const searchTerm = `%${query.trim()}%`;

  // Search in regular fields and inside jsonb data
  const results = await db
    .select()
    .from(forms)
    .where(
      and(
        not(forms.isDeleted),
        or(
          ilike(forms.formName, searchTerm),
          ilike(forms.pdfName, searchTerm),
          ilike(forms.jobName, searchTerm),
          ilike(forms.userName, searchTerm),
          ilike(forms.dateCreated, searchTerm),
          // Search inside the jsonb field using Postgres's jsonb operators
          sql`${forms.formData}::text ILIKE ${searchTerm}`
        )
      )
    )
    .orderBy(desc(forms.dateCreated));

  return { submissions: results };
}

// End Safety form Actions

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

// ********************  Glass Takeoff Actions  ***************************

export async function processGlassTakeoff(
  data: TakeoffRequest
): Promise<ProcessedGlassData[]> {
  const { drawing, glassItems } = data;

  // Process results array
  const processedGlass: ProcessedGlassData[] = [];

  try {
    // Delete any previous takeoff for this drawing
    await db.delete(glassTO).where(eq(glassTO.dwgname, drawing));

    // Process each glass item
    for (const glassItem of glassItems) {
      // Get or create glass type in glassDescript table
      let glassTypeRecord = await db.query.glassDescript.findFirst({
        where: eq(glassDescript.glasstyp, glassItem.GlassType),
      });

      if (!glassTypeRecord) {
        // Create new glass type record
        await db.insert(glassDescript).values({
          glasstyp: glassItem.GlassType,
          prefix: `${glassItem.GlassType}-`,
          description: `Type ${glassItem.GlassType}:`,
        });

        // Get the newly created record
        glassTypeRecord = await db.query.glassDescript.findFirst({
          where: eq(glassDescript.glasstyp, glassItem.GlassType),
        });
      }

      // Ensure we have a prefix
      const prefix = glassTypeRecord?.prefix || `${glassItem.GlassType}-`;

      // Process coordinates to get dimensions (simplified version)
      const dimensions = calculateDimensions(glassItem.Coordinates);

      // Check if identical glass exists
      const existingGlass = await db.query.glass.findFirst({
        where: (glass, { and, eq }) =>
          and(
            eq(glass.dloWidth, dimensions.dloWidth.toString()),
            eq(glass.dloHeight, dimensions.dloHeight.toString()),
            eq(glass.dloHeight2, dimensions.dloHeight2.toString() || "0"),
            eq(glass.width, dimensions.width.toString()),
            eq(glass.height, dimensions.height.toString()),
            eq(glass.height2, dimensions.height2.toString() || "0"),
            eq(glass.gtype, glassItem.GlassType)
          ),
      });

      let markNum: string;
      let markIndex: string;

      if (!existingGlass) {
        // Find the next available mark number for this glass type
        const latestGlass = await db.query.glass.findFirst({
          where: (glass) => eq(glass.markIndex, `${prefix}%`),
          orderBy: (glass, { desc }) => [desc(glass.markNum)],
        });

        const nextMarkNum = latestGlass
          ? parseInt(latestGlass.markNum.replace(prefix, "")) + 1
          : 1;

        markNum = `${prefix}${String(nextMarkNum).padStart(3, "0")}`;
        markIndex = markNum;

        // Insert new glass record
        await db.insert(glass).values({
          markNum,
          markIndex,
          gtype: glassItem.GlassType,
          width: dimensions.width.toString(),
          height: dimensions.height.toString(),
          height2: dimensions.height2.toString() || "0",
          dloWidth: dimensions.dloWidth.toString(),
          dloHeight: dimensions.dloHeight.toString(),
          dloHeight2: dimensions.dloHeight2.toString() || "0",
          left: glassItem.GlassBiteLeft.toString(),
          right: glassItem.GlassBiteRight.toString(),
          top: glassItem.GlassBiteTop.toString(),
          bottom: glassItem.GlassBiteBottom.toString(),
        });
      } else {
        markNum = existingGlass.markNum;
        markIndex = existingGlass.markIndex;
      }

      // Insert into glassTO table
      await db.insert(glassTO).values({
        dwgname: drawing,
        handle: glassItem.Handle,
        markNum: markNum,
        elevation: glassItem.Elevation || "",
        floor: glassItem.Floor,
        qty: 1,
        x_pt: dimensions.centerX.toString(), // Make sure these are strings
        y_pt: dimensions.centerY.toString(),
        blx: dimensions.corners[0].x.toString(),
        bly: dimensions.corners[0].y.toString(),
        brx: dimensions.corners[1].x.toString(),
        bry: dimensions.corners[1].y.toString(),
        trx: dimensions.corners[2].x.toString(),
        try_: dimensions.corners[2].y.toString(), // Note the underscore
        tlx: dimensions.corners[3].x.toString(),
        tly: dimensions.corners[3].y.toString(),
        location: "", // Add a default value if needed
      });

      // Add to processed results
      processedGlass.push({
        Handle: glassItem.Handle,
        MarkNumber: markNum,
      });
    }

    return processedGlass;
  } catch (error) {
    console.error("Error processing glass takeoff:", error);
    throw error;
  }
}

// Function to calculate dimensions from coordinates (simplified)
function calculateDimensions(coordinates: number[]) {
  // This is a simplified implementation - you'll need to adapt your GlassTag
  // class logic for more sophisticated geometry calculations

  const points = [];
  for (let i = 0; i < coordinates.length; i += 2) {
    points.push({ x: coordinates[i], y: coordinates[i + 1] });
  }

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return {
    width: maxX - minX,
    height: maxY - minY,
    height2: 0, // For rectangular glass
    dloWidth: maxX - minX,
    dloHeight: maxY - minY,
    dloHeight2: 0,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    corners: [
      { x: minX, y: minY }, // bottom left
      { x: maxX, y: minY }, // bottom right
      { x: maxX, y: maxY }, // top right
      { x: minX, y: maxY }, // top left
    ],
  };
}

// **************************Engineering Schedule Actions**************************************

// Engineers
export const getEngineers = async () => {
  return await db
    .select()
    .from(engineers)
    .where(eq(engineers.active, true))
    .orderBy(engineers.order);
};

export const createEngineer = async (
  engineer: CreateEngineerForm,
  userId: string
) => {
  const maxOrder = await db
    .select({ maxOrder: max(engineers.order) })
    .from(engineers);

  const [newEngineer] = await db
    .insert(engineers)
    .values({
      name: engineer.name,
      email: engineer.email,
      order: (maxOrder[0]?.maxOrder || 0) + 1,
    })
    .returning();

  return newEngineer;
};

export const updateEngineer = async (id: number, data: Partial<Engineer>) => {
  const [updated] = await db
    .update(engineers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(engineers.id, id))
    .returning();

  return updated;
};

export const deactivateEngineer = async (id: number) => {
  await db
    .update(engineers)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(engineers.id, id));
};

// Tasks
export const getTasks = async () => {
  const tasks = await db
    .select({
      task: engineeringTasks,
      project: projects,
      assignment: taskAssignments,
    })
    .from(engineeringTasks)
    .leftJoin(projects, eq(engineeringTasks.projectId, projects.id))
    .leftJoin(taskAssignments, eq(engineeringTasks.id, taskAssignments.taskId))
    .where(not(eq(engineeringTasks.status, "archived")));

  return tasks.map((row) => ({
    ...row.task,
    project: row.project!,
    assignment: row.assignment,
  }));
};

// Get all tasks for a specific project (including archived)
export const getProjectTasks = async (projectId: number) => {
  const tasks = await db
    .select({
      task: engineeringTasks,
      project: projects,
      assignment: taskAssignments,
    })
    .from(engineeringTasks)
    .leftJoin(projects, eq(engineeringTasks.projectId, projects.id))
    .leftJoin(taskAssignments, eq(engineeringTasks.id, taskAssignments.taskId))
    .where(
      and(
        eq(engineeringTasks.projectId, projectId), // project filter
        eq(engineeringTasks.status, "active") // status filter
      )
    )
    .orderBy(desc(engineeringTasks.updatedAt));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get office holidays from your holiday management system
  const currentYear = today.getFullYear();
  const nextYear = currentYear + 1;
  const prevYear = currentYear - 1;

  // Get holidays for current year and adjacent years to handle cross-year projects
  const [currentYearHolidays, nextYearHolidays, prevYearHolidays] =
    await Promise.all([
      getOfficeHolidays(currentYear),
      getOfficeHolidays(nextYear),
      getOfficeHolidays(prevYear),
    ]);

  const holidays = [
    ...prevYearHolidays,
    ...currentYearHolidays,
    ...nextYearHolidays,
  ];

  return tasks.map((row) => {
    const task = {
      ...row.task,
      project: row.project!,
      assignment: row.assignment,
    };

    // Calculate risk status
    const dueDate = new Date(task.dueDate);

    let isAtRisk = false;
    let isOverdue = dueDate < today;

    if (
      !task.assignment &&
      task.status !== "archived" &&
      task.status !== "completed"
    ) {
      const wouldFinishBy = addWorkingDays(today, task.durationDays, holidays);
      isAtRisk = wouldFinishBy > dueDate;
    } else if (task.assignment?.scheduledEnd) {
      const scheduledEnd = new Date(task.assignment.scheduledEnd);
      isAtRisk = scheduledEnd > dueDate;
    }

    return {
      ...task,
      isOverdue,
      isAtRisk,
    };
  });
};

export const createTask = async (task: CreateTaskForm, userId: string) => {
  const [newTask] = await db
    .insert(engineeringTasks)
    .values({
      ...task,
      createdBy: userId,
    })
    .returning();

  // Create history entry
  await createTaskHistory(newTask.id, "created", null, userId);

  return newTask;
};

export const updateTask = async (
  id: number,
  data: UpdateTaskForm,
  userId: string
) => {
  const [oldTask] = await db
    .select()
    .from(engineeringTasks)
    .where(eq(engineeringTasks.id, id));

  const [updated] = await db
    .update(engineeringTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(engineeringTasks.id, id))
    .returning();

  // Create history entry for changes
  const changes: HistoryDetail = {};
  Object.keys(data).forEach((key) => {
    if (
      oldTask[key as keyof typeof oldTask] !== data[key as keyof typeof data]
    ) {
      changes.field = key;
      changes.oldValue = oldTask[key as keyof typeof oldTask];
      changes.newValue = data[key as keyof typeof data];
    }
  });

  if (Object.keys(changes).length > 0) {
    await createTaskHistory(id, "updated", changes, userId);
  }

  return updated;
};

export const deleteTask = async (id: number, userId: string) => {
  // Create history entry before deletion
  await createTaskHistory(id, "deleted", null, userId);

  // Delete task (cascades to assignments)
  await db.delete(engineeringTasks).where(eq(engineeringTasks.id, id));

  revalidatePath("/engineering-schedule");
};

export const assignTask = async (
  taskId: number,
  engineerId: number,
  position: number,
  userId: string
) => {
  // Check if task is already assigned
  const existing = await db
    .select()
    .from(taskAssignments)
    .where(eq(taskAssignments.taskId, taskId));

  if (existing.length > 0) {
    // Move task instead
    return await moveTask(
      {
        taskId,
        fromEngineerId: existing[0].engineerId,
        toEngineerId: engineerId,
        fromPosition: existing[0].position,
        toPosition: position,
      },
      userId
    );
  }

  // Shift other tasks down
  await db
    .update(taskAssignments)
    .set({ position: sql`${taskAssignments.position} + 1` })
    .where(
      and(
        eq(taskAssignments.engineerId, engineerId),
        sql`${taskAssignments.position} >= ${position}`
      )
    );

  // Create assignment
  const [assignment] = await db
    .insert(taskAssignments)
    .values({
      taskId,
      engineerId,
      position,
      assignedBy: userId,
    })
    .returning();

  // Update task status
  await db
    .update(engineeringTasks)
    .set({ status: "assigned", updatedAt: new Date() })
    .where(eq(engineeringTasks.id, taskId));

  // Calculate schedule dates
  await recalculateSchedule(engineerId);

  // Create history
  await createTaskHistory(
    taskId,
    "assigned",
    { toEngineerId: engineerId, toPosition: position },
    userId
  );

  return assignment;
};

export const moveTask = async (move: TaskMoveData, userId: string) => {
  const { taskId, fromEngineerId, toEngineerId, fromPosition, toPosition } =
    move;

  // If moving within same engineer
  if (fromEngineerId === toEngineerId && fromEngineerId !== undefined) {
    const direction = toPosition > fromPosition! ? -1 : 1;
    const min = Math.min(fromPosition!, toPosition);
    const max = Math.max(fromPosition!, toPosition);

    // Shift tasks between old and new position
    await db
      .update(taskAssignments)
      .set({ position: sql`${taskAssignments.position} + ${direction}` })
      .where(
        and(
          eq(taskAssignments.engineerId, fromEngineerId),
          sql`${taskAssignments.position} >= ${min}`,
          sql`${taskAssignments.position} <= ${max}`,
          not(eq(taskAssignments.taskId, taskId))
        )
      );

    // Update task position
    await db
      .update(taskAssignments)
      .set({ position: toPosition })
      .where(eq(taskAssignments.taskId, taskId));
  } else {
    // Moving to different engineer
    if (fromEngineerId !== undefined && fromPosition !== undefined) {
      // Remove from old engineer and shift remaining tasks up
      await db
        .delete(taskAssignments)
        .where(eq(taskAssignments.taskId, taskId));

      await db
        .update(taskAssignments)
        .set({ position: sql`${taskAssignments.position} - 1` })
        .where(
          and(
            eq(taskAssignments.engineerId, fromEngineerId),
            sql`${taskAssignments.position} > ${fromPosition}`
          )
        );
    }

    if (toEngineerId !== undefined) {
      // Shift tasks at destination down
      await db
        .update(taskAssignments)
        .set({ position: sql`${taskAssignments.position} + 1` })
        .where(
          and(
            eq(taskAssignments.engineerId, toEngineerId),
            sql`${taskAssignments.position} >= ${toPosition}`
          )
        );

      // Insert at new position
      await db.insert(taskAssignments).values({
        taskId,
        engineerId: toEngineerId,
        position: toPosition,
        assignedBy: userId,
      });

      // Update task status
      await db
        .update(engineeringTasks)
        .set({ status: "assigned", updatedAt: new Date() })
        .where(eq(engineeringTasks.id, taskId));
    } else {
      // Unassigning task
      await db
        .update(engineeringTasks)
        .set({ status: "unassigned", updatedAt: new Date() })
        .where(eq(engineeringTasks.id, taskId));
    }
  }

  // Recalculate schedules
  if (fromEngineerId) await recalculateSchedule(fromEngineerId);
  if (toEngineerId && toEngineerId !== fromEngineerId) {
    await recalculateSchedule(toEngineerId);
  }

  // Create history
  await createTaskHistory(
    taskId,
    "moved",
    { fromEngineerId, toEngineerId, fromPosition, toPosition },
    userId
  );

  revalidatePath("/engineering-schedule");
};

// Helper function to calculate working days
function addWorkingDays(
  startDate: Date,
  days: number,
  holidays: string[]
): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    const dateStr = result.toISOString().split("T")[0];

    // Skip weekends and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
      daysAdded++;
    }
  }

  return result;
}

// Recalculate schedule for an engineer
async function recalculateSchedule(engineerId: number) {
  // Get office holidays from your holiday management system
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const prevYear = currentYear - 1;

  // Get holidays for current year and adjacent years to handle long-running schedules
  const [currentYearHolidays, nextYearHolidays, prevYearHolidays] =
    await Promise.all([
      getOfficeHolidays(currentYear),
      getOfficeHolidays(nextYear),
      getOfficeHolidays(prevYear),
    ]);

  const holidays = [
    ...prevYearHolidays,
    ...currentYearHolidays,
    ...nextYearHolidays,
  ];

  // Get all tasks for this engineer in order
  const tasks = await db
    .select({
      assignment: taskAssignments,
      task: engineeringTasks,
    })
    .from(taskAssignments)
    .innerJoin(
      engineeringTasks,
      eq(taskAssignments.taskId, engineeringTasks.id)
    )
    .where(
      and(
        eq(taskAssignments.engineerId, engineerId),
        not(eq(engineeringTasks.status, "archived")) // Add this line
      )
    )
    .orderBy(taskAssignments.position);

  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Start from next working day if today is weekend/holiday
  const dayOfWeek = currentDate.getDay();
  const dateStr = currentDate.toISOString().split("T")[0];
  if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateStr)) {
    currentDate = addWorkingDays(currentDate, 1, holidays);
  }

  // Update each task's scheduled dates
  for (const { assignment, task } of tasks) {
    const endDate = addWorkingDays(
      currentDate,
      task.durationDays - 1,
      holidays
    );

    await db
      .update(taskAssignments)
      .set({
        scheduledStart: currentDate.toISOString().split("T")[0],
        scheduledEnd: endDate.toISOString().split("T")[0],
      })
      .where(eq(taskAssignments.id, assignment.id));

    currentDate = addWorkingDays(endDate, 1, holidays);
  }
}

// Create task history entry
async function createTaskHistory(
  taskId: number,
  action: string,
  details: any,
  userId: string
) {
  await db.insert(taskHistory).values({
    taskId,
    action,
    details,
    performedBy: userId,
  });
}

// Get schedule data for the board
export const getScheduleData = async (): Promise<ScheduleData> => {
  const currentYear = new Date().getFullYear();
  const [
    engineersList,
    tasks,
    prevYearHolidays,
    currentYearHolidays,
    nextYearHolidays,
  ] = await Promise.all([
    getEngineers(),
    getTasks(),
    getOfficeHolidays(currentYear - 1),
    getOfficeHolidays(currentYear),
    getOfficeHolidays(currentYear + 1),
  ]);

  const holidays = [
    ...prevYearHolidays,
    ...currentYearHolidays,
    ...nextYearHolidays,
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group tasks by engineer and check risk status
  const engineersWithTasks: EngineerWithTasks[] = engineersList.map(
    (engineer) => {
      const engineerTasks = tasks
        .filter((task) => task.assignment?.engineerId === engineer.id)
        .sort((a, b) => a.assignment!.position - b.assignment!.position)
        .map((task) => {
          const dueDate = new Date(task.dueDate);
          const scheduledEnd = task.assignment?.scheduledEnd
            ? new Date(task.assignment.scheduledEnd)
            : null;

          return {
            ...task,
            project: {
              ...task.project,
              jobNumber: task.project.jobNumber || "", // Convert null to empty string
            },
            isOverdue: dueDate < today,
            isAtRisk: scheduledEnd ? scheduledEnd > dueDate : false,
          } as TaskWithAssignment;
        });

      return {
        ...engineer,
        tasks: engineerTasks,
      };
    }
  );

  // Get unassigned tasks
  const unassignedTasks = tasks
    .filter((task) => !task.assignment)
    .map((task) => {
      const dueDate = new Date(task.dueDate);

      // Calculate if at risk (not enough time if started today)
      const wouldFinishBy = addWorkingDays(today, task.durationDays, holidays);
      return {
        ...task,
        project: {
          ...task.project,
          jobNumber: task.project.jobNumber || "", // Convert null to empty string
          description: task.project.description || undefined, // Convert null to undefined
          endDate: task.project.endDate || undefined, // Convert null to undefined
        },
        assignment: task.assignment || undefined, // Convert null to undefined
        isOverdue: dueDate < today,
        isAtRisk: wouldFinishBy > dueDate,
      } as TaskWithAssignment;
    });

  return {
    engineers: engineersWithTasks,
    unassignedTasks,
  };
};

// Get archived tasks
export const getArchivedTasks = async () => {
  const tasks = await db
    .select({
      task: engineeringTasks,
      project: projects,
      assignment: taskAssignments,
    })
    .from(engineeringTasks)
    .leftJoin(projects, eq(engineeringTasks.projectId, projects.id))
    .leftJoin(taskAssignments, eq(engineeringTasks.id, taskAssignments.taskId))
    .where(eq(engineeringTasks.status, "archived"))
    .orderBy(desc(engineeringTasks.updatedAt));

  return tasks.map((row) => ({
    ...row.task,
    project: row.project!,
    assignment: row.assignment,
  }));
};

// Get Gantt chart data
export const getGanttData = async (
  dateRange: DateRange
): Promise<GanttTask[]> => {
  const tasks = await getTasks();

  return tasks
    .filter((task) => task.assignment && task.assignment.scheduledStart)
    .map((task) => {
      const start = new Date(task.assignment!.scheduledStart!);
      const end = new Date(task.assignment!.scheduledEnd!);
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return {
        id: task.id,
        name: task.name,
        engineerId: task.assignment!.engineerId,
        engineerName: "", // Will be filled in by the component
        start,
        end,
        status: task.status,
        projectName: task.project.name,
        isOverdue: dueDate < today,
        isAtRisk: end > dueDate,
      };
    })
    .filter((task) => {
      // Filter by date range
      return task.end >= dateRange.start && task.start <= dateRange.end;
    });
};

// Checklist Actions

// Get all checklists (with items) for a task
export const getChecklistsByTaskId = async (taskId: number) => {
  // Get all checklists for the task
  const checklists = await db
    .select()
    .from(engineeringTaskChecklists)
    .where(eq(engineeringTaskChecklists.taskId, taskId))
    .orderBy(engineeringTaskChecklists.sortOrder);

  // For each checklist, get its items
  const checklistIds = checklists.map((cl) => cl.id);
  let items: any[] = [];
  if (checklistIds.length > 0) {
    items = await db
      .select()
      .from(engineeringTaskChecklistItems)
      .where(inArray(engineeringTaskChecklistItems.checklistId, checklistIds))
      .orderBy(engineeringTaskChecklistItems.sortOrder);
  }

  // Group items by checklistId
  const itemsByChecklist: Record<number, any[]> = {};
  for (const item of items) {
    if (!itemsByChecklist[item.checklistId])
      itemsByChecklist[item.checklistId] = [];
    itemsByChecklist[item.checklistId].push(item);
  }

  // Return checklists with their items
  return checklists.map((cl) => ({
    ...cl,
    items: itemsByChecklist[cl.id] || [],
  }));
};

/**
 * Quick counter for one task’s checklists.
 * Uses SQL aggregation so we don’t pull every item into Node.
 */
export const getChecklistSummaryByTaskId = async (taskId: number) => {
  const [row] = await db
    .select({
      completedItems: sql<number>`
        coalesce(sum(case when ${engineeringTaskChecklistItems.checked} then 1 else 0 end), 0)
      `.mapWith(Number),
      totalItems:
        sql<number>`count(${engineeringTaskChecklistItems.id})`.mapWith(Number),
    })
    .from(engineeringTaskChecklists)
    .leftJoin(
      engineeringTaskChecklistItems,
      eq(
        engineeringTaskChecklistItems.checklistId,
        engineeringTaskChecklists.id
      )
    )
    .where(eq(engineeringTaskChecklists.taskId, taskId));

  // `row` can be undefined if the task has no checklists yet
  return {
    completedItems: row?.completedItems ?? 0,
    totalItems: row?.totalItems ?? 0,
  };
};

// Create a new checklist for a task
export const createChecklist = async (
  taskId: number,
  name: string,
  sortOrder = 0
) => {
  const [checklist] = await db
    .insert(engineeringTaskChecklists)
    .values({ taskId, name, sortOrder })
    .returning();
  return checklist;
};

// Update a checklist (name or sortOrder)
export const updateChecklist = async (
  checklistId: number,
  data: Partial<{ name: string; sortOrder: number }>
) => {
  const [updated] = await db
    .update(engineeringTaskChecklists)
    .set(data)
    .where(eq(engineeringTaskChecklists.id, checklistId))
    .returning();
  return updated;
};

// Delete a checklist and its items
export const deleteChecklist = async (checklistId: number) => {
  await db
    .delete(engineeringTaskChecklistItems)
    .where(eq(engineeringTaskChecklistItems.checklistId, checklistId));
  await db
    .delete(engineeringTaskChecklists)
    .where(eq(engineeringTaskChecklists.id, checklistId));
};

// Checklist Item Actions

// Add an item to a checklist
export const addChecklistItem = async (
  checklistId: number,
  text: string,
  sortOrder?: number
) => {
  // Determine the next sortOrder if not provided
  let order = sortOrder;
  if (order === undefined) {
    const lastItem = await db
      .select()
      .from(engineeringTaskChecklistItems)
      .where(eq(engineeringTaskChecklistItems.checklistId, checklistId))
      .orderBy(desc(engineeringTaskChecklistItems.sortOrder))
      .limit(1);
    order = lastItem.length > 0 ? (lastItem[0].sortOrder ?? 0) + 1 : 0;
  }
  const [item] = await db
    .insert(engineeringTaskChecklistItems)
    .values({ checklistId, text, sortOrder: order })
    .returning();
  return item;
};

// Update a checklist item (text, checked, sortOrder)
export const updateChecklistItem = async (
  itemId: number,
  data: Partial<{ text: string; checked: boolean; sortOrder: number }>
) => {
  const [updated] = await db
    .update(engineeringTaskChecklistItems)
    .set(data)
    .where(eq(engineeringTaskChecklistItems.id, itemId))
    .returning();
  return updated;
};

// Delete a checklist item
export const deleteChecklistItem = async (itemId: number) => {
  await db
    .delete(engineeringTaskChecklistItems)
    .where(eq(engineeringTaskChecklistItems.id, itemId));
};

// Reorder checklist items (bulk update)
export const reorderNotesChecklistItems = async (
  checklistId: number,
  orderedItemIds: number[]
) => {
  // Fetch all items for this checklist
  const items = await db
    .select()
    .from(engineeringTaskChecklistItems)
    .where(eq(engineeringTaskChecklistItems.checklistId, checklistId));

  // Only update if the order is actually different
  for (let i = 0; i < orderedItemIds.length; i++) {
    const itemId = orderedItemIds[i];
    const item = items.find((it) => it.id === itemId);
    if (!item || item.sortOrder !== i) {
      await db
        .update(engineeringTaskChecklistItems)
        .set({ sortOrder: i })
        .where(
          and(
            eq(engineeringTaskChecklistItems.id, itemId),
            eq(engineeringTaskChecklistItems.checklistId, checklistId)
          )
        );
    }
  }
};

// Reorder checklists (bulk update)
export const reorderChecklists = async (
  taskId: number,
  orderedChecklistIds: number[]
) => {
  for (let i = 0; i < orderedChecklistIds.length; i++) {
    await db
      .update(engineeringTaskChecklists)
      .set({ sortOrder: i })
      .where(
        and(
          eq(engineeringTaskChecklists.id, orderedChecklistIds[i]),
          eq(engineeringTaskChecklists.taskId, taskId)
        )
      );
  }
};

// Engineering Notes Actions

// ===== CATEGORY ACTIONS =====

export async function getActiveProjects() {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.status, "active"))
    .orderBy(asc(projects.name));
}

export async function getCategoriesWithNotes(
  projectId: number
): Promise<NoteCategoryWithNotes[]> {
  const categories = await db
    .select()
    .from(noteCategories)
    .where(eq(noteCategories.projectId, projectId))
    .orderBy(asc(noteCategories.sortOrder));

  const categoriesWithNotes = await Promise.all(
    categories.map(async (category) => {
      // Get notes for this category
      const notes = await db
        .select()
        .from(engineeringNotes)
        .where(eq(engineeringNotes.categoryId, category.id))
        .orderBy(asc(engineeringNotes.sortOrder));

      // Get statuses for each note
      const notesWithStatuses = await Promise.all(
        notes.map(async (note) => {
          const statusQuery = await db
            .select({
              status: noteStatuses,
            })
            .from(noteStatusAssignments)
            .innerJoin(
              noteStatuses,
              eq(noteStatusAssignments.statusId, noteStatuses.id)
            )
            .where(eq(noteStatusAssignments.noteId, note.id))
            .orderBy(asc(noteStatuses.sortOrder));

          const statuses = statusQuery.map((row) => row.status);

          return {
            id: note.id,
            categoryId: note.categoryId,
            statusId: null, // Keep this for compatibility
            title: note.title,
            content: note.content,
            sortOrder: note.sortOrder,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            status: null, // Add this for the old interface
            statuses, // Add the new statuses array
          };
        })
      );

      return {
        ...category,
        notes: notesWithStatuses,
      };
    })
  );

  return categoriesWithNotes;
}

export async function addNoteCategory(data: CreateNoteCategoryForm) {
  // Get the highest sort order for this project
  const lastCategory = await db
    .select({ sortOrder: noteCategories.sortOrder })
    .from(noteCategories)
    .where(eq(noteCategories.projectId, data.projectId))
    .orderBy(desc(noteCategories.sortOrder))
    .limit(1);

  const nextSortOrder =
    lastCategory.length > 0 ? lastCategory[0].sortOrder + 1 : 0;

  const [newCategory] = await db
    .insert(noteCategories)
    .values({
      projectId: data.projectId,
      name: data.name,
      sortOrder: nextSortOrder,
      updatedAt: new Date(),
    })
    .returning();

  return newCategory;
}

export async function updateNoteCategory(
  categoryId: number,
  data: UpdateNoteCategoryForm
) {
  const [updatedCategory] = await db
    .update(noteCategories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(noteCategories.id, categoryId))
    .returning();

  return updatedCategory;
}

export async function deleteNoteCategory(categoryId: number) {
  await db.delete(noteCategories).where(eq(noteCategories.id, categoryId));
}

export async function reorderCategories(data: ReorderCategoriesForm) {
  // Update each category with its new sort order
  const updates = data.orderedCategoryIds.map((categoryId, index) =>
    db
      .update(noteCategories)
      .set({
        sortOrder: index,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(noteCategories.id, categoryId),
          eq(noteCategories.projectId, data.projectId)
        )
      )
  );

  await Promise.all(updates);
}

// ===== NOTE ACTIONS =====

export async function getDefaultStatusForProject(
  projectId: number
): Promise<NoteStatus | null> {
  const [defaultStatus] = await db
    .select()
    .from(noteStatuses)
    .where(
      and(
        eq(noteStatuses.projectId, projectId),
        eq(noteStatuses.isDefault, true)
      )
    );

  return defaultStatus || null;
}

export async function addEngineeringNote(data: CreateEngineeringNoteForm) {
  const lastNote = await db
    .select({ sortOrder: engineeringNotes.sortOrder })
    .from(engineeringNotes)
    .where(eq(engineeringNotes.categoryId, data.categoryId))
    .orderBy(desc(engineeringNotes.sortOrder))
    .limit(1);

  const nextSortOrder = lastNote.length > 0 ? lastNote[0].sortOrder + 1 : 0;

  const [newNote] = await db
    .insert(engineeringNotes)
    .values({
      categoryId: data.categoryId,
      title: data.title,
      content: data.content || "",
      sortOrder: nextSortOrder,
      updatedAt: new Date(),
    })
    .returning();

  // Handle status assignment - check if the table exists and statusId is provided
  if (data.statusId) {
    try {
      await db.insert(noteStatusAssignments).values({
        noteId: newNote.id,
        statusId: data.statusId,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error inserting status assignment:", error);
      // Continue without failing if status assignment fails
    }
  }

  // Get statuses for the note (with error handling)
  let statuses: NoteStatus[] = [];
  try {
    statuses = await getStatusesForNote(newNote.id);
  } catch (error) {
    console.error("Error fetching statuses:", error);
  }

  return {
    id: newNote.id,
    categoryId: newNote.categoryId,
    statusId: null,
    title: newNote.title,
    content: newNote.content,
    sortOrder: newNote.sortOrder,
    createdAt: newNote.createdAt,
    updatedAt: newNote.updatedAt,
    status: null,
    statuses,
  };
}

export async function updateEngineeringNote(
  noteId: number,
  data: UpdateEngineeringNoteForm
) {
  // Update the note itself
  const updateData = { ...data };
  delete updateData.statusIds; // Remove statusIds from note update

  const [updatedNote] = await db
    .update(engineeringNotes)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(engineeringNotes.id, noteId))
    .returning();

  // Update status assignments if provided
  if (data.statusIds !== undefined) {
    // Remove existing status assignments
    await db
      .delete(noteStatusAssignments)
      .where(eq(noteStatusAssignments.noteId, noteId));

    // Add new status assignments
    if (data.statusIds.length > 0) {
      const statusAssignments = data.statusIds.map((statusId) => ({
        noteId,
        statusId,
        createdAt: new Date(),
      }));

      await db.insert(noteStatusAssignments).values(statusAssignments);
    }
  }

  // Get the note with statuses for return
  const statuses = await getStatusesForNote(noteId);

  return {
    id: updatedNote.id,
    categoryId: updatedNote.categoryId,
    statusId: null,
    title: updatedNote.title,
    content: updatedNote.content,
    sortOrder: updatedNote.sortOrder,
    createdAt: updatedNote.createdAt,
    updatedAt: updatedNote.updatedAt,
    status: null,
    statuses,
  };
}

export async function deleteEngineeringNote(noteId: number) {
  await db.delete(engineeringNotes).where(eq(engineeringNotes.id, noteId));
}

export async function getEngineeringNoteWithChecklists(
  noteId: number
): Promise<EngineeringNoteWithChecklists | null> {
  const [note] = await db
    .select()
    .from(engineeringNotes)
    .where(eq(engineeringNotes.id, noteId));

  if (!note) return null;

  const checklists = await getChecklistsForNote(noteId);
  const statuses = await getStatusesForNote(noteId);

  return {
    id: note.id,
    categoryId: note.categoryId,
    statusId: null, // Keep for compatibility
    title: note.title,
    content: note.content,
    sortOrder: note.sortOrder,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    status: null, // Add for old interface compatibility
    checklists,
    statuses,
  };
}

export async function reorderNotes(data: ReorderNotesForm) {
  // Update each note with its new sort order
  const updates = data.orderedNoteIds.map((noteId, index) =>
    db
      .update(engineeringNotes)
      .set({
        sortOrder: index,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(engineeringNotes.id, noteId),
          eq(engineeringNotes.categoryId, data.categoryId)
        )
      )
  );

  await Promise.all(updates);
}

// ===== STATUS ACTIONS =====

// ===== STATUS ASSIGNMENT ACTIONS =====

export async function getStatusesForNote(
  noteId: number
): Promise<NoteStatus[]> {
  const statusQuery = await db
    .select({
      status: noteStatuses,
    })
    .from(noteStatusAssignments)
    .innerJoin(
      noteStatuses,
      eq(noteStatusAssignments.statusId, noteStatuses.id)
    )
    .where(eq(noteStatusAssignments.noteId, noteId))
    .orderBy(asc(noteStatuses.sortOrder));

  return statusQuery.map((row) => row.status);
}

export async function assignStatusToNote(data: AssignStatusToNoteForm) {
  // Check if assignment already exists
  const existing = await db
    .select()
    .from(noteStatusAssignments)
    .where(
      and(
        eq(noteStatusAssignments.noteId, data.noteId),
        eq(noteStatusAssignments.statusId, data.statusId)
      )
    );

  if (existing.length === 0) {
    await db.insert(noteStatusAssignments).values({
      noteId: data.noteId,
      statusId: data.statusId,
      createdAt: new Date(),
    });
  }
}

export async function removeStatusFromNote(data: RemoveStatusFromNoteForm) {
  await db
    .delete(noteStatusAssignments)
    .where(
      and(
        eq(noteStatusAssignments.noteId, data.noteId),
        eq(noteStatusAssignments.statusId, data.statusId)
      )
    );
}

export async function getStatusesForProject(
  projectId: number
): Promise<NoteStatus[]> {
  return await db
    .select()
    .from(noteStatuses)
    .where(eq(noteStatuses.projectId, projectId))
    .orderBy(asc(noteStatuses.sortOrder));
}

export async function addNoteStatus(data: any) {
  // Get the highest sort order for this project
  const lastStatus = await db
    .select({ sortOrder: noteStatuses.sortOrder })
    .from(noteStatuses)
    .where(eq(noteStatuses.projectId, data.projectId))
    .orderBy(desc(noteStatuses.sortOrder))
    .limit(1);

  const nextSortOrder = lastStatus.length > 0 ? lastStatus[0].sortOrder + 1 : 0;

  // Find color configuration from STATUS_COLOR_OPTIONS
  const STATUS_COLOR_OPTIONS = [
    {
      value: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
    },
    {
      value: "pink",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      textColor: "text-pink-800",
    },
    {
      value: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
    },
    {
      value: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
    },
    {
      value: "yellow",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
    },
    {
      value: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-800",
    },
    {
      value: "indigo",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      textColor: "text-indigo-800",
    },
    {
      value: "gray",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-800",
    },
    {
      value: "orange",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-800",
    },
    {
      value: "teal",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      textColor: "text-teal-800",
    },
  ];

  const colorConfig = STATUS_COLOR_OPTIONS.find((c) => c.value === data.color);
  if (!colorConfig) {
    throw new Error("Invalid color selection");
  }

  // Check if this should be the default (first status for project)
  const existingStatuses = await getStatusesForProject(data.projectId);
  const isDefault = existingStatuses.length === 0;

  const [newStatus] = await db
    .insert(noteStatuses)
    .values({
      projectId: data.projectId,
      name: data.name,
      color: data.color,
      bgColor: colorConfig.bgColor,
      borderColor: colorConfig.borderColor,
      textColor: colorConfig.textColor,
      isDefault,
      sortOrder: nextSortOrder,
      updatedAt: new Date(),
    })
    .returning();

  return newStatus;
}

export async function updateNoteStatus(statusId: number, data: any) {
  const STATUS_COLOR_OPTIONS = [
    {
      value: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
    },
    {
      value: "pink",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      textColor: "text-pink-800",
    },
    {
      value: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
    },
    {
      value: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
    },
    {
      value: "yellow",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
    },
    {
      value: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-800",
    },
    {
      value: "indigo",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      textColor: "text-indigo-800",
    },
    {
      value: "gray",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-800",
    },
    {
      value: "orange",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-800",
    },
    {
      value: "teal",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      textColor: "text-teal-800",
    },
  ];

  const updateData: any = { ...data, updatedAt: new Date() };

  // If updating color, update related color fields
  if (data.color) {
    const colorConfig = STATUS_COLOR_OPTIONS.find(
      (c) => c.value === data.color
    );
    if (colorConfig) {
      updateData.bgColor = colorConfig.bgColor;
      updateData.borderColor = colorConfig.borderColor;
      updateData.textColor = colorConfig.textColor;
    }
  }

  // If setting as default, unset other defaults for this project
  if (data.isDefault) {
    const [status] = await db
      .select({ projectId: noteStatuses.projectId })
      .from(noteStatuses)
      .where(eq(noteStatuses.id, statusId));

    if (status) {
      await db
        .update(noteStatuses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(noteStatuses.projectId, status.projectId),
            eq(noteStatuses.isDefault, true)
          )
        );
    }
  }

  const [updatedStatus] = await db
    .update(noteStatuses)
    .set(updateData)
    .where(eq(noteStatuses.id, statusId))
    .returning();

  return updatedStatus;
}

export async function deleteNoteStatus(statusId: number) {
  // Get the status to check if it's default
  const [status] = await db
    .select()
    .from(noteStatuses)
    .where(eq(noteStatuses.id, statusId));

  if (!status) throw new Error("Status not found");

  // Remove all assignments of this status (instead of setting statusId to null)
  await db
    .delete(noteStatusAssignments)
    .where(eq(noteStatusAssignments.statusId, statusId));

  // Delete the status
  await db.delete(noteStatuses).where(eq(noteStatuses.id, statusId));

  // If this was the default status, set another status as default
  if (status.isDefault) {
    const [nextStatus] = await db
      .select()
      .from(noteStatuses)
      .where(eq(noteStatuses.projectId, status.projectId))
      .orderBy(asc(noteStatuses.sortOrder))
      .limit(1);

    if (nextStatus) {
      await db
        .update(noteStatuses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(noteStatuses.id, nextStatus.id));
    }
  }
}

export async function reorderStatuses(data: any) {
  const updates = data.orderedStatusIds.map((statusId: number, index: number) =>
    db
      .update(noteStatuses)
      .set({
        sortOrder: index,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(noteStatuses.id, statusId),
          eq(noteStatuses.projectId, data.projectId)
        )
      )
  );

  await Promise.all(updates);
}

// ===== CHECKLIST ACTIONS (Unchanged) =====

export async function getChecklistsForNote(
  noteId: number
): Promise<NoteChecklistWithItems[]> {
  const checklists = await db
    .select()
    .from(noteChecklists)
    .where(eq(noteChecklists.noteId, noteId))
    .orderBy(asc(noteChecklists.sortOrder));

  const checklistsWithItems = await Promise.all(
    checklists.map(async (checklist) => {
      const items = await db
        .select()
        .from(noteChecklistItems)
        .where(eq(noteChecklistItems.checklistId, checklist.id))
        .orderBy(asc(noteChecklistItems.sortOrder));

      return {
        ...checklist,
        items,
      };
    })
  );

  return checklistsWithItems;
}

export async function addNoteChecklist(data: CreateNoteChecklistForm) {
  // Get the highest sort order for this note
  const lastChecklist = await db
    .select({ sortOrder: noteChecklists.sortOrder })
    .from(noteChecklists)
    .where(eq(noteChecklists.noteId, data.noteId))
    .orderBy(desc(noteChecklists.sortOrder))
    .limit(1);

  const nextSortOrder =
    lastChecklist.length > 0 ? lastChecklist[0].sortOrder + 1 : 0;

  const [newChecklist] = await db
    .insert(noteChecklists)
    .values({
      noteId: data.noteId,
      name: data.name,
      sortOrder: nextSortOrder,
      updatedAt: new Date(),
    })
    .returning();

  return newChecklist;
}

export async function deleteNoteChecklist(checklistId: number) {
  await db.delete(noteChecklists).where(eq(noteChecklists.id, checklistId));
}

export async function addNoteChecklistItem(data: CreateNoteChecklistItemForm) {
  // Get the highest sort order for this checklist
  const lastItem = await db
    .select({ sortOrder: noteChecklistItems.sortOrder })
    .from(noteChecklistItems)
    .where(eq(noteChecklistItems.checklistId, data.checklistId))
    .orderBy(desc(noteChecklistItems.sortOrder))
    .limit(1);

  const nextSortOrder = lastItem.length > 0 ? lastItem[0].sortOrder + 1 : 0;

  const [newItem] = await db
    .insert(noteChecklistItems)
    .values({
      checklistId: data.checklistId,
      text: data.text,
      sortOrder: nextSortOrder,
      updatedAt: new Date(),
    })
    .returning();

  return newItem;
}

export async function updateNoteChecklistItem(
  itemId: number,
  data: UpdateNoteChecklistItemForm
) {
  const [updatedItem] = await db
    .update(noteChecklistItems)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(noteChecklistItems.id, itemId))
    .returning();

  return updatedItem;
}

export async function deleteNoteChecklistItem(itemId: number) {
  await db.delete(noteChecklistItems).where(eq(noteChecklistItems.id, itemId));
}

export async function reorderChecklistItems(data: ReorderChecklistItemsForm) {
  // Update each item with its new sort order
  const updates = data.orderedItemIds.map((itemId, index) =>
    db
      .update(noteChecklistItems)
      .set({
        sortOrder: index,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(noteChecklistItems.id, itemId),
          eq(noteChecklistItems.checklistId, data.checklistId)
        )
      )
  );

  await Promise.all(updates);
}

// ===== SUMMARY ACTIONS (Unchanged) =====

export async function getChecklistSummaryForNote(
  noteId: number
): Promise<ChecklistSummary> {
  const items = await db
    .select({ checked: noteChecklistItems.checked })
    .from(noteChecklistItems)
    .leftJoin(
      noteChecklists,
      eq(noteChecklistItems.checklistId, noteChecklists.id)
    )
    .where(eq(noteChecklists.noteId, noteId));

  const totalItems = items.length;
  const completedItems = items.filter((item) => item.checked).length;

  return {
    completedItems,
    totalItems,
  };
}

// ================== Begin BIM Actions ========================================

export async function getBIMModel(id: number): Promise<BIMModel | null> {
  try {
    const [model] = await db
      .select()
      .from(bimModels)
      .where(and(eq(bimModels.id, id), eq(bimModels.isActive, true)));

    return model || null;
  } catch (error) {
    console.error("Error fetching BIM model:", error);
    return null;
  }
}

export async function getBIMElements(modelId: number): Promise<BIMElement[]> {
  try {
    const elements = await db
      .select()
      .from(bimElements)
      .where(eq(bimElements.modelId, modelId))
      .orderBy(asc(bimElements.elementType), asc(bimElements.elementName));

    return elements;
  } catch (error) {
    console.error("Error fetching BIM elements:", error);
    return [];
  }
}

export async function getBIMElementByIfcId(
  ifcId: string
): Promise<BIMElement | null> {
  try {
    const [element] = await db
      .select()
      .from(bimElements)
      .where(eq(bimElements.ifcId, ifcId));

    return element || null;
  } catch (error) {
    console.error("Error fetching BIM element by IFC ID:", error);
    return null;
  }
}

export async function saveBIMElement(
  element: NewBIMElement
): Promise<BIMElement | null> {
  try {
    const [savedElement] = await db
      .insert(bimElements)
      .values(element)
      .onConflictDoUpdate({
        target: [bimElements.modelId, bimElements.ifcId],
        set: {
          elementType: element.elementType,
          elementName: element.elementName,
          level: element.level,
          material: element.material,
          properties: element.properties,
          geometryData: element.geometryData,
        },
      })
      .returning();

    revalidatePath(`/models/${element.modelId}`);
    return savedElement;
  } catch (error) {
    console.error("Error saving BIM element:", error);
    return null;
  }
}

export async function saveBIMElements(
  modelId: number,
  elements: NewBIMElement[]
): Promise<{ success: boolean; count: number }> {
  try {
    // Clear existing elements for this model
    await db.delete(bimElements).where(eq(bimElements.modelId, modelId));

    // Insert new elements in batches
    const batchSize = 1000;
    let totalInserted = 0;

    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      const result = await db
        .insert(bimElements)
        .values(batch.map((element) => ({ ...element, modelId })))
        .returning({ id: bimElements.id });

      totalInserted += result.length;
    }

    revalidatePath(`/models/${modelId}`);
    return { success: true, count: totalInserted };
  } catch (error) {
    console.error("Error saving BIM elements:", error);
    return { success: false, count: 0 };
  }
}

export async function deleteBIMElement(
  id: number
): Promise<{ success: boolean }> {
  try {
    const [deletedElement] = await db
      .delete(bimElements)
      .where(eq(bimElements.id, id))
      .returning({ modelId: bimElements.modelId });

    if (deletedElement) {
      revalidatePath(`/models/${deletedElement.modelId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting BIM element:", error);
    return { success: false };
  }
}

export async function getBIMModels(): Promise<BIMModel[]> {
  try {
    const models = await db
      .select()
      .from(bimModels)
      .where(eq(bimModels.isActive, true))
      .orderBy(desc(bimModels.uploadDate));

    return models;
  } catch (error) {
    console.error("Error fetching BIM models:", error);
    return [];
  }
}

export async function createBIMModel(data: {
  name: string;
  description?: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  projectId?: number;
  uploadedBy?: number;
}): Promise<BIMModel | null> {
  try {
    const [model] = await db
      .insert(bimModels)
      .values({
        ...data,
        createdBy: data.uploadedBy,
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath("/models");
    return model;
  } catch (error) {
    console.error("Error creating BIM model:", error);
    return null;
  }
}

export async function updateBIMModel(
  id: number,
  data: Partial<BIMModel>
): Promise<BIMModel | null> {
  try {
    const [updatedModel] = await db
      .update(bimModels)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bimModels.id, id))
      .returning();

    revalidatePath("/models");
    revalidatePath(`/models/${id}`);
    return updatedModel;
  } catch (error) {
    console.error("Error updating BIM model:", error);
    return null;
  }
}

export async function deleteBIMModel(
  id: number
): Promise<{ success: boolean }> {
  try {
    await db
      .update(bimModels)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(bimModels.id, id));

    revalidatePath("/models");
    return { success: true };
  } catch (error) {
    console.error("Error deleting BIM model:", error);
    return { success: false };
  }
}

export async function processBIMModel(
  modelId: number
): Promise<{ success: boolean; elementCount: number }> {
  try {
    // This would typically parse the IFC file and extract element data
    // For now, returning a placeholder response
    return { success: true, elementCount: 0 };
  } catch (error) {
    console.error("Error processing BIM model:", error);
    return { success: false, elementCount: 0 };
  }
}

// ==================== Begin Holiday Actions ========================================

export async function createHoliday(
  data: CreateHolidayRequest
): Promise<{ success: boolean; holiday?: Holiday; error?: string }> {
  try {
    // Validate the data
    if (!data.date || !data.name || !data.type) {
      return {
        success: false,
        error: "Date, name, and type are required fields",
      };
    }

    // Check for date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      return {
        success: false,
        error: "Date must be in YYYY-MM-DD format",
      };
    }

    // Check if holiday already exists for this date and type
    const existingHoliday = await db
      .select()
      .from(holidays)
      .where(and(eq(holidays.date, data.date), eq(holidays.type, data.type)))
      .limit(1);

    if (existingHoliday.length > 0) {
      return {
        success: false,
        error: "A holiday of this type already exists for this date",
      };
    }

    // Insert the new holiday
    const [newHoliday] = await db
      .insert(holidays)
      .values({
        date: data.date,
        name: data.name,
        description: data.description || null,
        type: data.type,
        isRecurring: data.isRecurring || false,
      })
      .returning();

    // Convert database result to Holiday interface
    const holiday: Holiday = {
      id: newHoliday.id,
      date: newHoliday.date,
      name: newHoliday.name,
      description: newHoliday.description || undefined,
      type: newHoliday.type as HolidayType,
      isRecurring: newHoliday.isRecurring,
      createdAt: newHoliday.createdAt,
      updatedAt: newHoliday.updatedAt,
    };

    revalidatePath("/holidays");

    return {
      success: true,
      holiday,
    };
  } catch (error) {
    console.error("Error creating holiday:", error);
    return {
      success: false,
      error: "Failed to create holiday. Please try again.",
    };
  }
}

export async function updateHoliday(
  data: UpdateHolidayRequest
): Promise<{ success: boolean; holiday?: Holiday; error?: string }> {
  try {
    if (!data.id) {
      return {
        success: false,
        error: "Holiday ID is required",
      };
    }

    // Validate date format if provided
    if (data.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        return {
          success: false,
          error: "Date must be in YYYY-MM-DD format",
        };
      }
    }

    // Build update object dynamically
    const updateData: Partial<typeof holidays.$inferInsert> = {};

    if (data.date !== undefined) updateData.date = data.date;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isRecurring !== undefined)
      updateData.isRecurring = data.isRecurring;

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1) {
      // Only updatedAt was set
      return {
        success: false,
        error: "No fields to update",
      };
    }

    const [updatedHoliday] = await db
      .update(holidays)
      .set(updateData)
      .where(eq(holidays.id, data.id))
      .returning();

    if (!updatedHoliday) {
      return {
        success: false,
        error: "Holiday not found",
      };
    }

    const holiday: Holiday = {
      id: updatedHoliday.id,
      date: updatedHoliday.date,
      name: updatedHoliday.name,
      description: updatedHoliday.description || undefined,
      type: updatedHoliday.type as HolidayType,
      isRecurring: updatedHoliday.isRecurring,
      createdAt: updatedHoliday.createdAt,
      updatedAt: updatedHoliday.updatedAt,
    };

    revalidatePath("/holidays");

    return {
      success: true,
      holiday,
    };
  } catch (error) {
    console.error("Error updating holiday:", error);
    return {
      success: false,
      error: "Failed to update holiday. Please try again.",
    };
  }
}

export async function deleteHoliday(
  data: DeleteHolidayRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.id) {
      return {
        success: false,
        error: "Holiday ID is required",
      };
    }

    const [deletedHoliday] = await db
      .delete(holidays)
      .where(eq(holidays.id, data.id))
      .returning({ id: holidays.id });

    if (!deletedHoliday) {
      return {
        success: false,
        error: "Holiday not found",
      };
    }

    revalidatePath("/holidays");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return {
      success: false,
      error: "Failed to delete holiday. Please try again.",
    };
  }
}

export async function getHolidays(
  filters: GetHolidaysRequest = {}
): Promise<{ success: boolean; holidays?: Holiday[]; error?: string }> {
  try {
    // Build WHERE conditions
    const conditions = [];

    if (filters.type) {
      conditions.push(eq(holidays.type, filters.type));
    }

    if (filters.startDate) {
      conditions.push(gte(holidays.date, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(holidays.date, filters.endDate));
    }

    if (filters.year) {
      // Extract year from date using SQL
      conditions.push(
        sql`EXTRACT(YEAR FROM ${holidays.date}) = ${filters.year}`
      );
    }

    // Build and execute the query
    const baseQuery = db.select().from(holidays);

    const result =
      conditions.length > 0
        ? await baseQuery.where(and(...conditions)).orderBy(asc(holidays.date))
        : await baseQuery.orderBy(asc(holidays.date));

    const holidayList: Holiday[] = result.map((row) => ({
      id: row.id,
      date: row.date,
      name: row.name,
      description: row.description || undefined,
      type: row.type as HolidayType,
      isRecurring: row.isRecurring,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      success: true,
      holidays: holidayList,
    };
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return {
      success: false,
      error: "Failed to fetch holidays. Please try again.",
    };
  }
}

// Utility function to get holidays by type and date range
export async function getHolidaysByType(
  type: HolidayType,
  startDate?: string,
  endDate?: string
): Promise<string[]> {
  try {
    const result = await getHolidays({
      type,
      startDate,
      endDate,
    });

    if (result.success && result.holidays) {
      return result.holidays.map((holiday) => holiday.date);
    }

    return [];
  } catch (error) {
    console.error("Error fetching holidays by type:", error);
    return [];
  }
}

// Function to replace your hardcoded holidays
export async function getOfficeHolidays(year?: number): Promise<string[]> {
  try {
    // Build WHERE conditions
    const conditions = [sql`${holidays.type} IN ('office', 'both')`];

    if (year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${holidays.date}) = ${year}`);
    }

    const result = await db
      .select({ date: holidays.date })
      .from(holidays)
      .where(and(...conditions))
      .orderBy(asc(holidays.date));

    return result.map((row) => row.date);
  } catch (error) {
    console.error("Error fetching office holidays:", error);
    return [];
  }
}

export async function getFieldHolidays(year?: number): Promise<string[]> {
  try {
    // Build WHERE conditions
    const conditions = [sql`${holidays.type} IN ('field', 'both')`];

    if (year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${holidays.date}) = ${year}`);
    }

    const result = await db
      .select({ date: holidays.date })
      .from(holidays)
      .where(and(...conditions))
      .orderBy(asc(holidays.date));

    return result.map((row) => row.date);
  } catch (error) {
    console.error("Error fetching field holidays:", error);
    return [];
  }
}

export async function getAllHolidays(year?: number): Promise<string[]> {
  try {
    // Build WHERE conditions
    const conditions = [eq(holidays.type, "both")];

    if (year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${holidays.date}) = ${year}`);
    }

    const result = await db
      .select({ date: holidays.date })
      .from(holidays)
      .where(and(...conditions))
      .orderBy(asc(holidays.date));

    return result.map((row) => row.date);
  } catch (error) {
    console.error("Error fetching all holidays:", error);
    return [];
  }
}

// +++++++++++++++ Start of Estimating Actions ++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// ============================================================================
// ESTIMATE ACTIONS
// ============================================================================

export async function getAllEstimates(): Promise<Estimate[]> {
  const estimatesList = await db
    .select()
    .from(estimates)
    .orderBy(desc(estimates.createdAt));

  return estimatesList as Estimate[];
}

export async function getEstimateById(
  estimateId: number
): Promise<Estimate | null> {
  const estimate = await db
    .select()
    .from(estimates)
    .where(eq(estimates.id, estimateId))
    .limit(1);

  return (estimate[0] as Estimate) || null;
}

export async function getEstimateWithBids(
  estimateId: number
): Promise<EstimateWithBids | null> {
  const estimate = await getEstimateById(estimateId);
  if (!estimate) return null;

  const bidsList = await getBidsByEstimateId(estimateId);
  const activeBid = bidsList.find((bid) => bid.isActive);

  return {
    ...estimate,
    bids: bidsList,
    activeBid,
  };
}

export async function createEstimate(
  data: CreateEstimateInput
): Promise<Estimate> {
  const newEstimate = await db
    .insert(estimates)
    .values({
      estimateNumber: data.estimateNumber,
      name: data.name,
      description: data.description,
      buildingType: data.buildingType,
      location: data.location,
      architect: data.architect,
      contractor: data.contractor,
      owner: data.owner,
      bidDate: data.bidDate,
      projectStartDate: data.projectStartDate,
      projectEndDate: data.projectEndDate,
      totalSquareFootage: data.totalSquareFootage?.toString(),
      storiesBelowGrade: data.storiesBelowGrade || 0,
      storiesAboveGrade: data.storiesAboveGrade || 1,
      estimatedValue: data.estimatedValue?.toString(),
      confidenceLevel: data.confidenceLevel,
      competitionLevel: data.competitionLevel,
      relationshipStatus: data.relationshipStatus,
      primaryContact: data.primaryContact,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      assignedEstimator: data.assignedEstimator,
      salesPerson: data.salesPerson,
      notes: data.notes,
      internalNotes: data.internalNotes,
      sortOrder: data.sortOrder || 0,
    })
    .returning();

  return newEstimate[0] as Estimate;
}

export async function updateEstimate(
  estimateId: number,
  data: UpdateEstimateInput
): Promise<Estimate> {
  const updateData: any = {};

  if (data.estimateNumber !== undefined)
    updateData.estimateNumber = data.estimateNumber;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.buildingType !== undefined)
    updateData.buildingType = data.buildingType;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.architect !== undefined) updateData.architect = data.architect;
  if (data.contractor !== undefined) updateData.contractor = data.contractor;
  if (data.owner !== undefined) updateData.owner = data.owner;
  if (data.bidDate !== undefined) updateData.bidDate = data.bidDate;
  if (data.projectStartDate !== undefined)
    updateData.projectStartDate = data.projectStartDate;
  if (data.projectEndDate !== undefined)
    updateData.projectEndDate = data.projectEndDate;
  if (data.totalSquareFootage !== undefined)
    updateData.totalSquareFootage = data.totalSquareFootage?.toString();
  if (data.storiesBelowGrade !== undefined)
    updateData.storiesBelowGrade = data.storiesBelowGrade;
  if (data.storiesAboveGrade !== undefined)
    updateData.storiesAboveGrade = data.storiesAboveGrade;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.estimatedValue !== undefined)
    updateData.estimatedValue = data.estimatedValue?.toString();
  if (data.confidenceLevel !== undefined)
    updateData.confidenceLevel = data.confidenceLevel;
  if (data.competitionLevel !== undefined)
    updateData.competitionLevel = data.competitionLevel;
  if (data.relationshipStatus !== undefined)
    updateData.relationshipStatus = data.relationshipStatus;
  if (data.primaryContact !== undefined)
    updateData.primaryContact = data.primaryContact;
  if (data.contactEmail !== undefined)
    updateData.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined)
    updateData.contactPhone = data.contactPhone;
  if (data.assignedEstimator !== undefined)
    updateData.assignedEstimator = data.assignedEstimator;
  if (data.salesPerson !== undefined) updateData.salesPerson = data.salesPerson;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.internalNotes !== undefined)
    updateData.internalNotes = data.internalNotes;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  updateData.updatedAt = new Date();

  const updatedEstimate = await db
    .update(estimates)
    .set(updateData)
    .where(eq(estimates.id, estimateId))
    .returning();

  return updatedEstimate[0] as Estimate;
}

export async function deleteEstimate(estimateId: number): Promise<void> {
  await db.delete(estimates).where(eq(estimates.id, estimateId));
}

// ============================================================================
// BID ACTIONS
// ============================================================================

export async function getBidsByEstimateId(estimateId: number): Promise<Bid[]> {
  const bidsList = await db
    .select()
    .from(bids)
    .where(eq(bids.estimateId, estimateId))
    .orderBy(desc(bids.createdAt));

  return bidsList as Bid[];
}

export async function getBidById(bidId: number): Promise<Bid | null> {
  const bid = await db.select().from(bids).where(eq(bids.id, bidId)).limit(1);

  return (bid[0] as Bid) || null;
}

export async function getBidWithElevations(
  bidId: number
): Promise<BidWithElevations | null> {
  const bid = await getBidById(bidId);
  if (!bid) return null;

  const estimate = await getEstimateById(bid.estimateId);
  if (!estimate) throw new Error("Estimate not found for bid");

  const elevationsList = await getElevationsByBidId(bidId);
  const elevationsWithDetails = await Promise.all(
    elevationsList.map(async (elevation) => {
      const openingsList = await getOpeningsByElevationId(elevation.id);
      const openingsWithDetails = await Promise.all(
        openingsList.map(async (opening) => {
          const mullionsList = await getMullionsByOpeningId(opening.id);
          const panelsList = await getGlassPanelsByOpeningId(opening.id);
          const doorsList = await getDoorsByOpeningId(opening.id);

          return {
            ...opening,
            mullions: mullionsList,
            glassPanels: panelsList,
            doors: doorsList,
          };
        })
      );

      const specialConditionsList = await getSpecialConditionsByElevationId(
        elevation.id
      );

      return {
        ...elevation,
        openings: openingsWithDetails,
        specialConditions: specialConditionsList,
      };
    })
  );

  return {
    ...bid,
    estimate,
    elevations: elevationsWithDetails,
  };
}

export async function createBid(data: CreateBidInput): Promise<Bid> {
  const newBid = await db
    .insert(bids)
    .values({
      estimateId: data.estimateId,
      bidNumber: data.bidNumber,
      name: data.name,
      description: data.description,
      stage: data.stage || "initial_budget",
      version: 1,
      parentBidId: data.parentBidId,
      preparedBy: data.preparedBy,
      overheadPercentage: data.overheadPercentage?.toString() || "10.00",
      profitPercentage: data.profitPercentage?.toString() || "8.00",
      contingencyPercentage: data.contingencyPercentage?.toString() || "5.00",
      proposedStartDate: data.proposedStartDate,
      proposedCompletionDate: data.proposedCompletionDate,
      deliveryWeeks: data.deliveryWeeks,
      alternateRequested: data.alternateRequested || false,
      alternateDescription: data.alternateDescription,
      valueEngineeringNotes: data.valueEngineeringNotes,
      exclusions: data.exclusions,
      assumptions: data.assumptions,
      isActive: true, // New bids are active by default
      isSubmitted: false,
      notes: data.notes,
      internalNotes: data.internalNotes,
      sortOrder: data.sortOrder || 0,
    })
    .returning();

  // Set all other bids for this estimate to inactive
  await db
    .update(bids)
    .set({ isActive: false })
    .where(and(eq(bids.estimateId, data.estimateId), eq(bids.isActive, true)));

  // Set this bid as active
  await db
    .update(bids)
    .set({ isActive: true })
    .where(eq(bids.id, newBid[0].id));

  return newBid[0] as Bid;
}

export async function updateBid(
  bidId: number,
  data: UpdateBidInput
): Promise<Bid> {
  const updateData: any = {};

  if (data.bidNumber !== undefined) updateData.bidNumber = data.bidNumber;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.stage !== undefined) updateData.stage = data.stage;
  if (data.preparedBy !== undefined) updateData.preparedBy = data.preparedBy;
  if (data.reviewedBy !== undefined) updateData.reviewedBy = data.reviewedBy;
  if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
  if (data.submittedDate !== undefined)
    updateData.submittedDate = data.submittedDate;
  if (data.totalMaterialCost !== undefined)
    updateData.totalMaterialCost = data.totalMaterialCost.toString();
  if (data.totalLaborCost !== undefined)
    updateData.totalLaborCost = data.totalLaborCost.toString();
  if (data.totalSubcontractorCost !== undefined)
    updateData.totalSubcontractorCost = data.totalSubcontractorCost.toString();
  if (data.totalEquipmentCost !== undefined)
    updateData.totalEquipmentCost = data.totalEquipmentCost.toString();
  if (data.totalOverheadCost !== undefined)
    updateData.totalOverheadCost = data.totalOverheadCost.toString();
  if (data.totalProfitAmount !== undefined)
    updateData.totalProfitAmount = data.totalProfitAmount.toString();
  if (data.totalBidAmount !== undefined)
    updateData.totalBidAmount = data.totalBidAmount.toString();
  if (data.overheadPercentage !== undefined)
    updateData.overheadPercentage = data.overheadPercentage.toString();
  if (data.profitPercentage !== undefined)
    updateData.profitPercentage = data.profitPercentage.toString();
  if (data.contingencyPercentage !== undefined)
    updateData.contingencyPercentage = data.contingencyPercentage.toString();
  if (data.proposedStartDate !== undefined)
    updateData.proposedStartDate = data.proposedStartDate;
  if (data.proposedCompletionDate !== undefined)
    updateData.proposedCompletionDate = data.proposedCompletionDate;
  if (data.deliveryWeeks !== undefined)
    updateData.deliveryWeeks = data.deliveryWeeks;
  if (data.alternateRequested !== undefined)
    updateData.alternateRequested = data.alternateRequested;
  if (data.alternateDescription !== undefined)
    updateData.alternateDescription = data.alternateDescription;
  if (data.valueEngineeringNotes !== undefined)
    updateData.valueEngineeringNotes = data.valueEngineeringNotes;
  if (data.exclusions !== undefined) updateData.exclusions = data.exclusions;
  if (data.assumptions !== undefined) updateData.assumptions = data.assumptions;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isSubmitted !== undefined) updateData.isSubmitted = data.isSubmitted;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.internalNotes !== undefined)
    updateData.internalNotes = data.internalNotes;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  updateData.updatedAt = new Date();

  const updatedBid = await db
    .update(bids)
    .set(updateData)
    .where(eq(bids.id, bidId))
    .returning();

  return updatedBid[0] as Bid;
}

export async function deleteBid(bidId: number): Promise<void> {
  await db.delete(bids).where(eq(bids.id, bidId));
}

export async function setActiveBid(bidId: number): Promise<void> {
  const bid = await getBidById(bidId);
  if (!bid) throw new Error("Bid not found");

  // Set all other bids for this estimate to inactive
  await db
    .update(bids)
    .set({ isActive: false })
    .where(eq(bids.estimateId, bid.estimateId));

  // Set this bid as active
  await db.update(bids).set({ isActive: true }).where(eq(bids.id, bidId));
}

// ============================================================================
// ELEVATION ACTIONS
// ============================================================================

export async function getElevationsByBidId(
  bidId: number
): Promise<Elevation[]> {
  const elevationsList = await db
    .select()
    .from(elevations)
    .where(eq(elevations.bidId, bidId))
    .orderBy(asc(elevations.sortOrder), asc(elevations.createdAt));

  return elevationsList as Elevation[];
}

export async function getElevationById(
  elevationId: number
): Promise<Elevation | null> {
  const elevation = await db
    .select()
    .from(elevations)
    .where(eq(elevations.id, elevationId))
    .limit(1);

  return (elevation[0] as Elevation) || null;
}

export async function getElevationWithOpenings(
  elevationId: number
): Promise<ElevationWithOpenings | null> {
  const elevation = await getElevationById(elevationId);
  if (!elevation) return null;

  const openingsList = await getOpeningsByElevationId(elevationId);
  const openingsWithDetails = await Promise.all(
    openingsList.map(async (opening) => {
      const mullionsList = await getMullionsByOpeningId(opening.id);
      const panelsList = await getGlassPanelsByOpeningId(opening.id);
      const doorsList = await getDoorsByOpeningId(opening.id);

      return {
        ...opening,
        mullions: mullionsList,
        glassPanels: panelsList,
        doors: doorsList,
      };
    })
  );

  const specialConditionsList = await getSpecialConditionsByElevationId(
    elevationId
  );

  return {
    ...elevation,
    openings: openingsWithDetails,
    specialConditions: specialConditionsList,
  };
}

export async function getElevationsByBidIdWithOpenings(
  bidId: number
): Promise<ElevationWithOpenings[]> {
  // First get all elevations for the bid
  const elevationsList = await db
    .select()
    .from(elevations)
    .where(eq(elevations.bidId, bidId))
    .orderBy(asc(elevations.sortOrder));

  // Then get openings for each elevation
  const elevationsWithOpenings = await Promise.all(
    elevationsList.map(async (elevation) => {
      const openingsList = await getOpeningsByElevationId(elevation.id);
      const openingsWithDetails = await Promise.all(
        openingsList.map(async (opening) => {
          const mullionsList = await getMullionsByOpeningId(opening.id);
          const panelsList = await getGlassPanelsByOpeningId(opening.id);
          const doorsList = await getDoorsByOpeningId(opening.id);

          return {
            ...opening,
            mullions: mullionsList,
            glassPanels: panelsList,
            doors: doorsList,
          };
        })
      );

      const specialConditionsList = await getSpecialConditionsByElevationId(
        elevation.id
      );

      return {
        ...elevation,
        openings: openingsWithDetails,
        specialConditions: specialConditionsList,
      } as ElevationWithOpenings; // Add type assertion here
    })
  );

  return elevationsWithOpenings;
}

export async function createElevation(
  data: CreateElevationInput
): Promise<Elevation> {
  const newElevation = await db
    .insert(elevations)
    .values({
      bidId: data.bidId,
      name: data.name,
      description: data.description,
      elevationType: data.elevationType || "storefront",
      totalWidth: data.totalWidth.toString(),
      totalHeight: data.totalHeight.toString(),
      floorHeight: data.floorHeight.toString(),
      floorNumber: data.floorNumber || 1,
      drawingNumber: data.drawingNumber,
      drawingRevision: data.drawingRevision,
      gridLine: data.gridLine,
      detailReference: data.detailReference,
      notes: data.notes,
      sortOrder: data.sortOrder || 0,
    })
    .returning();

  return newElevation[0] as Elevation;
}

export async function updateElevation(
  elevationId: number,
  data: UpdateElevationInput
): Promise<Elevation> {
  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.elevationType !== undefined)
    updateData.elevationType = data.elevationType;
  if (data.totalWidth !== undefined)
    updateData.totalWidth = data.totalWidth.toString();
  if (data.totalHeight !== undefined)
    updateData.totalHeight = data.totalHeight.toString();
  if (data.floorHeight !== undefined)
    updateData.floorHeight = data.floorHeight.toString();
  if (data.floorNumber !== undefined) updateData.floorNumber = data.floorNumber;
  if (data.drawingNumber !== undefined)
    updateData.drawingNumber = data.drawingNumber;
  if (data.drawingRevision !== undefined)
    updateData.drawingRevision = data.drawingRevision;
  if (data.gridLine !== undefined) updateData.gridLine = data.gridLine;
  if (data.detailReference !== undefined)
    updateData.detailReference = data.detailReference;
  if (data.materialCost !== undefined)
    updateData.materialCost = data.materialCost.toString();
  if (data.laborCost !== undefined)
    updateData.laborCost = data.laborCost.toString();
  if (data.totalCost !== undefined)
    updateData.totalCost = data.totalCost.toString();
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  updateData.updatedAt = new Date();

  const updatedElevation = await db
    .update(elevations)
    .set(updateData)
    .where(eq(elevations.id, elevationId))
    .returning();

  return updatedElevation[0] as Elevation;
}

export async function deleteElevation(elevationId: number): Promise<void> {
  await db.delete(elevations).where(eq(elevations.id, elevationId));
}

// ============================================================================
// OPENING ACTIONS
// ============================================================================

export async function getOpeningsByElevationId(
  elevationId: number
): Promise<Opening[]> {
  const openingsList = await db
    .select()
    .from(openings)
    .where(eq(openings.elevationId, elevationId))
    .orderBy(asc(openings.sortOrder), asc(openings.startPosition));

  return openingsList as Opening[];
}

export async function createOpening(
  data: CreateOpeningInput
): Promise<Opening> {
  const newOpening = await db
    .insert(openings)
    .values({
      elevationId: data.elevationId,
      name: data.name,
      openingMark: data.openingMark,
      startPosition: data.startPosition.toString(),
      width: data.width.toString(),
      height: data.height.toString(),
      sillHeight: data.sillHeight.toString(),
      openingType: data.openingType,
      glazingSystem: data.glazingSystem,
      hasTransom: data.hasTransom || false,
      transomHeight: data.transomHeight?.toString(),

      // Grid Definition fields
      gridColumns: data.gridColumns || 1,
      gridRows: data.gridRows || 1,
      mullionWidth: data.mullionWidth?.toString() || "2.50",
      spacingVertical: data.spacingVertical || "equal",
      spacingHorizontal: data.spacingHorizontal || "equal",

      // Component Names
      componentSill: data.componentSill || "Sill",
      componentHead: data.componentHead || "Head",
      componentJambs: data.componentJambs || "Jamb",
      componentVerticals: data.componentVerticals || "Vertical",
      componentHorizontals: data.componentHorizontals || "Horizontal",

      // Performance requirements
      thermalPerformance: data.thermalPerformance,
      windLoadRequirement: data.windLoadRequirement,
      seismicRequirement: data.seismicRequirement,
      acousticRequirement: data.acousticRequirement,

      // Quantity and costs
      quantity: data.quantity || 1,
      unitMaterialCost: data.unitMaterialCost?.toString() || "0.00",
      unitLaborCost: data.unitLaborCost?.toString() || "0.00",
      totalMaterialCost: data.totalMaterialCost?.toString() || "0.00",
      totalLaborCost: data.totalLaborCost?.toString() || "0.00",

      // Additional fields
      description: data.description,
      notes: data.notes,
      sortOrder: data.sortOrder || 0,
    })
    .returning();

  return newOpening[0] as Opening;
}

// Update an existing opening
export async function updateOpening(
  data: UpdateOpeningInput
): Promise<Opening> {
  const updateData: any = {};

  // Only include fields that are provided
  if (data.name !== undefined) updateData.name = data.name;
  if (data.openingMark !== undefined) updateData.openingMark = data.openingMark;
  if (data.startPosition !== undefined)
    updateData.startPosition = data.startPosition.toString();
  if (data.width !== undefined) updateData.width = data.width.toString();
  if (data.height !== undefined) updateData.height = data.height.toString();
  if (data.sillHeight !== undefined)
    updateData.sillHeight = data.sillHeight.toString();
  if (data.openingType !== undefined) updateData.openingType = data.openingType;
  if (data.glazingSystem !== undefined)
    updateData.glazingSystem = data.glazingSystem;
  if (data.hasTransom !== undefined) updateData.hasTransom = data.hasTransom;
  if (data.transomHeight !== undefined)
    updateData.transomHeight = data.transomHeight?.toString();

  // Grid Definition fields
  if (data.gridColumns !== undefined) updateData.gridColumns = data.gridColumns;
  if (data.gridRows !== undefined) updateData.gridRows = data.gridRows;
  if (data.mullionWidth !== undefined)
    updateData.mullionWidth = data.mullionWidth.toString();
  if (data.spacingVertical !== undefined)
    updateData.spacingVertical = data.spacingVertical;
  if (data.spacingHorizontal !== undefined)
    updateData.spacingHorizontal = data.spacingHorizontal;

  // Component Names
  if (data.componentSill !== undefined)
    updateData.componentSill = data.componentSill;
  if (data.componentHead !== undefined)
    updateData.componentHead = data.componentHead;
  if (data.componentJambs !== undefined)
    updateData.componentJambs = data.componentJambs;
  if (data.componentVerticals !== undefined)
    updateData.componentVerticals = data.componentVerticals;
  if (data.componentHorizontals !== undefined)
    updateData.componentHorizontals = data.componentHorizontals;

  // Performance requirements
  if (data.thermalPerformance !== undefined)
    updateData.thermalPerformance = data.thermalPerformance;
  if (data.windLoadRequirement !== undefined)
    updateData.windLoadRequirement = data.windLoadRequirement;
  if (data.seismicRequirement !== undefined)
    updateData.seismicRequirement = data.seismicRequirement;
  if (data.acousticRequirement !== undefined)
    updateData.acousticRequirement = data.acousticRequirement;

  // Quantity and costs
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.unitMaterialCost !== undefined)
    updateData.unitMaterialCost = data.unitMaterialCost.toString();
  if (data.unitLaborCost !== undefined)
    updateData.unitLaborCost = data.unitLaborCost.toString();
  if (data.totalMaterialCost !== undefined)
    updateData.totalMaterialCost = data.totalMaterialCost.toString();
  if (data.totalLaborCost !== undefined)
    updateData.totalLaborCost = data.totalLaborCost.toString();

  // Additional fields
  if (data.description !== undefined) updateData.description = data.description;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  // Always update the updatedAt timestamp
  updateData.updatedAt = new Date();

  const updatedOpening = await db
    .update(openings)
    .set(updateData)
    .where(eq(openings.id, data.id))
    .returning();

  return updatedOpening[0] as Opening;
}

// Get opening by ID with enhanced details
export async function getOpeningById(
  id: number
): Promise<OpeningWithDetails | null> {
  const opening = await db
    .select()
    .from(openings)
    .where(eq(openings.id, id))
    .limit(1);

  if (!opening.length) {
    return null;
  }

  return enhanceOpeningWithDetails(opening[0] as Opening);
}

// Get all openings for an elevation
export async function getOpeningsByElevation(
  elevationId: number
): Promise<OpeningWithDetails[]> {
  const openingList = await db
    .select()
    .from(openings)
    .where(eq(openings.elevationId, elevationId))
    .orderBy(desc(openings.sortOrder), desc(openings.createdAt));

  return openingList.map((opening) =>
    enhanceOpeningWithDetails(opening as Opening)
  );
}

// Delete an opening
export async function deleteOpening(id: number): Promise<boolean> {
  try {
    await db.delete(openings).where(eq(openings.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting opening:", error);
    return false;
  }
}

// Duplicate an opening
export async function duplicateOpening(
  id: number,
  namePrefix?: string
): Promise<Opening> {
  const originalOpening = await getOpeningById(id);

  if (!originalOpening) {
    throw new Error("Opening not found");
  }

  // Create a copy with a new name
  const duplicateData: CreateOpeningInput = {
    elevationId: originalOpening.elevationId,
    name: namePrefix
      ? `${namePrefix} ${originalOpening.name}`
      : `Copy of ${originalOpening.name}`,
    openingMark: originalOpening.openingMark
      ? `${originalOpening.openingMark} (Copy)`
      : undefined,
    startPosition: originalOpening.startPosition,
    width: originalOpening.width,
    height: originalOpening.height,
    sillHeight: originalOpening.sillHeight,
    openingType: originalOpening.openingType,
    glazingSystem: originalOpening.glazingSystem || "standard",
    hasTransom: originalOpening.hasTransom,
    transomHeight: originalOpening.transomHeight
      ? originalOpening.transomHeight.toString()
      : undefined,

    // Grid Definition
    gridColumns: originalOpening.gridColumns,
    gridRows: originalOpening.gridRows,
    mullionWidth: originalOpening.mullionWidth,
    spacingVertical: originalOpening.spacingVertical as "equal" | "custom",
    spacingHorizontal: originalOpening.spacingHorizontal as "equal" | "custom",

    // Component Names
    componentSill: originalOpening.componentSill,
    componentHead: originalOpening.componentHead,
    componentJambs: originalOpening.componentJambs,
    componentVerticals: originalOpening.componentVerticals,
    componentHorizontals: originalOpening.componentHorizontals,

    // Performance requirements
    thermalPerformance: originalOpening.thermalPerformance || undefined,
    windLoadRequirement: originalOpening.windLoadRequirement || undefined,
    seismicRequirement: originalOpening.seismicRequirement || undefined,
    acousticRequirement: originalOpening.acousticRequirement || undefined,

    // Quantity and costs
    quantity: originalOpening.quantity,
    unitMaterialCost: originalOpening.unitMaterialCost,
    unitLaborCost: originalOpening.unitLaborCost,
    totalMaterialCost: originalOpening.totalMaterialCost,
    totalLaborCost: originalOpening.totalLaborCost,

    // Additional fields
    description: originalOpening.description || undefined,
    notes: originalOpening.notes || undefined,
    sortOrder: originalOpening.sortOrder,
  };

  return createOpening(duplicateData);
}

// Helper function to enhance opening with computed details
function enhanceOpeningWithDetails(opening: Opening): OpeningWithDetails {
  const width = parseFloat(opening.width) || 0;
  const height = parseFloat(opening.height) || 0;

  return {
    ...opening,
    // Computed fields for convenience
    area: width * height,
    glassPanelCount: opening.gridColumns * opening.gridRows,
    verticalMullionCount: Math.max(0, opening.gridColumns - 1),
    horizontalMullionCount: Math.max(0, opening.gridRows - 1),
    perimeter: 2 * (width + height),
    // Related entities - initialize as empty arrays
    // These would be populated by separate queries if needed
    mullions: [],
    glassPanels: [],
    doors: [],
  } as OpeningWithDetails;
}

// Bulk operations
export async function bulkUpdateOpenings(
  updates: Array<{ id: number; data: Partial<UpdateOpeningInput> }>
): Promise<Opening[]> {
  const results: Opening[] = [];

  for (const update of updates) {
    const result = await updateOpening({ id: update.id, ...update.data });
    results.push(result);
  }

  return results;
}

// Get opening statistics for an elevation
export async function getOpeningStats(elevationId: number) {
  const openingList = await getOpeningsByElevation(elevationId);

  const stats = {
    totalOpenings: openingList.length,
    totalArea: openingList.reduce(
      (sum, opening) => sum + (opening.area || 0),
      0
    ),
    totalGlassPanels: openingList.reduce(
      (sum, opening) => sum + (opening.glassPanelCount || 0),
      0
    ),
    totalMaterialCost: openingList.reduce(
      (sum, opening) => sum + parseFloat(opening.totalMaterialCost || "0"),
      0
    ),
    totalLaborCost: openingList.reduce(
      (sum, opening) => sum + parseFloat(opening.totalLaborCost || "0"),
      0
    ),
    openingTypes: openingList.reduce((acc, opening) => {
      acc[opening.openingType] = (acc[opening.openingType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    ...stats,
    totalCost: stats.totalMaterialCost + stats.totalLaborCost,
  };
}

// ============================================================================
// MULLION ACTIONS
// ============================================================================

export async function getMullionsByOpeningId(
  openingId: number
): Promise<Mullion[]> {
  const mullionsList = await db
    .select()
    .from(mullions)
    .where(eq(mullions.openingId, openingId))
    .orderBy(asc(mullions.type), asc(mullions.position));

  return mullionsList as Mullion[];
}

export async function createMullion(
  data: CreateMullionInput
): Promise<Mullion> {
  const newMullion = await db
    .insert(mullions)
    .values({
      openingId: data.openingId,
      type: data.type,
      position: data.position.toString(),
      mullionType: data.mullionType,
      depth: data.depth?.toString() || "2.00",
      notes: data.notes,
    })
    .returning();

  return newMullion[0] as Mullion;
}

export async function deleteMullion(mullionId: number): Promise<void> {
  await db.delete(mullions).where(eq(mullions.id, mullionId));
}

// ============================================================================
// GLASS PANEL ACTIONS
// ============================================================================

export async function getGlassPanelsByOpeningId(
  openingId: number
): Promise<GlassPanel[]> {
  const panelsList = await db
    .select()
    .from(glassPanels)
    .where(eq(glassPanels.openingId, openingId))
    .orderBy(asc(glassPanels.panelNumber));

  return panelsList as GlassPanel[];
}

export async function generateGlassPanels(
  openingId: number
): Promise<GlassPanel[]> {
  // This function calculates glass panels based on opening dimensions and mullions
  const opening = await getOpeningById(openingId);
  if (!opening) throw new Error("Opening not found");

  const mullionsList = await getMullionsByOpeningId(openingId);

  // Clear existing panels
  await db.delete(glassPanels).where(eq(glassPanels.openingId, openingId));

  // Calculate panels based on mullion positions
  const verticalMullions = mullionsList
    .filter((m) => m.type === "vertical")
    .sort((a, b) => parseFloat(a.position) - parseFloat(b.position));
  const horizontalMullions = mullionsList
    .filter((m) => m.type === "horizontal")
    .sort((a, b) => parseFloat(a.position) - parseFloat(b.position));

  // Create grid of panels
  const xPositions = [
    0,
    ...verticalMullions.map((m) => parseFloat(m.position)),
    parseFloat(opening.width),
  ];
  const yPositions = [
    0,
    ...horizontalMullions.map((m) => parseFloat(m.position)),
    parseFloat(opening.height),
  ];

  const panels: GlassPanel[] = [];
  let panelNumber = 1;

  for (let i = 0; i < xPositions.length - 1; i++) {
    for (let j = 0; j < yPositions.length - 1; j++) {
      const x = xPositions[i];
      const y = yPositions[j];
      const width = xPositions[i + 1] - x;
      const height = yPositions[j + 1] - y;
      const area = width * height;

      // Check if this panel is in the transom area
      const isTransom =
        opening.hasTransom &&
        opening.transomHeight &&
        y >= parseFloat(opening.height) - parseFloat(opening.transomHeight);

      const panel = await db
        .insert(glassPanels)
        .values({
          openingId: openingId,
          panelNumber: panelNumber,
          x: x.toString(),
          y: y.toString(),
          width: width.toString(),
          height: height.toString(),
          area: area.toString(),
          isTransom: isTransom || false,
          isOperable: false, // Default to fixed
        })
        .returning();

      panels.push(panel[0] as GlassPanel);
      panelNumber++;
    }
  }

  return panels;
}

// ============================================================================
// DOOR ACTIONS
// ============================================================================

export async function getDoorsByOpeningId(openingId: number): Promise<Door[]> {
  const doorsList = await db
    .select()
    .from(doors)
    .where(eq(doors.openingId, openingId))
    .orderBy(asc(doors.position));

  return doorsList as Door[];
}

export async function createDoor(data: CreateDoorInput): Promise<Door> {
  const newDoor = await db
    .insert(doors)
    .values({
      openingId: data.openingId,
      name: data.name,
      doorMark: data.doorMark,
      position: data.position.toString(),
      width: data.width.toString(),
      height: data.height.toString(),
      doorType: data.doorType,
      handingType: data.handingType,
      hasVision: data.hasVision ?? true,
      doorMaterial: data.doorMaterial,
      lockType: data.lockType,
      closerType: data.closerType,
      hasAutomaticOperator: data.hasAutomaticOperator ?? false,
      notes: data.notes,
    })
    .returning();

  return newDoor[0] as Door;
}

export async function deleteDoor(doorId: number): Promise<void> {
  await db.delete(doors).where(eq(doors.id, doorId));
}

// ============================================================================
// SPECIAL CONDITION ACTIONS
// ============================================================================

export async function getSpecialConditionsByElevationId(
  elevationId: number
): Promise<SpecialCondition[]> {
  const conditionsList = await db
    .select()
    .from(specialConditions)
    .where(eq(specialConditions.elevationId, elevationId))
    .orderBy(asc(specialConditions.position));

  return conditionsList as SpecialCondition[];
}

export async function createSpecialCondition(
  data: CreateSpecialConditionInput
): Promise<SpecialCondition> {
  const newCondition = await db
    .insert(specialConditions)
    .values({
      elevationId: data.elevationId,
      conditionType: data.conditionType,
      position: data.position.toString(),
      width: data.width?.toString(),
      height: data.height?.toString(),
      angle: data.angle?.toString(),
      description: data.description,
      notes: data.notes,
    })
    .returning();

  return newCondition[0] as SpecialCondition;
}

export async function deleteSpecialCondition(
  conditionId: number
): Promise<void> {
  await db
    .delete(specialConditions)
    .where(eq(specialConditions.id, conditionId));
}

// ============================================================================
// CALCULATION ACTIONS
// ============================================================================

export async function calculateBidSummary(bidId: number): Promise<BidSummary> {
  const bidData = await getBidWithElevations(bidId);
  if (!bidData) throw new Error("Bid not found");

  let totalGlassArea = 0;
  let totalFrameLinearFeet = 0;
  let doorCount = 0;
  let mullionCount = 0;
  let panelCount = 0;
  let totalMaterialCost = 0;
  let totalLaborCost = 0;

  for (const elevation of bidData.elevations) {
    for (const opening of elevation.openings) {
      // Calculate glass area
      for (const panel of opening.glassPanels) {
        totalGlassArea += parseFloat(panel.area);
        panelCount++;
      }

      // Calculate frame linear feet (perimeter of opening + mullions)
      const perimeterFeet =
        (parseFloat(opening.width) + parseFloat(opening.height)) * 2;
      totalFrameLinearFeet += perimeterFeet;

      // Add mullion lengths
      for (const mullion of opening.mullions) {
        if (mullion.type === "vertical") {
          totalFrameLinearFeet += parseFloat(opening.height);
        } else {
          totalFrameLinearFeet += parseFloat(opening.width);
        }
        mullionCount++;
      }

      doorCount += opening.doors.length;
      totalMaterialCost += parseFloat(opening.totalMaterialCost);
      totalLaborCost += parseFloat(opening.totalLaborCost);
    }
  }

  return {
    totalGlassArea: Math.round(totalGlassArea * 100) / 100,
    totalFrameLinearFeet: Math.round(totalFrameLinearFeet * 100) / 100,
    elevationCount: bidData.elevations.length,
    openingCount: bidData.elevations.reduce(
      (total, elev) => total + elev.openings.length,
      0
    ),
    doorCount,
    mullionCount,
    panelCount,
    totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
    totalLaborCost: Math.round(totalLaborCost * 100) / 100,
    totalCost: Math.round((totalMaterialCost + totalLaborCost) * 100) / 100,
  };
}

export async function calculateElevationSummary(
  elevationId: number
): Promise<ElevationSummary> {
  const elevationData = await getElevationWithOpenings(elevationId);
  if (!elevationData) throw new Error("Elevation not found");

  let totalGlassArea = 0;
  let totalFrameLinearFeet = 0;
  let doorCount = 0;
  let mullionCount = 0;
  let panelCount = 0;
  let materialCost = 0;
  let laborCost = 0;

  for (const opening of elevationData.openings) {
    // Calculate glass area
    for (const panel of opening.glassPanels) {
      totalGlassArea += parseFloat(panel.area);
      panelCount++;
    }

    // Calculate frame linear feet (perimeter of opening + mullions)
    const perimeterFeet =
      (parseFloat(opening.width) + parseFloat(opening.height)) * 2;
    totalFrameLinearFeet += perimeterFeet;

    // Add mullion lengths
    for (const mullion of opening.mullions) {
      if (mullion.type === "vertical") {
        totalFrameLinearFeet += parseFloat(opening.height);
      } else {
        totalFrameLinearFeet += parseFloat(opening.width);
      }
      mullionCount++;
    }

    doorCount += opening.doors.length;
    materialCost += parseFloat(opening.totalMaterialCost);
    laborCost += parseFloat(opening.totalLaborCost);
  }

  return {
    totalGlassArea: Math.round(totalGlassArea * 100) / 100,
    totalFrameLinearFeet: Math.round(totalFrameLinearFeet * 100) / 100,
    openingCount: elevationData.openings.length,
    doorCount,
    mullionCount,
    panelCount,
    materialCost: Math.round(materialCost * 100) / 100,
    laborCost: Math.round(laborCost * 100) / 100,
    totalCost: Math.round((materialCost + laborCost) * 100) / 100,
  };
}

// Grid Mullion Operations
export async function createGridMullion(
  data: CreateGridMullionInput
): Promise<GridMullion> {
  const newMullion = await db
    .insert(gridMullions)
    .values({
      openingId: data.openingId,
      gridType: data.gridType,
      gridColumn: data.gridColumn,
      gridRow: data.gridRow,
      gridSegment: data.gridSegment, // NEW
      length: data.length.toString(),
      componentName: data.componentName,
      defaultPosition: data.defaultPosition?.toString(),
      customPosition: data.customPosition?.toString(), // Convert to string
      startX: data.startX?.toString() || null, // NEW
      endX: data.endX?.toString() || null, // NEW
      isActive: data.isActive ?? true,
      notes: data.notes,
    })
    .returning();

  return newMullion[0] as GridMullion;
}

export async function updateGridMullion(
  data: UpdateGridMullionInput
): Promise<GridMullion> {
  const updateData: any = {};

  if (data.gridType !== undefined) updateData.gridType = data.gridType;
  if (data.gridColumn !== undefined) updateData.gridColumn = data.gridColumn;
  if (data.gridRow !== undefined) updateData.gridRow = data.gridRow;
  if (data.gridSegment !== undefined) updateData.gridSegment = data.gridSegment; // NEW
  if (data.length !== undefined) updateData.length = data.length.toString();
  if (data.componentName !== undefined)
    updateData.componentName = data.componentName;
  if (data.defaultPosition !== undefined)
    updateData.defaultPosition = data.defaultPosition.toString();
  if (data.customPosition !== undefined)
    updateData.customPosition = data.customPosition?.toString(); // Handle null values
  if (data.startX !== undefined) updateData.startX = data.startX?.toString(); // NEW - handle null values
  if (data.endX !== undefined) updateData.endX = data.endX?.toString(); // NEW - handle null values
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.notes !== undefined) updateData.notes = data.notes;

  updateData.updatedAt = new Date();

  const updatedMullion = await db
    .update(gridMullions)
    .set(updateData)
    .where(eq(gridMullions.id, data.id))
    .returning();

  return updatedMullion[0] as GridMullion;
}

export async function getGridMullionsByOpening(
  openingId: number
): Promise<GridMullion[]> {
  const mullions = await db
    .select()
    .from(gridMullions)
    .where(eq(gridMullions.openingId, openingId));

  return mullions as GridMullion[];
}

export async function deleteGridMullion(id: number): Promise<boolean> {
  try {
    await db.delete(gridMullions).where(eq(gridMullions.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting grid mullion:", error);
    return false;
  }
}

// Grid Glass Panel Operations
export async function createGridGlassPanel(
  data: CreateGridGlassPanelInput
): Promise<GridGlassPanel> {
  const area = (
    parseFloat(data.width.toString()) * parseFloat(data.height.toString())
  ).toString();
  const unitCost = parseFloat(data.unitCost?.toString() || "0");
  const totalCost = (parseFloat(area) * unitCost).toString();

  const newPanel = await db
    .insert(gridGlassPanels)
    .values({
      openingId: data.openingId,
      gridColumn: data.gridColumn,
      gridRow: data.gridRow,
      x: data.x.toString(),
      y: data.y.toString(),
      width: data.width.toString(),
      height: data.height.toString(),
      isTransom: data.isTransom ?? false,
      glassType: data.glassType || "Standard",
      isActive: data.isActive ?? true,
      area,
      unitCost: data.unitCost?.toString() || "0.00",
      totalCost,
      notes: data.notes,
    })
    .returning();

  return newPanel[0] as GridGlassPanel;
}

export async function getGridGlassPanelsByOpening(
  openingId: number
): Promise<GridGlassPanel[]> {
  const panels = await db
    .select()
    .from(gridGlassPanels)
    .where(eq(gridGlassPanels.openingId, openingId));

  return panels as GridGlassPanel[];
}

// Grid Configuration Operations
export async function createGridConfiguration(
  data: CreateGridConfigurationInput
): Promise<GridConfiguration> {
  const newConfig = await db
    .insert(gridConfigurations)
    .values({
      openingId: data.openingId,
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? false,
      columns: data.columns,
      rows: data.rows,
      mullionWidth: data.mullionWidth.toString(),
      createdBy: data.createdBy,
    })
    .returning();

  return newConfig[0] as GridConfiguration;
}

// Bulk create grid mullions (this is what generateGridForOpening needs)
export async function createGridMullions(
  mullions: CreateGridMullionInput[]
): Promise<GridMullion[]> {
  if (mullions.length === 0) return [];

  const newMullions = await db
    .insert(gridMullions)
    .values(
      mullions.map((data) => ({
        openingId: data.openingId,
        gridType: data.gridType,
        gridColumn: data.gridColumn,
        gridRow: data.gridRow,
        gridSegment: data.gridSegment, // NEW
        length: data.length.toString(),
        componentName: data.componentName,
        defaultPosition: data.defaultPosition?.toString() || "0",
        customPosition: data.customPosition?.toString() || null,
        startX: data.startX?.toString() || null, // NEW
        endX: data.endX?.toString() || null, // NEW
        isActive: data.isActive ?? true,
        notes: data.notes || null,
      }))
    )
    .returning();

  return newMullions as GridMullion[];
}

// Bulk create grid glass panels
export async function createGridGlassPanels(
  panels: CreateGridGlassPanelInput[]
): Promise<GridGlassPanel[]> {
  if (panels.length === 0) return [];

  const newPanels = await db
    .insert(gridGlassPanels)
    .values(
      panels.map((data) => {
        const area = (
          parseFloat(data.width.toString()) * parseFloat(data.height.toString())
        ).toString();
        const unitCost = parseFloat(data.unitCost?.toString() || "0");
        const totalCost = (parseFloat(area) * unitCost).toString();

        return {
          openingId: data.openingId,
          gridColumn: data.gridColumn,
          gridRow: data.gridRow,
          x: data.x.toString(),
          y: data.y.toString(),
          width: data.width.toString(),
          height: data.height.toString(),
          isTransom: data.isTransom ?? false,
          glassType: data.glassType || "Standard",
          isActive: data.isActive ?? true,
          area,
          unitCost: data.unitCost?.toString() || "0.00",
          totalCost,
          notes: data.notes || null,
        };
      })
    )
    .returning();

  return newPanels as GridGlassPanel[];
}

// Also update your generateGridForOpening function to use the bulk functions
export async function generateGridForOpening(openingId: number): Promise<{
  mullions: GridMullion[];
  glassPanels: GridGlassPanel[];
}> {
  // Get opening details
  const opening = await getOpeningById(openingId);
  if (!opening) {
    throw new Error("Opening not found");
  }

  // Clear existing grid elements
  await db.delete(gridMullions).where(eq(gridMullions.openingId, openingId));
  await db
    .delete(gridGlassPanels)
    .where(eq(gridGlassPanels.openingId, openingId));

  // Calculate grid dimensions
  const dimensions: GridDimensions = {
    openingWidth: parseFloat(opening.width),
    openingHeight: parseFloat(opening.height),
    columns: opening.gridColumns,
    rows: opening.gridRows,
    mullionWidth: parseFloat(opening.mullionWidth),
    hasTransom: opening.hasTransom,
    transomHeight: opening.transomHeight
      ? parseFloat(opening.transomHeight)
      : undefined,
  };

  // Validate dimensions
  const errors = GridCalculator.validateGridDimensions(dimensions);
  if (errors.length > 0) {
    throw new Error(`Grid validation failed: ${errors.join(", ")}`);
  }

  // Calculate grid layout
  const calculatedGrid = GridCalculator.calculateGrid(dimensions);

  // Component names from opening
  const componentNames = {
    sill: opening.componentSill || "Sill",
    head: opening.componentHead || "Head",
    jambs: opening.componentJambs || "Jamb",
    verticals: opening.componentVerticals || "Vertical",
    horizontals: opening.componentHorizontals || "Horizontal",
  };

  // Create mullion inputs with the new segmentation data
  const mullionInputs = GridCalculator.gridToMullionInputs(
    openingId,
    calculatedGrid,
    componentNames
  );

  // Create glass panel inputs
  const panelInputs = GridCalculator.gridToGlassPanelInputs(
    openingId,
    calculatedGrid
  );

  // Use bulk create functions
  const mullions = await createGridMullions(mullionInputs);
  const glassPanels = await createGridGlassPanels(panelInputs);

  return { mullions, glassPanels };
}

// Get opening with complete grid data
export async function getOpeningWithGrid(
  openingId: number
): Promise<OpeningWithGrid | null> {
  const opening = await getOpeningById(openingId);
  if (!opening) {
    return null;
  }

  const [mullions, glassPanels, configurations] = await Promise.all([
    getGridMullionsByOpening(openingId),
    getGridGlassPanelsByOpening(openingId),
    getGridConfigurationsByOpening(openingId),
  ]);

  const activeConfiguration = configurations.find((c) => c.isActive) || null;

  return {
    ...opening,
    gridMullions: mullions,
    gridGlassPanels: glassPanels,
    gridConfigurations: configurations,
    activeConfiguration,
  } as OpeningWithGrid;
}

export async function getGridConfigurationsByOpening(
  openingId: number
): Promise<GridConfiguration[]> {
  const configs = await db
    .select()
    .from(gridConfigurations)
    .where(eq(gridConfigurations.openingId, openingId));

  return configs as GridConfiguration[];
}

// Toggle mullion active state
export async function toggleGridMullion(
  mullionId: number,
  isActive: boolean
): Promise<GridMullion> {
  const updatedMullion = await db
    .update(gridMullions)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(gridMullions.id, mullionId))
    .returning();

  return updatedMullion[0] as GridMullion;
}

// Move mullion to new position
export async function moveGridMullion(
  mullionId: number,
  newPosition: number
): Promise<GridMullion> {
  const updatedMullion = await db
    .update(gridMullions)
    .set({
      customPosition: newPosition.toString(), // Convert to string
      updatedAt: new Date(),
    })
    .where(eq(gridMullions.id, mullionId))
    .returning();

  return updatedMullion[0] as GridMullion;
}

// Bulk update mullions
export async function bulkUpdateGridMullions(
  updates: Array<{ id: number; data: Partial<UpdateGridMullionInput> }>
): Promise<GridMullion[]> {
  const results: GridMullion[] = [];

  for (const update of updates) {
    const result = await updateGridMullion({ id: update.id, ...update.data });
    results.push(result);
  }

  return results;
}

// Update grid configuration and regenerate
export async function updateGridAndRegenerate(
  openingId: number,
  newGridParams: {
    columns: number;
    rows: number;
    mullionWidth: number;
  }
): Promise<{
  opening: Opening;
  mullions: GridMullion[];
  glassPanels: GridGlassPanel[];
}> {
  // Update the opening with new grid parameters
  const updatedOpening = await updateOpening({
    id: openingId,
    gridColumns: newGridParams.columns,
    gridRows: newGridParams.rows,
    mullionWidth: newGridParams.mullionWidth.toString(),
  });

  // Regenerate the grid
  const { mullions, glassPanels } = await generateGridForOpening(openingId);

  return {
    opening: updatedOpening,
    mullions,
    glassPanels,
  };
}

// Save current grid as a configuration
export async function saveGridConfiguration(
  openingId: number,
  name: string,
  description?: string,
  createdBy?: string
): Promise<GridConfiguration> {
  const opening = await getOpeningById(openingId);
  if (!opening) {
    throw new Error("Opening not found");
  }

  const mullions = await getGridMullionsByOpening(openingId);
  const glassPanels = await getGridGlassPanelsByOpening(openingId);

  const totalMullionLength =
    GridCalculator.calculateTotalMullionLength(mullions);
  const totalGlassArea = GridCalculator.calculateTotalGlassArea(glassPanels);

  const newConfig = await db
    .insert(gridConfigurations)
    .values({
      openingId,
      name,
      description,
      isActive: false,
      columns: opening.gridColumns,
      rows: opening.gridRows,
      mullionWidth: opening.mullionWidth,
      totalMullionLength: totalMullionLength.toString(),
      totalGlassArea: totalGlassArea.toString(),
      estimatedCost: "0.00", // You can calculate this based on your pricing logic
      createdBy,
    })
    .returning();

  return newConfig[0] as GridConfiguration;
}

// Load a grid configuration
export async function loadGridConfiguration(configurationId: number): Promise<{
  opening: Opening;
  mullions: GridMullion[];
  glassPanels: GridGlassPanel[];
}> {
  const config = await db
    .select()
    .from(gridConfigurations)
    .where(eq(gridConfigurations.id, configurationId))
    .limit(1);

  if (!config.length) {
    throw new Error("Configuration not found");
  }

  const configuration = config[0] as GridConfiguration;

  // Update opening to match configuration
  const updatedOpening = await updateOpening({
    id: configuration.openingId,
    gridColumns: configuration.columns,
    gridRows: configuration.rows,
    mullionWidth: configuration.mullionWidth,
  });

  // Set this configuration as active
  await db
    .update(gridConfigurations)
    .set({ isActive: false })
    .where(eq(gridConfigurations.openingId, configuration.openingId));

  await db
    .update(gridConfigurations)
    .set({ isActive: true })
    .where(eq(gridConfigurations.id, configurationId));

  // Regenerate grid based on configuration
  const { mullions, glassPanels } = await generateGridForOpening(
    configuration.openingId
  );

  return {
    opening: updatedOpening,
    mullions,
    glassPanels,
  };
}

// Get grid statistics for an opening
export async function getGridStatistics(openingId: number) {
  const [mullions, glassPanels] = await Promise.all([
    getGridMullionsByOpening(openingId),
    getGridGlassPanelsByOpening(openingId),
  ]);

  const stats = GridCalculator.getGridStats(mullions, glassPanels);

  const estimatedMullionCost = stats.totalMullionLength * 50; // Example: $50 per linear foot
  const estimatedGlassCost = stats.totalGlassArea * 25; // Example: $25 per square foot
  const totalEstimatedCost = estimatedMullionCost + estimatedGlassCost;

  return {
    ...stats,
    estimatedMullionCost,
    estimatedGlassCost,
    totalEstimatedCost,
  };
}

// Delete all grid elements for an opening
export async function clearGrid(openingId: number): Promise<boolean> {
  try {
    await Promise.all([
      db.delete(gridMullions).where(eq(gridMullions.openingId, openingId)),
      db
        .delete(gridGlassPanels)
        .where(eq(gridGlassPanels.openingId, openingId)),
    ]);
    return true;
  } catch (error) {
    console.error("Error clearing grid:", error);
    return false;
  }
}

// Validate and fix grid consistency
export async function validateGridConsistency(openingId: number): Promise<{
  isValid: boolean;
  issues: string[];
  autoFixed?: boolean;
}> {
  const opening = await getOpeningById(openingId);
  if (!opening) {
    return { isValid: false, issues: ["Opening not found"] };
  }

  const [mullions, glassPanels] = await Promise.all([
    getGridMullionsByOpening(openingId),
    getGridGlassPanelsByOpening(openingId),
  ]);

  const issues: string[] = [];

  // Check if we have the expected number of elements
  const expectedVerticalMullions = opening.gridColumns - 1;
  const expectedHorizontalMullions =
    opening.gridRows - 1 + (opening.hasTransom ? 1 : 0);
  const expectedGlassPanels =
    opening.gridColumns * opening.gridRows +
    (opening.hasTransom ? opening.gridColumns : 0);

  const actualVerticalMullions = mullions.filter(
    (m) => m.gridType === "vertical"
  ).length;
  const actualHorizontalMullions = mullions.filter(
    (m) => m.gridType === "horizontal"
  ).length;
  const actualGlassPanels = glassPanels.length;

  if (actualVerticalMullions !== expectedVerticalMullions) {
    issues.push(
      `Expected ${expectedVerticalMullions} vertical mullions, found ${actualVerticalMullions}`
    );
  }

  if (actualHorizontalMullions !== expectedHorizontalMullions) {
    issues.push(
      `Expected ${expectedHorizontalMullions} horizontal mullions, found ${actualHorizontalMullions}`
    );
  }

  if (actualGlassPanels !== expectedGlassPanels) {
    issues.push(
      `Expected ${expectedGlassPanels} glass panels, found ${actualGlassPanels}`
    );
  }

  // Check for overlapping glass panels
  const activePanels = glassPanels.filter((p) => p.isActive);
  for (let i = 0; i < activePanels.length; i++) {
    for (let j = i + 1; j < activePanels.length; j++) {
      const panel1 = activePanels[i];
      const panel2 = activePanels[j];

      if (
        panel1.gridColumn === panel2.gridColumn &&
        panel1.gridRow === panel2.gridRow
      ) {
        issues.push(
          `Overlapping panels at grid position ${panel1.gridColumn},${panel1.gridRow}`
        );
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
