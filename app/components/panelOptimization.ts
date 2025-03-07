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

// Position tracking helper - converts column, row, position to a unique location ID
function calculateLocation(
  column: number,
  row: number,
  position: number
): number {
  return column * 10000 + row * 100 + position;
}

export function optimizePanels(
  panels: Panel[],
  sheets: Sheet[],
  bladeWidth: number = 0.25,
  allowRotation: boolean = true
): PanelOptimizationResult {
  // Clone input data
  const panelsData = panels.map((p) => ({ ...p }));
  let sheetsData = sheets.map((s) => ({ ...s, maxQty: s.maxQty ?? s.qty }));

  // Initialize results
  const placements: Placement[] = [];
  const usedSheets: CutSheet[] = [];

  // Track original panel quantities for summary
  const originalQty = new Map<number, number>();
  panelsData.forEach((p) => originalQty.set(p.id, p.qty));

  // Track total panels to place
  const totalPanelsToPlace = panelsData.reduce((sum, p) => sum + p.qty, 0);
  console.log(`Total panels to place: ${totalPanelsToPlace}`);

  // Keep placing panels until all are placed or we run out of sheets
  let remainingPanels = [...panelsData];
  let totalPlacedCount = 0;
  let iteration = 0;
  const maxIterations = 1000; // Safety limit to prevent infinite loops

  while (
    remainingPanels.some((p) => p.qty > 0) &&
    totalPlacedCount < totalPanelsToPlace &&
    iteration < maxIterations
  ) {
    iteration++;

    // Find best sheet for current remaining panels
    const bestSheetResult = findBestSheetForRemainingPanels(
      remainingPanels,
      sheetsData,
      bladeWidth,
      allowRotation
    );

    if (!bestSheetResult) {
      console.warn("No suitable sheet found for remaining panels");
      break;
    }

    const { sheetIndex, sheetPlacements, usedSheet, panelsPlaced } =
      bestSheetResult;

    // Update remaining panels
    remainingPanels = remainingPanels.map((p) => ({ ...p }));
    for (const placement of sheetPlacements) {
      const panelIndex = remainingPanels.findIndex(
        (p) => p.id === placement.panelId
      );
      if (panelIndex >= 0 && remainingPanels[panelIndex].qty > 0) {
        remainingPanels[panelIndex].qty--;
      }
    }

    // Add placements and used sheet to results
    placements.push(...sheetPlacements);
    usedSheets.push(usedSheet);

    // Update sheet quantity
    sheetsData[sheetIndex].qty--;

    // Update total placed count
    totalPlacedCount += panelsPlaced;

    // If a sheet type is depleted, remove it from consideration
    sheetsData = sheetsData.filter((s) => s.qty > 0);

    // If no sheets left, break
    if (sheetsData.length === 0) {
      console.warn("Ran out of available sheets");
      break;
    }
  }

  // Calculate summary statistics
  const totalArea = usedSheets.reduce((sum, s) => sum + s.width * s.height, 0);
  const usedArea = usedSheets.reduce((sum, s) => sum + s.usedArea, 0);
  const wastePercentage = totalArea ? 100 * (1 - usedArea / totalArea) : 0;

  // Count placed panels by type for summary
  const placedByType = new Map<number, number>();
  placements.forEach((p) => {
    placedByType.set(p.panelId, (placedByType.get(p.panelId) || 0) + 1);
  });

  return {
    placements,
    sheets: usedSheets,
    summary: {
      totalSheets: usedSheets.length,
      totalArea,
      usedArea,
      wastePercentage,
      totalPanelsPlaced: totalPlacedCount,
      totalPanelsNeeded: totalPanelsToPlace,
      sheetTypesUsed: [...new Set(usedSheets.map((s) => s.sheetId))].length,
    },
  };
}

/**
 * Finds the best sheet for the remaining panels based on efficiency
 */
