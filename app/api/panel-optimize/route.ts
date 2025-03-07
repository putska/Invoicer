// app/api/panel-optimize/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  optimizePanels,
  findBestSheetSize,
} from "../../components/panelOptimization";
import {
  createPanelJob,
  savePanelOptimizationResults,
} from "../../../app/db/actions";
import { authenticate } from "../admin/helpers";

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    const userId = user.id;

    const data = await req.json();
    console.log("Panel optimization request received:", data);

    // Validate input data
    if (
      !data.panels ||
      !Array.isArray(data.panels) ||
      data.panels.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid input: panels array is required" },
        { status: 400 }
      );
    }

    // Extract parameters
    const {
      panels,
      sheets,
      bladeWidth = 0.25,
      allowRotation = true,
      findOptimalSheet = false,
    } = data;

    // Create a new optimization job
    const jobName = `Panel Optimization ${new Date().toLocaleString()}`;
    const newJob = await createPanelJob(
      userId,
      jobName,
      bladeWidth,
      allowRotation
    );
    console.log("Panel optimization job created:", newJob.id);

    let result;

    // If findOptimalSheet flag is true, determine best sheet size first
    if (findOptimalSheet) {
      console.log("Finding optimal sheet size");
      console.log("Min Width: ", data.minWidth);
      console.log("Max Width: ", data.maxWidth);
      console.log("Min Height: ", data.minHeight);
      console.log("Max Height: ", data.maxHeight);
      console.log("Step Size: ", data.stepSize);
      console.log("Blade Width: ", bladeWidth);
      const minWidth = data.minWidth || 48;
      const maxWidth = data.maxWidth || 96;
      const minHeight = data.minHeight || 48;
      const maxHeight = data.maxHeight || 96;
      const stepSize = data.stepSize || 12;

      const optimalSheet = findBestSheetSize(
        panels,
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
        stepSize,
        bladeWidth,
        allowRotation
      );
      console.log("Optimal sheet size determined:", optimalSheet);

      // Create a sheet with the optimal dimensions
      const optimizedSheet = {
        id: 1,
        width: optimalSheet.width,
        height: optimalSheet.height,
        qty: 1000, // Set a high quantity for optimization
      };

      // Run optimization with this sheet
      console.log("Running optimization with optimal sheet size");
      result = optimizePanels(
        panels,
        [optimizedSheet],
        bladeWidth,
        allowRotation
      );
      console.log("Optimization complete");

      // Save the results to the database
      await savePanelOptimizationResults(newJob.id, result, panels, [
        optimizedSheet,
      ]);

      return NextResponse.json({
        jobId: newJob.id,
        optimalSheet,
        ...result,
      });
    } else {
      // Use provided sheets
      if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
        return NextResponse.json(
          {
            error:
              "Invalid input: sheets array is required when not finding optimal sheet size",
          },
          { status: 400 }
        );
      }

      console.log("Running optimization with provided sheets");
      result = optimizePanels(panels, sheets, bladeWidth, allowRotation);
      console.log("Optimization complete");

      // Save the results to the database
      await savePanelOptimizationResults(newJob.id, result, panels, sheets);

      return NextResponse.json({
        jobId: newJob.id,
        ...result,
      });
    }
  } catch (error) {
    console.error("Panel optimization error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during panel optimization",
      },
      { status: 500 }
    );
  }
}
