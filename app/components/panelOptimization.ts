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

    const result = optimizePanelsStrict(
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
function placeOnSheetStrict(
  panels: Panel[],
  sheet: Sheet,
  bladeWidth: number,
  allowRotation: boolean
): {
  placements: Placement[];
  sheet: CutSheet;
  panelsPlaced: number;
} {
  const placements: Placement[] = [];
  let panelsPlaced = 0;

  // Clone panels and sort by area (largest first)
  const panelsToBePlaced = panels
    .filter((p) => p.qty > 0)
    .map((p) => ({ ...p }))
    .sort((a, b) => b.width * b.height - a.width * a.height);

  // Track cut lines
  const cutLines = {
    x: new Set<number>([0, sheet.width]),
    y: new Set<number>([0, sheet.height]),
  };

  // Initialize with the entire sheet
  let currentX = 0;
  const startingColumnWidth = startStrictColumn(
    panelsToBePlaced,
    placements,
    sheet,
    currentX,
    bladeWidth,
    allowRotation,
    cutLines
  );

  if (startingColumnWidth > 0) {
    // Process additional columns until we run out of space or panels
    currentX = startingColumnWidth + bladeWidth;
    while (currentX < sheet.width && panelsToBePlaced.some((p) => p.qty > 0)) {
      const columnWidth = startStrictColumn(
        panelsToBePlaced,
        placements,
        sheet,
        currentX,
        bladeWidth,
        allowRotation,
        cutLines
      );

      if (columnWidth <= 0) break; // Couldn't place any panels in this column
      currentX += columnWidth + bladeWidth;
    }

    // Count total panels placed
    panelsPlaced = placements.length;
  }

  // Calculate used area
  const usedArea = placements.reduce((sum, p) => sum + p.width * p.height, 0);

  // Create sheet record
  const usedSheet: CutSheet = {
    sheetId: sheet.id,
    sheetNo: 1, // Will be updated later
    width: sheet.width,
    height: sheet.height,
    usedArea,
    wastePercentage: 100 * (1 - usedArea / (sheet.width * sheet.height)),
  };

  return {
    placements,
    sheet: usedSheet,
    panelsPlaced,
  };
}

/**
 * Start a new column in the strict placement algorithm
 * Returns the width of the column that was started, or 0 if no panels could be placed
 */
function startStrictColumn(
  panelsToBePlaced: Panel[],
  placements: Placement[],
  sheet: Sheet,
  startX: number,
  bladeWidth: number,
  allowRotation: boolean,
  cutLines: { x: Set<number>; y: Set<number> }
): number {
  const remainingWidth = sheet.width - startX;
  if (remainingWidth <= 0) return 0;

  // Find the first panel that fits (largest area first)
  let firstPanelIndex = -1;
  let firstPanelWidth = 0;
  let firstPanelHeight = 0;
  let firstPanelRotated = false;

  for (let i = 0; i < panelsToBePlaced.length; i++) {
    const panel = panelsToBePlaced[i];
    if (panel.qty <= 0) continue;

    // Try direct fit
    const fitsDirect =
      panel.width <= remainingWidth && panel.height <= sheet.height;

    // Try rotated fit if allowed
    const fitsRotated =
      allowRotation &&
      panel.height <= remainingWidth &&
      panel.width <= sheet.height;

    if (fitsDirect || fitsRotated) {
      // We found a panel that fits in this column
      firstPanelIndex = i;

      // Choose orientation (prefer the one that yields smaller width)
      if (fitsDirect && (!fitsRotated || panel.width <= panel.height)) {
        firstPanelWidth = panel.width;
        firstPanelHeight = panel.height;
        firstPanelRotated = false;
      } else {
        firstPanelWidth = panel.height;
        firstPanelHeight = panel.width;
        firstPanelRotated = true;
      }

      break;
    }
  }

  if (firstPanelIndex < 0) return 0; // No panel fits

  // Place the first panel at the top of the column
  const firstPanel = panelsToBePlaced[firstPanelIndex];

  placements.push({
    panelId: firstPanel.id,
    sheetId: sheet.id,
    sheetNo: 1, // Will be updated later
    x: startX,
    y: 0,
    width: firstPanelWidth,
    height: firstPanelHeight,
    rotated: firstPanelRotated,
    mark: firstPanel.mark_no,
  });

  // Update cut lines
  cutLines.x.add(startX + firstPanelWidth);
  cutLines.y.add(firstPanelHeight);

  // Decrement panel quantity
  panelsToBePlaced[firstPanelIndex].qty--;

  // Now fill below the first panel with other panels
  let currentY = firstPanelHeight + bladeWidth;

  while (currentY < sheet.height && panelsToBePlaced.some((p) => p.qty > 0)) {
    // Find the best panel to place below
    const nextPanelInfo = findBestColumnFit(
      panelsToBePlaced,
      firstPanelWidth,
      sheet.height - currentY,
      allowRotation
    );

    if (!nextPanelInfo) break; // No more panels fit

    const { panel, width, height, rotated } = nextPanelInfo;

    // Place the panel
    placements.push({
      panelId: panel.id,
      sheetId: sheet.id,
      sheetNo: 1,
      x: startX,
      y: currentY,
      width,
      height,
      rotated,
      mark: panel.mark_no,
    });

    // Update cut lines
    cutLines.y.add(currentY + height);

    // Decrement panel quantity
    const panelIdx = panelsToBePlaced.findIndex((p) => p.id === panel.id);
    if (panelIdx >= 0) {
      panelsToBePlaced[panelIdx].qty--;
    }

    // Update Y position for next panel
    currentY += height + bladeWidth;
  }

  return firstPanelWidth;
}

/**
 * Find the best panel to fit in a column given max width and height
 */
function findBestColumnFit(
  panels: Panel[],
  maxWidth: number,
  maxHeight: number,
  allowRotation: boolean
): { panel: Panel; width: number; height: number; rotated: boolean } | null {
  // First, try to find a panel that fits the exact width
  // This maximizes column utilization
  let bestExactMatch: {
    panel: Panel;
    width: number;
    height: number;
    rotated: boolean;
    score: number;
  } | null = null;

  let bestApproxMatch: {
    panel: Panel;
    width: number;
    height: number;
    rotated: boolean;
    score: number;
  } | null = null;

  for (const panel of panels) {
    if (panel.qty <= 0) continue;

    // Try direct fit
    const fitsDirect = panel.width <= maxWidth && panel.height <= maxHeight;

    // Try rotated fit
    const fitsRotated =
      allowRotation && panel.height <= maxWidth && panel.width <= maxHeight;

    if (!fitsDirect && !fitsRotated) continue;

    // Calculate fit scores - we prefer panels that:
    // 1. Maximize the width usage (closer to maxWidth)
    // 2. Maximize height (to use more vertical space)
    // 3. Have larger area overall

    let directScore = Infinity;
    if (fitsDirect) {
      // Width utilization (closer to 1 is better)
      const widthUtil = panel.width / maxWidth;
      // Height bonus (taller panels preferred)
      const heightBonus = panel.height / maxHeight;
      // Overall score (lower is better)
      directScore = (1 - widthUtil) * 10 - heightBonus;
    }

    let rotatedScore = Infinity;
    if (fitsRotated) {
      // Width utilization for rotated panel
      const widthUtil = panel.height / maxWidth;
      // Height bonus for rotated panel
      const heightBonus = panel.width / maxHeight;
      // Overall score
      rotatedScore = (1 - widthUtil) * 10 - heightBonus;
    }

    // Determine best orientation
    const useRotated =
      fitsRotated && (!fitsDirect || rotatedScore < directScore);
    const bestScore = useRotated ? rotatedScore : directScore;

    // Get dimensions for this orientation
    const width = useRotated ? panel.height : panel.width;
    const height = useRotated ? panel.width : panel.height;

    // Check if this is an exact width match
    const isExactMatch = Math.abs(width - maxWidth) < 0.001;

    if (isExactMatch) {
      // This is an exact width match - prefer these
      if (!bestExactMatch || bestScore < bestExactMatch.score) {
        bestExactMatch = {
          panel,
          width,
          height,
          rotated: useRotated,
          score: bestScore,
        };
      }
    } else {
      // This is an approximate match
      if (!bestApproxMatch || bestScore < bestApproxMatch.score) {
        bestApproxMatch = {
          panel,
          width,
          height,
          rotated: useRotated,
          score: bestScore,
        };
      }
    }
  }

  // Prefer exact matches if available
  const bestMatch = bestExactMatch || bestApproxMatch;
  if (!bestMatch) return null;

  return {
    panel: bestMatch.panel,
    width: bestMatch.width,
    height: bestMatch.height,
    rotated: bestMatch.rotated,
  };
}

/**
 * Main optimization function using strict column-first approach
 */
export function optimizePanelsStrict(
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

  // Sort panels by area (largest first) - this is critical for this algorithm
  const sortedPanels = [...panelsData].sort(
    (a, b) => b.width * b.height - a.width * a.height
  );

  // Track total panels to place
  const totalPanelsToPlace = sortedPanels.reduce((sum, p) => sum + p.qty, 0);
  let panelsPlaced = 0;

  // Keep track of sheet usage
  const sheetCounts = new Map<number, number>();
  sheetsData.forEach((s) => sheetCounts.set(s.id, 0));

  // Main optimization loop
  while (
    sortedPanels.some((p) => p.qty > 0) &&
    panelsPlaced < totalPanelsToPlace
  ) {
    // Find the best sheet for the current set of panels
    let bestSheetIndex = -1;
    let bestPlacements: Placement[] = [];
    let bestUsedSheet: CutSheet | null = null;
    let bestPanelsPlaced = 0;
    let bestEfficacy = -1;

    // Try all available sheet types
    for (let i = 0; i < sheetsData.length; i++) {
      const sheet = sheetsData[i];
      if (sheet.qty <= 0) continue;

      // Try to place panels on this sheet
      const result = placeOnSheetStrict(
        sortedPanels,
        sheet,
        bladeWidth,
        allowRotation
      );

      if (result.panelsPlaced > 0) {
        // Calculate efficacy score
        // We want to maximize panels placed AND minimize waste
        const efficacy =
          result.panelsPlaced * 0.6 + // Panels placed has higher weight
          (1 - result.sheet.wastePercentage / 100) * 0.4; // Waste has lower weight

        if (bestSheetIndex === -1 || efficacy > bestEfficacy) {
          bestSheetIndex = i;
          bestPlacements = result.placements;
          bestUsedSheet = result.sheet;
          bestPanelsPlaced = result.panelsPlaced;
          bestEfficacy = efficacy;
        }
      }
    }

    // If we couldn't find a suitable sheet, break
    if (bestSheetIndex === -1) break;

    // Use the selected sheet
    const selectedSheet = sheetsData[bestSheetIndex];

    // Update sheet usage count
    const usageCount = (sheetCounts.get(selectedSheet.id) || 0) + 1;
    sheetCounts.set(selectedSheet.id, usageCount);

    // Update sheet numbers
    bestPlacements.forEach((p) => {
      p.sheetNo = usageCount;
    });

    if (bestUsedSheet) {
      bestUsedSheet.sheetNo = usageCount;
      usedSheets.push(bestUsedSheet);
    }

    // Add placements to results
    placements.push(...bestPlacements);

    // Update panel quantities
    for (const placement of bestPlacements) {
      const panelIndex = sortedPanels.findIndex(
        (p) => p.id === placement.panelId
      );
      if (panelIndex >= 0) {
        sortedPanels[panelIndex].qty--;
      }
    }

    // Update sheet quantity
    sheetsData[bestSheetIndex].qty--;

    // Update panels placed count
    panelsPlaced += bestPanelsPlaced;
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
