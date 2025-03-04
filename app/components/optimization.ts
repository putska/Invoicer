// optimization.ts
import {
  Part,
  ExtCutlistItem,
  ExtListItem,
  OptimizationResult,
  CutPatternItem,
  Cut,
  StockLengthNeeded,
  OptimizationSummary,
} from "../types";

/**
 * Main optimization function for extrusions
 * @param parts List of parts to be optimized
 * @param stockLengths List of available stock lengths and quantities
 * @param bladeWidth Width of the cutting blade in the same units as lengths
 * @returns Optimization result with cutting patterns and summary
 */
export function optimizeExtrusions(
  parts: Part[],
  stockLengths: ExtListItem[],
  bladeWidth: number = 0.25
): OptimizationResult {
  // Clone the input data to avoid mutations
  const partsData = JSON.parse(JSON.stringify(parts)) as Part[];
  const stockLengthsData = JSON.parse(
    JSON.stringify(stockLengths)
  ) as ExtListItem[];

  // Initialize result collections
  const cutPattern: CutPatternItem[] = [];
  const stockLengthsNeeded: StockLengthNeeded[] = [];

  // Prepare data for optimization
  const extCutlist = prepareExtCutlist(partsData);

  // First, check if any part is longer than available stock lengths
  const partsTooLong = validatePartLengths(partsData, stockLengthsData);
  if (partsTooLong.length > 0) {
    throw new Error(
      `Part numbers ${partsTooLong.join(
        ", "
      )} have lengths longer than the stock lengths provided.`
    );
  }

  // Process parts with multiple stock length options
  const multiLengthParts = findPartsWithMultipleStockLengths(stockLengthsData);
  processMultiLengthParts(
    multiLengthParts,
    extCutlist,
    stockLengthsData,
    bladeWidth
  );

  // Optimize all items using a single stock length
  optimizeAllItems(
    extCutlist,
    stockLengthsData,
    bladeWidth,
    cutPattern,
    stockLengthsNeeded
  );

  // Calculate summary statistics
  const summary = calculateSummary(cutPattern);

  return {
    cutPattern,
    stockLengthsNeeded,
    summary,
  };
}

/**
 * Convert input parts data to the internal format used for optimization
 */
function prepareExtCutlist(parts: Part[]): ExtCutlistItem[] {
  const extCutlist: ExtCutlistItem[] = [];
  const groupedParts: Record<string, Part[]> = {};

  // Group parts by part_no, finish, length, mark_no, and fab
  parts.forEach((part) => {
    const key = `${part.part_no}|${part.finish}|${part.length}|${part.mark_no}|${part.fab}`;
    if (!groupedParts[key]) {
      groupedParts[key] = [];
    }
    groupedParts[key].push(part);
  });

  // Create entries in extCutlist
  let itemCounter = 1;
  Object.values(groupedParts).forEach((partGroup) => {
    if (partGroup.length === 0) return;

    const firstPart = partGroup[0];
    const totalQty = partGroup.reduce((sum, part) => sum + part.qty, 0);

    extCutlist.push({
      item: itemCounter++,
      part_no: firstPart.part_no,
      length: firstPart.length,
      mark: firstPart.mark_no,
      qty: totalQty,
      fab: firstPart.fab,
      release: firstPart.release,
      tempqty: totalQty,
      stklen: 0,
      drops: 0,
      usedropsfor: "",
      stklensize: firstPart.stklensize || 0,
      finish: firstPart.finish,
      tblname: firstPart.tblname,
    });
  });

  return extCutlist;
}

/**
 * Check if any parts are longer than available stock lengths
 */
