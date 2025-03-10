// lib/panelOptimization.ts

/**
 * Core functions for optimizing 2D panel placement on sheets
 */

// Update the Interfaces to match the new functionality
export interface Panel {
  id: number;
  qty: number;
  part_no?: string;
  width: number;
  height: number;
  mark_no: string;
  finish?: string;
}

export interface Sheet {
  id: number;
  width: number;
  height: number;
  qty: number;
  maxQty?: number;
}

export interface CutPatternItem {
  stockId: number;
  sheetId: number;
  sheetNo: number;
  stockLength: number;
  cuts: Cut[];
  remainingLength: number;
}

export interface Placement {
  panelId: number;
  sheetId: number;
  sheetNo: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  mark: string;
}

export interface Cut {
  part_no: string;
  length: number;
  height: number;
  mark: string;
  finish: string;
  fab: string;
}

export interface CutSheet {
  sheetId: number;
  sheetNo: number;
  width: number;
  height: number;
  usedArea: number;
  wastePercentage: number;
}

export interface PanelOptimizationResult {
  placements: Placement[];
  sheets: CutSheet[];
  summary: {
    totalSheets: number;
    totalArea: number;
    usedArea: number;
    wastePercentage: number;
    totalPanelsPlaced: number;
    totalPanelsNeeded: number;
    sheetTypesUsed: number;
  };
  optimalSheet?: {
    width: number;
    height: number;
  };
}

/**
 * Find the best sheet size for a given set of panels
 * @param panels List of panels to optimize
 * @param minWidth Minimum sheet width to consider
 * @param maxWidth Maximum sheet width to consider
 * @param minHeight Minimum sheet height to consider
 * @param maxHeight Maximum sheet height to consider
 * @param stepSize Increment for testing different sheet sizes
 * @param bladeWidth Width of the cutting blade/space between panels
 * @param allowRotation Whether panels can be rotated
 * @returns The optimal sheet dimensions
 */
export function findBestSheetSize(
  panels: Panel[],
  minWidth: number = 84,
  maxWidth: number = 144,
  minHeight: number = 48,
  maxHeight: number = 62,
  stepSize: number = 12,
  bladeWidth: number = 0.25,
  allowRotation: boolean = true
): { width: number; height: number } {
  // 1. Calculate total panel area to estimate minimum required sheet area
  const totalPanelArea = panels.reduce(
    (sum, panel) => sum + panel.width * panel.height * panel.qty,
    0
  );

  // 2. Add an estimate for waste (typically 10-20%)
  const estimatedMinSheetArea = totalPanelArea * 1.15;

  // 3. Calculate total perimeter to account for cutting waste
  const totalPerimeter = panels.reduce(
    (sum, panel) => sum + 2 * (panel.width + panel.height) * panel.qty,
    0
  );

  // 4. Use heuristics to prioritize most promising sheet sizes
  const candidateSheets: Array<{
    width: number;
    height: number;
    score: number;
  }> = [];

  for (let width = minWidth; width <= maxWidth; width += stepSize) {
    for (let height = minHeight; height <= maxHeight; height += stepSize) {
      const sheetArea = width * height;

      // Skip sheet sizes that are clearly too small
      if (sheetArea < estimatedMinSheetArea / 1.5) continue;

      // Calculate a heuristic score (lower is better)
      // This prioritizes sheets with area close to what we need
      const areaScore = Math.abs(sheetArea - estimatedMinSheetArea);

      // Factor in panel dimensions - prefer sheet dimensions that are multiples of panel sizes
      const dimensionScore = calculateDimensionScore(
        panels,
        width,
        height,
        allowRotation
      );

      // Calculate final score (lower is better)
      const score = areaScore + dimensionScore;

      candidateSheets.push({ width, height, score });
    }
  }

  // 5. Sort sheets by score (most promising first)
  candidateSheets.sort((a, b) => a.score - b.score);

  // 6. Try the top N most promising sheets (limit computation)
  const topCandidates = candidateSheets.slice(0, 5);

  // 7. Run full optimization only on these candidates
  let bestWidth = minWidth;
  let bestHeight = minHeight;
  let bestWaste = Number.MAX_VALUE;

  for (const candidate of topCandidates) {
    const testSheet: Sheet = {
      id: 1,
      width: candidate.width,
      height: candidate.height,
      qty: 1000,
      maxQty: 1000,
    };

    const result = optimizePanelsRecursive(
      panels,
      [testSheet],
      bladeWidth,
      allowRotation
    );
    const totalMaterial =
      result.sheets.length * (candidate.width * candidate.height);

    if (totalMaterial < bestWaste) {
      bestWaste = totalMaterial;
      bestWidth = candidate.width;
      bestHeight = candidate.height;
    }
  }

  return { width: bestWidth, height: bestHeight };
}

