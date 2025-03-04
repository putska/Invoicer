// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../admin/helpers"; // Use your custom helper
import {
  getOptimizationJobs,
  getOptimizationResults,
} from "../../../app/db/actions";

export async function GET(req: NextRequest) {
  try {
    // Get user ID from Clerk authentication
    const user = await authenticate(req);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    // Use user.id instead of userId
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("id");

    // If job ID is provided, get that specific job's results
    if (jobId) {
      const results = await getOptimizationResults(parseInt(jobId));

      if (!results) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      return NextResponse.json(results);
    }

    // Otherwise, get all jobs for the user
    const jobs = await getOptimizationJobs(userId);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error fetching jobs",
      },
      { status: 500 }
    );
  }
}