function validatePartLengths(
  parts: Part[],
  stockLengths: ExtListItem[]
): string[] {
  const partsTooLong: string[] = [];

  const stockLengthsByPartAndFinish: Record<string, number[]> = {};

  // Group stock lengths by part and finish
  stockLengths.forEach((stock) => {
    const key = `${stock.part_no}|${stock.finish}`;
    if (!stockLengthsByPartAndFinish[key]) {
      stockLengthsByPartAndFinish[key] = [];
    }

    if (stock.length1 > 0) {
      stockLengthsByPartAndFinish[key].push(stock.length1);
    }

    if (stock.length2 > 0) {
      stockLengthsByPartAndFinish[key].push(stock.length2);
    }
  });

  // Check each part length against available stock lengths
  parts.forEach((part) => {
    const key = `${part.part_no}|${part.finish}`;
    const availableLengths = stockLengthsByPartAndFinish[key] || [];

    if (
      availableLengths.length === 0 ||
      Math.max(...availableLengths) < part.length
    ) {
      if (!partsTooLong.includes(part.part_no)) {
        partsTooLong.push(part.part_no);
      }
    }
  });

  return partsTooLong;
}

/**
 * Find parts that have multiple stock length options
 */
function findPartsWithMultipleStockLengths(
  stockLengths: ExtListItem[]
): ExtListItem[] {
  return stockLengths.filter((stock) => stock.length2 > 0);
}

/**
 * Process parts with multiple stock length options to determine optimal length
 */
function processMultiLengthParts(
  multiLengthParts: ExtListItem[],
  extCutlist: ExtCutlistItem[],
  stockLengths: ExtListItem[],
  bladeWidth: number
): void {
  multiLengthParts.forEach((stockItem) => {
    const partsForStock = extCutlist.filter(
      (item) =>
        item.part_no === stockItem.part_no && item.finish === stockItem.finish
    );

    if (partsForStock.length === 0) return;

    // Try each available stock length and pick the best one
    const lengths = [stockItem.length1, stockItem.length2].filter((l) => l > 0);
    const quantities = [stockItem.qty1, stockItem.qty2];

    let bestLength = 0;
    let bestWaste = Number.MAX_VALUE;

    lengths.forEach((length, index) => {
      if (quantities[index] <= 0) return;

      // Clone parts to test this length
      const testParts = JSON.parse(
        JSON.stringify(partsForStock)
      ) as ExtCutlistItem[];

      // Try to fit parts on this stock length
      const waste = testOneStockLength(testParts, length, bladeWidth, false);

      if (waste < bestWaste) {
        bestWaste = waste;
        bestLength = length;
      }
    });

    // Update the parts with the best stock length
    partsForStock.forEach((part) => {
      part.stklensize = bestLength;
    });
  });
}

/**
 * Test optimization for one stock length
 * @param parts Parts to fit on the stock length
 * @param stockLength Length of stock to use
 * @param bladeWidth Width of cutting blade
 * @param commit Whether to commit the changes to the parts
 * @returns Remaining length (waste)
 */
function testOneStockLength(
  parts: ExtCutlistItem[],
  stockLength: number,
  bladeWidth: number,
  commit: boolean
): number {
  // Sort parts by length in descending order
  parts.sort((a, b) => b.length - a.length);

  let currentStockLength = stockLength;
  let remainingQty = parts.reduce((sum, part) => sum + part.tempqty, 0);

  if (remainingQty === 0) {
    return stockLength; // No parts to process
  }

  // Find the first part that fits
  const firstPartIndex = parts.findIndex(
    (part) => part.length <= currentStockLength && part.tempqty > 0
  );

  if (firstPartIndex === -1) {
    return stockLength; // No parts fit
  }

  // Mark the first part as used
  if (commit) {
    parts[firstPartIndex].stklen += 1;
    parts[firstPartIndex].tempqty -= 1;
  }

  currentStockLength -= parts[firstPartIndex].length + bladeWidth;

  // Find more parts that fit in the remaining space
  let usedPartIndices: number[] = [];

  // Keep trying to fit more parts
  let foundMore = true;
  while (foundMore) {
    foundMore = false;

    // Try to fit each remaining part
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].tempqty > 0 && parts[i].length <= currentStockLength) {
        // Part fits
        foundMore = true;

        if (commit) {
          parts[i].drops += 1;
          parts[i].tempqty -= 1;

          // Mark which parts are being used as drops from the first part
          if (i !== firstPartIndex) {
            usedPartIndices.push(i);
          }
        }

        currentStockLength -= parts[i].length + bladeWidth;
        break; // Move to next best fitting part
      }
    }
  }

  // Update the usedropsfor field if committing
  if (commit && usedPartIndices.length > 0) {
    const itemsUsed = usedPartIndices
      .map((idx) => parts[idx].item.toString())
      .join(" ");
    parts[firstPartIndex].usedropsfor += itemsUsed;
  }

  return currentStockLength;
}