// Helper function to score how well panel dimensions match sheet dimensions
function calculateDimensionScore(
  panels: Panel[],
  sheetWidth: number,
  sheetHeight: number,
  allowRotation: boolean
): number {
  let score = 0;

  // Get unique panel dimensions
  const panelDimensions = new Set<string>();
  panels.forEach((panel) => {
    panelDimensions.add(`${panel.width},${panel.height}`);
    if (allowRotation) {
      panelDimensions.add(`${panel.height},${panel.width}`);
    }
  });

  // Calculate how well panels fit without waste
  for (const dimStr of panelDimensions) {
    const [width, height] = dimStr.split(",").map(Number);

    // How many times this panel fits across the width and height
    const acrossWidth = Math.floor(sheetWidth / width);
    const acrossHeight = Math.floor(sheetHeight / height);

    // Calculate waste for this panel type
    const widthWaste = sheetWidth - acrossWidth * width;
    const heightWaste = sheetHeight - acrossHeight * height;

    // Add to score (lower is better)
    score += widthWaste / sheetWidth + heightWaste / sheetHeight;
  }

  return score;
}

// Enhanced Guillotine Cutting Algorithm

/**
 * This implements a more traditional guillotine cutting algorithm
 * that closely follows the approach from the original VBA code
 */

/**
 * Place panels on a single sheet with improved positioning
 */
/**
 * Place panels on a single sheet with improved column-first strategy
 */
/**
 * Place panels on a sheet using a strict column-first approach
 * that closely matches the VBA algorithm's behavior
 */
/**
 * Optimizes panels using a recursive guillotine cutting approach that maximizes
 * the usage of both drops and balances after each cut
 */
export function optimizePanelsRecursive(
  panels: Panel[],
  sheets: Sheet[],
  bladeWidth: number = 0.25,
  allowRotation: boolean = true
): PanelOptimizationResult {
  // Clone input data to avoid modifying originals
  const panelsData = panels.map((p) => ({ ...p }));
  let sheetsData = sheets.map((s) => ({ ...s, maxQty: s.maxQty ?? s.qty }));

  // Sort panels by area (largest first)
  const sortedPanels = [...panelsData].sort(
    (a, b) => b.width * b.height - a.width * a.height
  );

  // Initialize results
  const placements: Placement[] = [];
  const usedSheets: CutSheet[] = [];

  // Track total panels to place
  const totalPanelsToPlace = sortedPanels.reduce((sum, p) => sum + p.qty, 0);
  let panelsPlaced = 0;

  // Keep track of sheet consumption
  const sheetCounts = new Map<number, number>();
  sheetsData.forEach((s) => sheetCounts.set(s.id, 0));

  // Main optimization loop
  while (
    sortedPanels.some((p) => p.qty > 0) &&
    panelsPlaced < totalPanelsToPlace
  ) {
    // Find the best sheet for the current set of panels
    let bestSheetIndex = -1;
    let bestPlacementResult: {
      placements: Placement[];
      usedArea: number;
      panelsPlaced: number;
    } | null = null;

    // Try each available sheet
    for (let i = 0; i < sheetsData.length; i++) {
      const sheet = sheetsData[i];
      if (sheet.qty <= 0) continue;

      // Try to place panels on this sheet using recursive approach
      const result = placeRecursive(
        sortedPanels,
        {
          sheetId: sheet.id,
          width: sheet.width,
          height: sheet.height,
          x: 0,
          y: 0,
        },
        bladeWidth,
        allowRotation
      );

      // Calculate efficiency score based on area utilization and panels placed
      const areaEfficiency = result.usedArea / (sheet.width * sheet.height);
      const panelEfficiency = result.panelsPlaced / sortedPanels.length;
      const score = areaEfficiency * 0.7 + panelEfficiency * 0.3;

      if (
        result.panelsPlaced > 0 &&
        (bestSheetIndex === -1 ||
          (bestPlacementResult &&
            (result.panelsPlaced > bestPlacementResult.panelsPlaced ||
              (result.panelsPlaced === bestPlacementResult.panelsPlaced &&
                score >
                  (bestPlacementResult.usedArea /
                    (sheetsData[bestSheetIndex].width *
                      sheetsData[bestSheetIndex].height)) *
                    0.7 +
                    (bestPlacementResult.panelsPlaced / sortedPanels.length) *
                      0.3))))
      ) {
        bestSheetIndex = i;
        bestPlacementResult = result;
      }
    }

    // If no suitable sheet is found, break
    if (bestSheetIndex === -1 || !bestPlacementResult) break;

    // Use the selected sheet
    const selectedSheet = sheetsData[bestSheetIndex];

    // Update sheet usage count
    const usageCount = (sheetCounts.get(selectedSheet.id) || 0) + 1;
    sheetCounts.set(selectedSheet.id, usageCount);

    // Update sheet numbers in placements
    bestPlacementResult.placements.forEach((p) => {
      p.sheetNo = usageCount;
    });

    // Add placements to results
    placements.push(...bestPlacementResult.placements);

    // Add sheet to used sheets
    usedSheets.push({
      sheetId: selectedSheet.id,
      sheetNo: usageCount,
      width: selectedSheet.width,
      height: selectedSheet.height,
      usedArea: bestPlacementResult.usedArea,
      wastePercentage:
        100 *
        (1 -
          bestPlacementResult.usedArea /
            (selectedSheet.width * selectedSheet.height)),
    });

    // Update panel quantities based on what was placed
    // We keep track of placed panels by ID and decrement their quantities
    const placedPanelIds = bestPlacementResult.placements.map((p) => p.panelId);
    for (const panelId of placedPanelIds) {
      const panelIndex = sortedPanels.findIndex((p) => p.id === panelId);
      if (panelIndex >= 0 && sortedPanels[panelIndex].qty > 0) {
        sortedPanels[panelIndex].qty--;
      }
    }

    // Update sheet quantity
    sheetsData[bestSheetIndex].qty--;
    sheetsData = sheetsData.filter((s) => s.qty > 0);

    // Update panels placed count
    panelsPlaced += bestPlacementResult.panelsPlaced;
  }

  // Calculate summary statistics
  const totalArea = usedSheets.reduce((sum, s) => sum + s.width * s.height, 0);
  const usedArea = usedSheets.reduce((sum, s) => sum + s.usedArea, 0);
  const wastePercentage = totalArea ? 100 * (1 - usedArea / totalArea) : 0;

  return {
    placements,
    sheets: usedSheets,
    summary: {
      totalSheets: usedSheets.length,
      totalArea,
      usedArea,
      wastePercentage,
      totalPanelsPlaced: panelsPlaced,
      totalPanelsNeeded: totalPanelsToPlace,
      sheetTypesUsed: [...sheetCounts.entries()].filter(
        ([_, count]) => count > 0
      ).length,
    },
  };
}