function findBestSheetForRemainingPanels(
  remainingPanels: Panel[],
  availableSheets: Sheet[],
  bladeWidth: number,
  allowRotation: boolean
): {
  sheetIndex: number;
  sheetPlacements: Placement[];
  usedSheet: CutSheet;
  panelsPlaced: number;
  efficiency: number;
} | null {
  let bestResult: {
    sheetIndex: number;
    sheetPlacements: Placement[];
    usedSheet: CutSheet;
    panelsPlaced: number;
    efficiency: number;
  } | null = null;

  // Try each available sheet type
  for (let i = 0; i < availableSheets.length; i++) {
    const sheet = availableSheets[i];

    // Only consider sheets with available quantity
    if (sheet.qty <= 0) continue;

    // Create initial free rectangle for this sheet
    const freeRects = [
      {
        x: 0,
        y: 0,
        width: sheet.width,
        height: sheet.height,
        level: 0,
      },
    ];

    // Track cut lines
    const verticalCuts = new Set<number>([0, sheet.width]);
    const horizontalCuts = new Set<number>([0, sheet.height]);

    // Sort panels by area (largest first)
    const panelsToFit = remainingPanels
      .filter((p) => p.qty > 0)
      .sort((a, b) => b.width * b.height - a.width * a.height);

    if (panelsToFit.length === 0) continue;

    // Track placements for this sheet
    const sheetPlacements: Placement[] = [];
    let panelsPlaced = 0;

    // Try to place panels using guillotine algorithm
    const panelsToFitCopy = panelsToFit.map((p) => ({ ...p }));

    while (panelsToFitCopy.some((p) => p.qty > 0) && freeRects.length > 0) {
      // Sort free rectangles by level, position, and size
      freeRects.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        if (a.y !== b.y) return a.y - b.y;
        if (a.x !== b.x) return a.x - b.x;
        return b.width * b.height - a.width * a.height;
      });

      const freeRect = freeRects.shift()!;

      // Find best panel for this rectangle
      let bestPanelIndex = -1;
      let bestScore = Infinity;
      let bestRotated = false;

      for (let j = 0; j < panelsToFitCopy.length; j++) {
        if (panelsToFitCopy[j].qty <= 0) continue;

        // Check if panel fits directly
        let fitsDirect =
          panelsToFitCopy[j].width <= freeRect.width &&
          panelsToFitCopy[j].height <= freeRect.height;

        // Check if panel fits rotated
        let fitsRotated =
          allowRotation &&
          panelsToFitCopy[j].height <= freeRect.width &&
          panelsToFitCopy[j].width <= freeRect.height;

        if (fitsDirect || fitsRotated) {
          // Calculate fit score - prefer panels that fit more efficiently
          const widthDirect = fitsDirect
            ? Math.abs(freeRect.width - panelsToFitCopy[j].width)
            : Infinity;
          const heightDirect = fitsDirect
            ? Math.abs(freeRect.height - panelsToFitCopy[j].height)
            : Infinity;

          const widthRotated = fitsRotated
            ? Math.abs(freeRect.width - panelsToFitCopy[j].height)
            : Infinity;
          const heightRotated = fitsRotated
            ? Math.abs(freeRect.height - panelsToFitCopy[j].width)
            : Infinity;

          // Determine best orientation
          const bestDirectScore = widthDirect + heightDirect;
          const bestRotatedScore = widthRotated + heightRotated;

          const useRotated =
            fitsRotated && (!fitsDirect || bestRotatedScore < bestDirectScore);
          const score = useRotated ? bestRotatedScore : bestDirectScore;

          // Update best panel if this is better
          if (score < bestScore) {
            bestScore = score;
            bestPanelIndex = j;
            bestRotated = useRotated;
          }
        }
      }

      // If no panel fits, skip this free rectangle
      if (bestPanelIndex === -1) {
        continue;
      }

      // Place the best panel
      const panel = panelsToFitCopy[bestPanelIndex];
      const width = bestRotated ? panel.height : panel.width;
      const height = bestRotated ? panel.width : panel.height;

      // Create placement
      sheetPlacements.push({
        panelId: panel.id,
        sheetId: sheet.id,
        sheetNo: 1, // Will be assigned properly later
        x: freeRect.x,
        y: freeRect.y,
        width,
        height,
        rotated: bestRotated,
        mark: panel.mark_no,
      });

      // Update panel quantity
      panel.qty--;
      panelsPlaced++;

      // Update cut lines
      verticalCuts.add(freeRect.x + width);
      horizontalCuts.add(freeRect.y + height);

      // Create new free rectangles (guillotine style)
      if (freeRect.x + width + bladeWidth < freeRect.x + freeRect.width) {
        freeRects.push({
          x: freeRect.x + width + bladeWidth,
          y: freeRect.y,
          width: freeRect.width - width - bladeWidth,
          height: height,
          level: freeRect.level,
        });
      }

      if (freeRect.y + height + bladeWidth < freeRect.y + freeRect.height) {
        freeRects.push({
          x: freeRect.x,
          y: freeRect.y + height + bladeWidth,
          width: freeRect.width,
          height: freeRect.height - height - bladeWidth,
          level: freeRect.level + 1,
        });
      }

      // Filter out tiny rectangles
      const minDimension = Math.min(
        ...panelsToFitCopy
          .filter((p) => p.qty > 0)
          .map((p) => Math.min(p.width, p.height))
      );
      if (minDimension > 0) {
        const filteredRects = freeRects.filter(
          (r) => r.width >= minDimension && r.height >= minDimension
        );
        freeRects.length = 0;
        freeRects.push(...filteredRects);
      }
    }

    if (panelsPlaced > 0) {
      // Calculate efficiency for this sheet
      const usedArea = sheetPlacements.reduce(
        (sum, p) => sum + p.width * p.height,
        0
      );
      const sheetArea = sheet.width * sheet.height;
      const efficiency = usedArea / sheetArea;

      // Create sheet record
      const usedSheet: CutSheet = {
        sheetId: sheet.id,
        sheetNo: 1, // Will be assigned properly later
        width: sheet.width,
        height: sheet.height,
        usedArea,
        wastePercentage: 100 * (1 - efficiency),
      };

      // Check if this is the best sheet so far
      // Criteria: primary - highest panel count, secondary - highest efficiency
      if (
        !bestResult ||
        panelsPlaced > bestResult.panelsPlaced ||
        (panelsPlaced === bestResult.panelsPlaced &&
          efficiency > bestResult.efficiency)
      ) {
        bestResult = {
          sheetIndex: i,
          sheetPlacements,
          usedSheet,
          panelsPlaced,
          efficiency,
        };
      }
    }
  }

  // If we found a suitable sheet, assign proper sheet numbers
  if (bestResult) {
    const sheet = availableSheets[bestResult.sheetIndex];

    // Find the next sheet number for this sheet type
    const existingSheets = sheet.maxQty! - sheet.qty;
    const nextSheetNo = existingSheets + 1;

    // Update sheet number in placements and sheet record
    bestResult.sheetPlacements.forEach((p) => {
      p.sheetNo = nextSheetNo;
    });
    bestResult.usedSheet.sheetNo = nextSheetNo;
  }

  return bestResult;
}

