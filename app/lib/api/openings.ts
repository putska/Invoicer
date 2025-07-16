// lib/api/openings.ts - Frontend API helper functions

import {
  CreateOpeningInput,
  UpdateOpeningInput,
  OpeningWithDetails,
  CreateOpeningResponse,
  UpdateOpeningResponse,
  GetOpeningResponse,
  GetOpeningsResponse,
  DeleteOpeningResponse,
} from "../../types"; // Adjust path as needed

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Create a new opening
export async function createOpeningAPI(
  data: CreateOpeningInput
): Promise<OpeningWithDetails> {
  const response = await fetch(`${API_BASE_URL}/api/openings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result: CreateOpeningResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to create opening");
  }

  return result.data as OpeningWithDetails;
}

// Get all openings for an elevation
export async function getOpeningsAPI(
  elevationId: number,
  includeStats = false
): Promise<{ openings: OpeningWithDetails[]; stats?: any }> {
  const params = new URLSearchParams({
    elevationId: elevationId.toString(),
    ...(includeStats && { includeStats: "true" }),
  });

  const response = await fetch(`${API_BASE_URL}/api/openings?${params}`);
  const result: GetOpeningsResponse & { stats?: any } = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch openings");
  }

  return {
    openings: result.data,
    stats: result.stats,
  };
}

// Get a specific opening by ID
export async function getOpeningAPI(id: number): Promise<OpeningWithDetails> {
  const response = await fetch(`${API_BASE_URL}/api/openings/${id}`);
  const result: GetOpeningResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch opening");
  }

  return result.data;
}

// Update an opening
export async function updateOpeningAPI(
  id: number,
  data: Partial<UpdateOpeningInput>
): Promise<OpeningWithDetails> {
  const response = await fetch(`${API_BASE_URL}/api/openings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result: UpdateOpeningResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to update opening");
  }

  return result.data as OpeningWithDetails;
}

// Delete an opening
export async function deleteOpeningAPI(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/openings/${id}`, {
    method: "DELETE",
  });

  const result: DeleteOpeningResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to delete opening");
  }
}

// Duplicate an opening
export async function duplicateOpeningAPI(
  id: number,
  namePrefix?: string
): Promise<OpeningWithDetails> {
  const response = await fetch(`${API_BASE_URL}/api/openings/${id}/duplicate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ namePrefix }),
  });

  const result: CreateOpeningResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to duplicate opening");
  }

  return result.data as OpeningWithDetails;
}

// Bulk update openings
export async function bulkUpdateOpeningsAPI(
  updates: Array<{ id: number; data: Partial<UpdateOpeningInput> }>
): Promise<OpeningWithDetails[]> {
  const response = await fetch(`${API_BASE_URL}/api/openings/bulk`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  const result: {
    success: boolean;
    data?: OpeningWithDetails[];
    error?: string;
  } = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to bulk update openings");
  }

  return result.data;
}

// Get opening statistics for an elevation
export async function getOpeningStatsAPI(elevationId: number): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/api/elevations/${elevationId}/openings/stats`
  );
  const result: { success: boolean; data?: any; error?: string } =
    await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch opening statistics");
  }

  return result.data;
}

// React hooks for easier usage in components
import { useState, useEffect } from "react";

// Hook to fetch openings for an elevation
export function useOpenings(elevationId: number, includeStats = false) {
  const [openings, setOpenings] = useState<OpeningWithDetails[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpenings = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getOpeningsAPI(elevationId, includeStats);
      setOpenings(result.openings);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (elevationId) {
      fetchOpenings();
    }
  }, [elevationId]);

  return {
    openings,
    stats,
    loading,
    error,
    refetch: fetchOpenings,
  };
}

// Hook to fetch a single opening
export function useOpening(id: number | null) {
  const [opening, setOpening] = useState<OpeningWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOpening = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getOpeningAPI(id);
      setOpening(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpening();
  }, [id]);

  return {
    opening,
    loading,
    error,
    refetch: fetchOpening,
  };
}

// Error handling helper
export class OpeningAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "OpeningAPIError";
  }
}

// Validation helpers
export function validateCreateOpeningInput(data: CreateOpeningInput): string[] {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push("Opening name is required");
  }

  if (!data.elevationId || data.elevationId <= 0) {
    errors.push("Valid elevation ID is required");
  }

  const width =
    typeof data.width === "string" ? parseFloat(data.width) : data.width;
  if (!width || width <= 0) {
    errors.push("Width must be greater than 0");
  }

  const height =
    typeof data.height === "string" ? parseFloat(data.height) : data.height;
  if (!height || height <= 0) {
    errors.push("Height must be greater than 0");
  }

  const sillHeight =
    typeof data.sillHeight === "string"
      ? parseFloat(data.sillHeight)
      : data.sillHeight;
  if (sillHeight < 0) {
    errors.push("Sill height cannot be negative");
  }

  if (data.gridColumns && (data.gridColumns < 1 || data.gridColumns > 20)) {
    errors.push("Grid columns must be between 1 and 20");
  }

  if (data.gridRows && (data.gridRows < 1 || data.gridRows > 20)) {
    errors.push("Grid rows must be between 1 and 20");
  }

  const mullionWidth =
    typeof data.mullionWidth === "string"
      ? parseFloat(data.mullionWidth)
      : data.mullionWidth;
  if (mullionWidth && (mullionWidth <= 0 || mullionWidth > 6)) {
    errors.push("Mullion width must be between 0 and 6 inches");
  }

  return errors;
}