/**
 * Optimize all items using the assigned stock lengths
 */
function optimizeAllItems(
  extCutlist: ExtCutlistItem[],
  stockLengths: ExtListItem[],
  bladeWidth: number,
  cutPattern: CutPatternItem[],
  stockLengthsNeeded: StockLengthNeeded[]
): void {
  // Ensure stklensize is set properly
  for (const part of extCutlist) {
    if (part.stklensize === 0) {
      const matchingStock = stockLengths.find(
        (s) => s.part_no === part.part_no && s.finish === part.finish
      );
      if (matchingStock) {
        part.stklensize = matchingStock.length1;
        console.log(
          `Setting stklensize for part ${part.part_no} to ${part.stklensize}`
        );
      }
    }
  }

  // Group parts by part_no, finish, and stklensize
  const partGroups: Record<string, ExtCutlistItem[]> = {};

  extCutlist.forEach((part) => {
    const key = `${part.part_no}|${part.finish}|${part.stklensize}`;
    if (!partGroups[key]) {
      partGroups[key] = [];
    }
    partGroups[key].push(part);
  });

  // Process each group separately
  Object.entries(partGroups).forEach(([key, parts]) => {
    if (parts.length === 0) return;

    // Ensure consistent stock length
    const stockLength = parts[0].stklensize;

    // Sort parts by length (descending)
    parts.sort((a, b) => b.length - a.length);

    let stockId = 0;

    // Keep cutting until all parts are processed
    while (parts.some((part) => part.tempqty > 0)) {
      stockId++;
      let currentStockLength = stockLength;
      const currentCuts: Cut[] = [];

      // First pass: try to fit the largest piece from each part that will fit
      let firstPartIndex = -1;

      for (let i = 0; i < parts.length; i++) {
        if (parts[i].tempqty > 0 && parts[i].length <= currentStockLength) {
          firstPartIndex = i;

          currentCuts.push({
            part_no: parts[i].part_no,
            length: parts[i].length,
            mark: parts[i].mark,
            finish: parts[i].finish,
            fab: parts[i].fab,
            release: parts[i].release,
          });

          parts[i].tempqty -= 1;
          parts[i].stklen += 1;
          currentStockLength -= parts[i].length + bladeWidth;
          break;
        }
      }

      // If no first part fit, break out (should never happen if validation occurred)
      if (firstPartIndex === -1) {
        break;
      }

      // Second pass: try to fit remaining pieces using "best fit" approach
      let canFitMore = true;

      while (canFitMore) {
        let bestFitIndex = -1;
        let bestFitLength = 0;

        // Find the piece that best fits the remaining space
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].tempqty > 0 && parts[i].length <= currentStockLength) {
            if (parts[i].length > bestFitLength) {
              bestFitLength = parts[i].length;
              bestFitIndex = i;
            }
          }
        }

        if (bestFitIndex !== -1) {
          // Add the best fitting piece
          currentCuts.push({
            part_no: parts[bestFitIndex].part_no,
            length: parts[bestFitIndex].length,
            mark: parts[bestFitIndex].mark,
            finish: parts[bestFitIndex].finish,
            fab: parts[bestFitIndex].fab,
            release: parts[bestFitIndex].release,
          });

          parts[bestFitIndex].tempqty -= 1;

          // Record this as a drop for tracking in the original algorithm
          if (bestFitIndex !== firstPartIndex) {
            parts[bestFitIndex].drops += 1;

            // Update the "usedropsfor" field to track dependencies between parts
            // This mimics the behavior in the original VBA algorithm
            const firstPartItem = parts[firstPartIndex].item;
            const bestFitItem = parts[bestFitIndex].item;

            if (
              !parts[firstPartIndex].usedropsfor.includes(
                bestFitItem.toString()
              )
            ) {
              parts[firstPartIndex].usedropsfor += ` ${bestFitItem}`;
            }
          }

          currentStockLength -= parts[bestFitIndex].length + bladeWidth;
        } else {
          // No more pieces fit
          canFitMore = false;
        }
      }

      // If we used any stock, record the pattern
      if (currentCuts.length > 0) {
        cutPattern.push({
          stockLength,
          stockId,
          cuts: currentCuts,
          remainingLength: currentStockLength,
        });

        // Update stock lengths needed
        const existingStock = stockLengthsNeeded.find(
          (s) =>
            s.part_no === parts[0].part_no &&
            s.finish === parts[0].finish &&
            s.stockLength === stockLength
        );

        if (existingStock) {
          existingStock.quantity += 1;
        } else {
          stockLengthsNeeded.push({
            part_no: parts[0].part_no,
            finish: parts[0].finish,
            stockLength,
            quantity: 1,
          });
        }
      }
    }
  });
}