/**
 * Validate that placements follow a strict guillotine cutting pattern
 * @param placements Array of placements to validate
 * @returns Array of issue descriptions, empty if no issues
 */
export function validateGuillotinePattern(placements: Placement[]): string[] {
  const issues: string[] = [];

  // Group placements by sheet
  const sheetPlacements = new Map<string, Placement[]>();

  placements.forEach((p) => {
    const key = `${p.sheetId}-${p.sheetNo}`;
    if (!sheetPlacements.has(key)) {
      sheetPlacements.set(key, []);
    }
    sheetPlacements.get(key)!.push(p);
  });

  // Check each sheet
  for (const [key, placementsOnSheet] of sheetPlacements.entries()) {
    // Collect all X and Y coordinates
    const xCoords = new Set<number>();
    const yCoords = new Set<number>();

    placementsOnSheet.forEach((p) => {
      xCoords.add(p.x);
      xCoords.add(p.x + p.width);
      yCoords.add(p.y);
      yCoords.add(p.y + p.height);
    });

    const sortedX = Array.from(xCoords).sort((a, b) => a - b);
    const sortedY = Array.from(yCoords).sort((a, b) => a - b);

    // For each panel, check if it's properly aligned with the grid
    placementsOnSheet.forEach((p) => {
      // Check all 4 corners
      const corners = [
        { x: p.x, y: p.y },
        { x: p.x + p.width, y: p.y },
        { x: p.x, y: p.y + p.height },
        { x: p.x + p.width, y: p.y + p.height },
      ];

      corners.forEach((corner) => {
        if (!sortedX.includes(corner.x)) {
          issues.push(
            `Sheet ${key}, Panel ${p.mark}: X coordinate ${corner.x} not aligned with cut grid`
          );
        }
        if (!sortedY.includes(corner.y)) {
          issues.push(
            `Sheet ${key}, Panel ${p.mark}: Y coordinate ${corner.y} not aligned with cut grid`
          );
        }
      });
    });

    // Check for overlapping panels
    for (let i = 0; i < placementsOnSheet.length; i++) {
      const p1 = placementsOnSheet[i];

      for (let j = i + 1; j < placementsOnSheet.length; j++) {
        const p2 = placementsOnSheet[j];

        // Check if panels overlap
        if (
          p1.x < p2.x + p2.width &&
          p1.x + p1.width > p2.x &&
          p1.y < p2.y + p2.height &&
          p1.y + p1.height > p2.y
        ) {
          issues.push(
            `Sheet ${key}: Panel ${p1.mark} at (${p1.x},${p1.y}) overlaps with Panel ${p2.mark} at (${p2.x},${p2.y})`
          );
        }
      }
    }
  }

  return issues;
}