/**
 * Recursively place panels on a sheet, maximizing usage of drops and balances
 */
function placeRecursive(
  panels: Panel[],
  sheet: {
    sheetId: number;
    width: number;
    height: number;
    x: number;
    y: number;
  },
  bladeWidth: number,
  allowRotation: boolean
): {
  placements: Placement[];
  usedArea: number;
  panelsPlaced: number;
} {
  // If sheet is too small to place any panel, return empty result
  if (sheet.width <= 0 || sheet.height <= 0) {
    return { placements: [], usedArea: 0, panelsPlaced: 0 };
  }

  // Find the best panel to place on this sheet
  const panelFit = findBestPanelFit(
    panels,
    sheet.width,
    sheet.height,
    allowRotation
  );

  // If no panel fits, return empty result
  if (!panelFit) {
    return { placements: [], usedArea: 0, panelsPlaced: 0 };
  }

  const { panel, width, height, rotated } = panelFit;

  // Place this panel
  const placement: Placement = {
    panelId: panel.id,
    sheetId: sheet.sheetId,
    sheetNo: 1, // Will be updated later
    x: sheet.x,
    y: sheet.y,
    width,
    height,
    rotated,
    mark: panel.mark_no,
  };

  // Calculate used area for this panel
  const panelArea = width * height;

  // Create a new set of panels without the one we just placed
  const remainingPanels = panels.map((p) => {
    if (p.id === panel.id && p.qty > 0) {
      return { ...p, qty: p.qty - 1 };
    }
    return { ...p };
  });

  // Now we have two options for the next cut:
  // 1. Cut horizontally (create a bottom drop)
  // 2. Cut vertically (create a right drop)

  // Try horizontal cut first (panel on top, free space below)
  const horizontalResult = {
    // Right side drop (same height as panel)
    right: placeRecursive(
      remainingPanels,
      {
        sheetId: sheet.sheetId,
        width: sheet.width - width - bladeWidth,
        height: height,
        x: sheet.x + width + bladeWidth,
        y: sheet.y,
      },
      bladeWidth,
      allowRotation
    ),
    // Bottom drop (full width of original sheet)
    bottom: placeRecursive(
      remainingPanels,
      {
        sheetId: sheet.sheetId,
        width: sheet.width,
        height: sheet.height - height - bladeWidth,
        x: sheet.x,
        y: sheet.y + height + bladeWidth,
      },
      bladeWidth,
      allowRotation
    ),
  };

  // Try vertical cut (panel on left, free space to right)
  const verticalResult = {
    // Right side drop (full height of original sheet)
    right: placeRecursive(
      remainingPanels,
      {
        sheetId: sheet.sheetId,
        width: sheet.width - width - bladeWidth,
        height: sheet.height,
        x: sheet.x + width + bladeWidth,
        y: sheet.y,
      },
      bladeWidth,
      allowRotation
    ),
    // Bottom drop (same width as panel)
    bottom: placeRecursive(
      remainingPanels,
      {
        sheetId: sheet.sheetId,
        width: width,
        height: sheet.height - height - bladeWidth,
        x: sheet.x,
        y: sheet.y + height + bladeWidth,
      },
      bladeWidth,
      allowRotation
    ),
  };

  // Choose the better cut direction based on total panels placed and area utilization
  const horizontalScore =
    horizontalResult.right.panelsPlaced + horizontalResult.bottom.panelsPlaced;
  const verticalScore =
    verticalResult.right.panelsPlaced + verticalResult.bottom.panelsPlaced;

  let rightResult, bottomResult;
  if (horizontalScore > verticalScore) {
    rightResult = horizontalResult.right;
    bottomResult = horizontalResult.bottom;
  } else if (verticalScore > horizontalScore) {
    rightResult = verticalResult.right;
    bottomResult = verticalResult.bottom;
  } else {
    // If they place the same number of panels, choose based on area utilization
    const horizontalArea =
      horizontalResult.right.usedArea + horizontalResult.bottom.usedArea;
    const verticalArea =
      verticalResult.right.usedArea + verticalResult.bottom.usedArea;

    if (horizontalArea >= verticalArea) {
      rightResult = horizontalResult.right;
      bottomResult = horizontalResult.bottom;
    } else {
      rightResult = verticalResult.right;
      bottomResult = verticalResult.bottom;
    }
  }

  // Combine results
  const combinedPlacements = [
    placement,
    ...rightResult.placements,
    ...bottomResult.placements,
  ];

  const totalUsedArea =
    panelArea + rightResult.usedArea + bottomResult.usedArea;
  const totalPanelsPlaced =
    1 + rightResult.panelsPlaced + bottomResult.panelsPlaced;

  return {
    placements: combinedPlacements,
    usedArea: totalUsedArea,
    panelsPlaced: totalPanelsPlaced,
  };
}