/**
 * Calculate summary statistics for the optimization
 */
export function calculateSummary(
  cutPattern: CutPatternItem[]
): OptimizationSummary {
  let totalStockLength = 0;
  let totalCutLength = 0;

  cutPattern.forEach((pattern) => {
    totalStockLength += pattern.stockLength;

    // Sum up all the cuts
    totalCutLength += pattern.cuts.reduce((sum, cut) => sum + cut.length, 0);
  });

  return {
    totalStockLength,
    totalCutLength,
    wastePercentage:
      totalStockLength > 0
        ? ((totalStockLength - totalCutLength) / totalStockLength) * 100
        : 0,
    totalStockPieces: cutPattern.length,
  };
}

/**
 * Determine the best stock length for a given set of parts
 * @param parts List of parts to optimize
 * @param minLength Minimum stock length to consider
 * @param maxLength Maximum stock length to consider
 * @param bladeWidth Width of the cutting blade
 * @returns The optimal stock length
 */
export function findBestStockLength(
  parts: Part[],
  minLength: number = 180,
  maxLength: number = 300,
  bladeWidth: number = 0.25
): number {
  // Prepare data for optimization
  const extCutlist = prepareExtCutlist(parts);

  // Find the longest part to ensure our minimum stock length is sufficient
  const longestPart = Math.max(...parts.map((p) => p.length));
  minLength = Math.max(minLength, longestPart + 1);

  let bestLength = minLength;
  let bestWaste = Number.MAX_VALUE;

  // Try each possible stock length
  for (let length = minLength; length <= maxLength; length++) {
    let totalUsedMaterial = 0;

    // Create a fresh copy of parts for each test
    const testParts = JSON.parse(
      JSON.stringify(extCutlist)
    ) as ExtCutlistItem[];

    // Keep optimizing until all parts are used
    while (testParts.some((part) => part.tempqty > 0)) {
      // Run the optimization with commit=true for this test batch
      // Your existing testOneStockLength function should update the parts
      const remainingLength = testOneStockLength(
        testParts,
        length,
        bladeWidth,
        true
      );

      // Add the used portion of this stock length to our total
      totalUsedMaterial += length;
    }

    // If this stock length resulted in less total material used, it's our new best
    if (totalUsedMaterial < bestWaste) {
      bestWaste = totalUsedMaterial;
      bestLength = length;
    }
  }

  return bestLength;
}