// Function to fix alignment issues with existing placements
export function fixGuillotineAlignment(placements: Placement[]): Placement[] {
  // Group placements by sheet
  const sheetPlacements = new Map<string, Placement[]>();

  placements.forEach((p) => {
    const key = `${p.sheetId}-${p.sheetNo}`;
    if (!sheetPlacements.has(key)) {
      sheetPlacements.set(key, []);
    }
    sheetPlacements.get(key)!.push({ ...p }); // Clone each placement
  });

  const fixedPlacements: Placement[] = [];

  // Process each sheet
  for (const [key, placementsOnSheet] of sheetPlacements.entries()) {
    // Sort placements by Y then X (top-to-bottom, left-to-right)
    placementsOnSheet.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    // Build a grid of allowed X cuts (vertical cuts)
    const xCuts = new Set<number>([0]);

    // Process placements level by level
    let y = 0;
    let currentLevel: Placement[] = [];

    for (const p of placementsOnSheet) {
      // If we're at a new Y level, process the current level
      if (p.y > y) {
        // Add all panel edges from current level to xCuts
        currentLevel.forEach((panel) => {
          xCuts.add(panel.x);
          xCuts.add(panel.x + panel.width);
        });

        // Move to next level
        y = p.y;
        currentLevel = [p];
      } else {
        currentLevel.push(p);
      }

      // Align panel with nearest valid X cut
      const sortedXCuts = Array.from(xCuts).sort((a, b) => a - b);
      let nearestCut = sortedXCuts[0];
      let minDistance = Math.abs(p.x - sortedXCuts[0]);

      for (const cut of sortedXCuts) {
        const distance = Math.abs(p.x - cut);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCut = cut;
        }
      }

      // Adjust X to nearest valid cut
      if (p.x !== nearestCut) {
        console.log(
          `Fixing panel ${p.mark} at (${p.x},${p.y}): moving X from ${p.x} to ${nearestCut}`
        );
        p.x = nearestCut;
      }
    }

    // Add all fixed placements
    fixedPlacements.push(...placementsOnSheet);
  }

  return fixedPlacements;
}