/**
 * Find the best panel to fit in a given space
 */
function findBestPanelFit(
  panels: Panel[],
  maxWidth: number,
  maxHeight: number,
  allowRotation: boolean
): { panel: Panel; width: number; height: number; rotated: boolean } | null {
  // Find all panels that fit
  const fittingPanels = [];

  for (const panel of panels) {
    if (panel.qty <= 0) continue;

    // Check if panel fits directly
    const fitsDirect = panel.width <= maxWidth && panel.height <= maxHeight;

    // Check if panel fits when rotated
    const fitsRotated =
      allowRotation && panel.height <= maxWidth && panel.width <= maxHeight;

    if (fitsDirect || fitsRotated) {
      // Calculate score - prioritize panels by:
      // 1. Area (larger is better)
      // 2. Edge fit (closer to sheet edge is better)
      // We want to place the largest panels first, with preference to those
      // that fit well along at least one edge

      let width, height, rotated;
      if (
        fitsDirect &&
        (!fitsRotated ||
          panel.width * panel.height >= panel.height * panel.width)
      ) {
        width = panel.width;
        height = panel.height;
        rotated = false;
      } else {
        width = panel.height;
        height = panel.width;
        rotated = true;
      }

      // Calculate how well the panel fits along edges
      const widthFit = width / maxWidth;
      const heightFit = height / maxHeight;
      const edgeFit = Math.max(widthFit, heightFit);

      // Calculate area as percentage of maximum area
      const areaPercentage = (width * height) / (maxWidth * maxHeight);

      // Combined score (higher is better)
      const score = areaPercentage * 0.7 + edgeFit * 0.3;

      fittingPanels.push({
        panel,
        width,
        height,
        rotated,
        score,
      });
    }
  }

  // Sort by score (highest first)
  fittingPanels.sort((a, b) => b.score - a.score);

  // Return the best panel, or null if none fits
  return fittingPanels.length > 0 ? fittingPanels[0] : null;
}
