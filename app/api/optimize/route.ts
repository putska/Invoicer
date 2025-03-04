// app/api/optimize/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  optimizeExtrusions,
  findBestStockLength,
} from "../../components/optimization";
import {
  createOptimizationJob,
  saveOptimizationResults,
} from "../../../app/db/actions";
import { authenticate } from "../admin/helpers"; // Custom authentication helper

export async function POST(req: NextRequest) {
  try {
    // ============== AUTHENTICATION ==============
    // Verify the user is authenticated and get their user object
    const user = await authenticate(req);

    // If authentication failed, the helper returns a NextResponse error
    if (user instanceof NextResponse) {
      return user; // Return the error response directly
    }

    // Get the authenticated user's ID from the database
    const userId = user.id;

    // ============== DATA PARSING & VALIDATION ==============
    // Parse the JSON request body
    const data = await req.json();

    // Ensure we have parts data to optimize
    if (!data.parts || !Array.isArray(data.parts) || data.parts.length === 0) {
      return NextResponse.json(
        { error: "Invalid input: parts array is required" },
        { status: 400 }
      );
    }

    // Extract all the parameters from the request
    const {
      parts,
      stockLengths,
      bladeWidth = 0.25, // Default blade width
      findOptimalLength = false, // Whether to auto-determine stock length
    } = data;

    // ============== DATABASE RECORD CREATION ==============
    // Create a database record for this optimization job
    const jobName = `Optimization ${new Date().toLocaleString()}`;
    const newJob = await createOptimizationJob(userId, jobName, bladeWidth);

    let result;

    // ============== OPTIMIZATION LOGIC BRANCH ==============
    if (findOptimalLength) {
      // ------------ AUTO-OPTIMIZATION PATH ------------
      // If we're auto-determining the stock length
      const minLength = data.minLength || 180;
      const maxLength = data.maxLength || 300;

      // Calculate the best stock length to use
      const optimalLength = findBestStockLength(
        parts,
        minLength,
        maxLength,
        bladeWidth
      );

      // Get unique part numbers from the parts array
      const uniquePartNumbers = parts
        .map((part: { part_no: string }) => part.part_no)
        .filter(
          (value: string, index: number, self: string[]) =>
            self.indexOf(value) === index
        );

      // Create stock lengths entries using the optimal length
      const updatedStockLengths = uniquePartNumbers.map((part_no: string) => {
        const finish =
          parts.find(
            (p: { part_no: string; finish?: string }) => p.part_no === part_no
          )?.finish || "";
        return {
          part_no,
          finish,
          length1: optimalLength,
          length2: 0,
          qty1: 1000,
          qty2: 0,
        };
      });

      // Run the actual optimization algorithm with our calculated best length
      result = optimizeExtrusions(parts, updatedStockLengths, bladeWidth);

      // Save the optimization results to the database
      await saveOptimizationResults(newJob.id, result);

      // Return the complete results to the client
      return NextResponse.json({
        jobId: newJob.id,
        optimalLength, // Include the determined optimal length
        ...result,
      });
    } else {
      // ------------ MANUAL STOCK LENGTHS PATH ------------
      // Using user-provided stock lengths
      if (!stockLengths || !Array.isArray(stockLengths)) {
        return NextResponse.json(
          {
            error:
              "Invalid input: stockLengths array is required when not finding optimal length",
          },
          { status: 400 }
        );
      }

      // Run optimization with user-provided stock lengths
      result = optimizeExtrusions(parts, stockLengths, bladeWidth);

      // Save the results to the database
      await saveOptimizationResults(newJob.id, result);

      // Return the complete results to the client
      return NextResponse.json({
        jobId: newJob.id,
        ...result,
      });
    }
  } catch (error) {
    // ============== ERROR HANDLING ==============
    // Log the full error details on the server
    console.error("Optimization error:", error);

    // Return a user-friendly error message
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during optimization",
      },
      { status: 500 }
    );
  }
}