// Function that places a panel and finds next available space
function placePanelAndFindNext(
  panel: Panel,
  sheetWidth: number,
  sheetHeight: number,
  bladeWidth: number,
  x: number,
  y: number,
  placements: Placement[],
  panelsToFit: Panel[],
  sheetInfo: { sheetId: number; sheetNo: number },
  allowRotation: boolean
): { width: number; height: number; placed: boolean } {
  // Default to no placement
  const result = { width: sheetWidth, height: sheetHeight, placed: false };

  // Check if we have any panels left to place
  if (panelsToFit.length === 0 || panel.qty <= 0) {
    return result;
  }

  // Try to fit the panel directly
  let canFitDirect = panel.width <= sheetWidth && panel.height <= sheetHeight;

  // Try to fit the panel rotated if allowed
  let canFitRotated =
    allowRotation && panel.height <= sheetWidth && panel.width <= sheetHeight;

  if (!canFitDirect && !canFitRotated) {
    return result; // Panel doesn't fit in either orientation
  }

  // Choose the best orientation based on fit
  let rotated = false;
  if (canFitDirect && canFitRotated) {
    // If both orientations fit, choose the one that leaves the most useful space
    // This is a heuristic that can be adjusted for different optimization goals
    const directWaste = (sheetWidth - panel.width) * sheetHeight;
    const rotatedWaste = (sheetWidth - panel.height) * sheetHeight;

    rotated = rotatedWaste < directWaste;
  } else {
    rotated = !canFitDirect && canFitRotated;
  }

  // Get panel dimensions accounting for rotation
  const width = rotated ? panel.height : panel.width;
  const height = rotated ? panel.width : panel.height;

  // Create placement record
  placements.push({
    panelId: panel.id,
    sheetId: sheetInfo.sheetId,
    sheetNo: sheetInfo.sheetNo,
    x,
    y,
    width,
    height,
    rotated,
    mark: panel.mark_no,
  });

  // Update panel quantity
  panel.qty--;
  result.placed = true;

  // Calculate remaining spaces
  // Space to the right of the panel
  const rightWidth = sheetWidth - (width + bladeWidth);
  const rightHeight = height;

  // Space below the panel
  const bottomWidth = sheetWidth;
  const bottomHeight = sheetHeight - (height + bladeWidth);

  // Space for the rest of the sheet - adjust the logic to use entire width
  result.width = sheetWidth;
  result.height = sheetHeight - (height + bladeWidth);

  // Try to fit more panels in the space to the right if it's large enough
  if (rightWidth > 0 && rightHeight > 0) {
    // Find panels that fit in this space
    const panelsThatFit = panelsToFit.filter(
      (p) =>
        (p.width <= rightWidth && p.height <= rightHeight) ||
        (allowRotation && p.height <= rightWidth && p.width <= rightHeight)
    );

    if (panelsThatFit.length > 0) {
      // Place the largest panel that fits (by area)
      panelsThatFit.sort((a, b) => b.width * b.height - a.width * a.height);

      // Try to place the panel
      placePanelAndFindNext(
        panelsThatFit[0],
        rightWidth,
        rightHeight,
        bladeWidth,
        x + width + bladeWidth,
        y,
        placements,
        panelsToFit,
        sheetInfo,
        allowRotation
      );
    }
  }

  // Try to fit more panels in the space below if it's large enough
  if (bottomWidth > 0 && bottomHeight > 0) {
    // Find panels that fit in this space
    const panelsThatFit = panelsToFit.filter(
      (p) =>
        (p.width <= bottomWidth && p.height <= bottomHeight) ||
        (allowRotation && p.height <= bottomWidth && p.width <= bottomHeight)
    );

    if (panelsThatFit.length > 0) {
      // Place the largest panel that fits (by area)
      panelsThatFit.sort((a, b) => b.width * b.height - a.width * a.height);

      // Try to place the panel
      placePanelAndFindNext(
        panelsThatFit[0],
        bottomWidth,
        bottomHeight,
        bladeWidth,
        x,
        y + height + bladeWidth,
        placements,
        panelsToFit,
        sheetInfo,
        allowRotation
      );
    }
  }

  // Return the updated sheet dimensions
  return result;
}

