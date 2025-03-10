"use client";

// Import the types
import { FormSubmission } from "../../types";

// Search forms function
export async function searchForms(query: string) {
  try {
    // Call the server action using fetch
    const response = await fetch(`/api/safety?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Search failed");
    return await response.json();
  } catch (error) {
    console.error("Error searching forms:", error);
    throw error;
  }
}

// Delete form function
export async function deleteSafetyForm(id: number): Promise<boolean> {
  try {
    // Call the server action using fetch
    const response = await fetch(`/api/safety/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Delete failed");
    return true;
  } catch (error) {
    console.error("Error deleting form:", error);
    throw error;
  }
}

// Load all forms function
export async function loadAllForms(): Promise<FormSubmission[]> {
  try {
    // Call the server action using fetch
    const response = await fetch("/api/safety");
    if (!response.ok) throw new Error("Loading failed");
    const data = await response.json();
    return data.submissions || [];
  } catch (error) {
    console.error("Error loading forms:", error);
    throw error;
  }
}