// Update the visualization component to correctly handle the results
export function updateVisualizationComponent(
  placements: Placement[],
  sheets: CutSheet[],
  summary: any
): { placements: Placement[]; sheets: CutSheet[]; summary: any } {
  // Fix negative waste percentages if they exist
  const fixedSheets = sheets.map((sheet) => {
    if (sheet.wastePercentage < 0) {
      // Recalculate sheet's waste percentage
      const sheetArea = sheet.width * sheet.height;
      sheet.wastePercentage = 100 * (1 - sheet.usedArea / sheetArea);
    }
    return sheet;
  });

  // Create a corrected summary if needed
  const fixedSummary = { ...summary };
  if (fixedSummary.wastePercentage < 0) {
    const totalArea = fixedSheets.reduce(
      (sum, s) => sum + s.width * s.height,
      0
    );
    const usedArea = fixedSheets.reduce((sum, s) => sum + s.usedArea, 0);
    fixedSummary.wastePercentage = totalArea
      ? 100 * (1 - usedArea / totalArea)
      : 0;
  }

  return {
    placements,
    sheets: fixedSheets,
    summary: fixedSummary,
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

    const result = optimizePanels(
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

/**
 * Helper function to debug panel layouts and detect non-guillotine cuts
 * @param placements Array of panel placements
 * @param sheets Array of sheets
 */
export function debugPanelLayouts(placements: Placement[], sheets: CutSheet[]) {
  // Group placements by sheet
  const placementsBySheet = new Map<string, Placement[]>();

  placements.forEach((placement) => {
    const key = `${placement.sheetId}-${placement.sheetNo}`;
    if (!placementsBySheet.has(key)) {
      placementsBySheet.set(key, []);
    }
    placementsBySheet.get(key)!.push(placement);
  });

  // For each sheet, check the layout
  sheets.forEach((sheet) => {
    const key = `${sheet.sheetId}-${sheet.sheetNo}`;
    const sheetPlacements = placementsBySheet.get(key) || [];

    console.log(`\n===== SHEET ${sheet.sheetId}-${sheet.sheetNo} =====`);
    console.log(`Dimensions: ${sheet.width} x ${sheet.height}`);
    console.log(`Placements: ${sheetPlacements.length}`);

    if (sheetPlacements.length === 0) {
      console.log("No placements on this sheet");
      return;
    }

    // Find all unique X and Y coordinates (for cut lines)
    const xCuts = new Set<number>();
    const yCuts = new Set<number>();

    sheetPlacements.forEach((p) => {
      xCuts.add(p.x);
      xCuts.add(p.x + p.width);
      yCuts.add(p.y);
      yCuts.add(p.y + p.height);
    });

    const xCutsArray = Array.from(xCuts).sort((a, b) => a - b);
    const yCutsArray = Array.from(yCuts).sort((a, b) => a - b);

    console.log("X cuts:", xCutsArray);
    console.log("Y cuts:", yCutsArray);

    // Check for alignment issues
    let alignmentIssues = 0;

    sheetPlacements.forEach((p1) => {
      sheetPlacements.forEach((p2) => {
        // Skip checking against self
        if (p1 === p2) return;

        // Check if p1 is directly above p2
        if (
          p1.y + p1.height === p2.y &&
          ((p1.x < p2.x + p2.width && p1.x + p1.width > p2.x) ||
            (p2.x < p1.x + p1.width && p2.x + p2.width > p1.x))
        ) {
          // For guillotine cuts, if panel2 is below panel1,
          // their horizontal edges should align
          if (p1.x !== p2.x || p1.width !== p2.width) {
            console.log(
              `ALIGNMENT ISSUE: Panel ${p1.mark} (${p1.x},${p1.y}) above Panel ${p2.mark} (${p2.x},${p2.y}) - horizontal edges don't align`
            );
            alignmentIssues++;
          }
        }

        // Check if p1 is directly to the left of p2
        if (
          p1.x + p1.width === p2.x &&
          ((p1.y < p2.y + p2.height && p1.y + p1.height > p2.y) ||
            (p2.y < p1.y + p1.height && p2.y + p2.height > p1.y))
        ) {
          // For guillotine cuts, if panel2 is to the right of panel1,
          // their vertical edges should align
          if (p1.y !== p2.y || p1.height !== p2.height) {
            console.log(
              `ALIGNMENT ISSUE: Panel ${p1.mark} (${p1.x},${p1.y}) left of Panel ${p2.mark} (${p2.x},${p2.y}) - vertical edges don't align`
            );
            alignmentIssues++;
          }
        }
      });
    });

    if (alignmentIssues === 0) {
      console.log(
        "✓ No alignment issues detected (guillotine pattern is good)"
      );
    } else {
      console.log(
        `❌ Found ${alignmentIssues} alignment issues (non-guillotine pattern)`
      );
    }

    // Create a visual representation
    console.log("\nVisual Layout (simplified):");

    // Simple ASCII representation of the layout
    const positions = new Map<string, string>();

    sheetPlacements.forEach((p) => {
      // For simple visualization, round to nearest 10
      const x = Math.round(p.x / 10) * 10;
      const y = Math.round(p.y / 10) * 10;
      const width = Math.round(p.width / 10) * 10;
      const height = Math.round(p.height / 10) * 10;

      for (let i = 0; i < height; i += 10) {
        for (let j = 0; j < width; j += 10) {
          const key = `${x + j},${y + i}`;
          positions.set(key, p.mark);
        }
      }
    });

    // Draw the grid
    const maxX = Math.ceil(sheet.width / 10) * 10;
    const maxY = Math.ceil(sheet.height / 10) * 10;

    // Header row
    let header = "    ";
    for (let x = 0; x < maxX; x += 10) {
      header += (x / 10).toString().padStart(2, "0") + " ";
    }
    console.log(header);

    // Draw rows
    for (let y = 0; y < maxY; y += 10) {
      let row = (y / 10).toString().padStart(2, "0") + " |";

      for (let x = 0; x < maxX; x += 10) {
        const key = `${x},${y}`;
        row += positions.has(key)
          ? ` ${positions.get(key)?.charAt(0) || "#"} `
          : " . ";
      }

      console.log(row);
    }

    // Detailed placement report
    console.log("\nDetailed Placement Report:");
    sheetPlacements.forEach((p) => {
      console.log(
        `Panel ${p.mark.padEnd(6)} (${p.width.toFixed(1)} x ${p.height.toFixed(
          1
        )}) at (${p.x.toFixed(1)}, ${p.y.toFixed(1)}) - rotated: ${p.rotated}`
      );
    });
  });
}

/**
 * Analyzes placements data for suspicious X and Y values
 * @param placements Array of panel placements
 */
export function detectSuspiciousPlacementValues(placements: Placement[]) {
  // Find max X and Y values
  const largestX = Math.max(...placements.map((p) => p.x));
  const largestY = Math.max(...placements.map((p) => p.y));

  console.log(`Largest X value: ${largestX}`);
  console.log(`Largest Y value: ${largestY}`);

  // Check for unusually large values (potential units issue)
  if (largestX > 1000 || largestY > 1000) {
    console.warn(
      "⚠️ WARNING: Found unusually large X/Y coordinates. This might indicate an issue with units or scaling."
    );
  }

  // Check for X/Y values in increments of 100
  const nonAlignedX = placements.filter((p) => p.x % 100 !== 0 && p.x !== 0);
  const nonAlignedY = placements.filter((p) => p.y % 100 !== 0 && p.y !== 0);

  if (nonAlignedX.length === 0 && nonAlignedY.length === 0) {
    console.log("✓ All placements use X/Y values in increments of 100");
    console.log(
      "This suggests the coordinates are used as indices rather than actual measurements"
    );
  } else {
    console.log(
      `Found ${nonAlignedX.length} placements with X not in increments of 100`
    );
    console.log(
      `Found ${nonAlignedY.length} placements with Y not in increments of 100`
    );
  }

  // Print examples of non-aligned values if any
  if (nonAlignedX.length > 0 || nonAlignedY.length > 0) {
    console.log("\nExamples of non-aligned values:");
    [...nonAlignedX, ...nonAlignedY].slice(0, 5).forEach((p) => {
      console.log(`Panel ${p.mark} at (${p.x}, ${p.y})`);
    });
  }
}
