import { Part, Bar, BarCut, BarOptimizationResult, CutBar } from "../types";

/**
 * First-fit algorithm for 1D bin packing (bar cutting optimization)
 * Rewritten to more closely match the original VBA algorithm
 */
export function optimizeBars(
  parts: Part[],
  bars: Bar[],
  kerf: number = 0.125
): BarOptimizationResult {
  // Clone input data
  const partsData = parts.map((p) => ({ ...p, qty: p.qty || 1 }));

  // Create a pool of bars with sufficient quantity
  // Using a new interface internally that includes barNo
  interface BarWithNumber extends Bar {
    barNo?: number;
  }

  let barPool: BarWithNumber[] = [];
  bars.forEach((bar) => {
    // Add each bar with its quantity
    for (let i = 0; i < bar.qty; i++) {
      barPool.push({
        ...bar,
        qty: 1, // Each bar instance has qty of 1
        barNo: i + 1, // Assign a unique bar number within this bar type
      });
    }
  });

  // Sort parts by partNo, finish, and then length (descending)
  const sortedParts = [...partsData].sort((a, b) => {
    // First sort by partNo
    if ((a.partNo || "") < (b.partNo || "")) return -1;
    if ((a.partNo || "") > (b.partNo || "")) return 1;

    // Then by finish
    if ((a.finish || "") < (b.finish || "")) return -1;
    if ((a.finish || "") > (b.finish || "")) return 1;

    // Finally by length (descending)
    return b.length - a.length;
  });

  // Initialize results
  const cuts: BarCut[] = [];
  const usedBars: CutBar[] = [];

  // Track total parts to place and parts placed
  const totalPartsToPlace = sortedParts.reduce((sum, p) => sum + p.qty!, 0);
  let partsPlaced = 0;

  // Group parts by partNo and finish
  const partGroups: Record<string, Part[]> = {};
  sortedParts.forEach((part) => {
    const groupKey = `${part.partNo || "NO_PART_NO"}|${
      part.finish || "NO_FINISH"
    }`;
    if (!partGroups[groupKey]) {
      partGroups[groupKey] = [];
    }
    partGroups[groupKey].push({ ...part });
  });

  // Process each part group
  for (const [groupKey, groupParts] of Object.entries(partGroups)) {
    // Extract partNo and finish from group key
    const [partNoValue, finishValue] = groupKey.split("|");
    const partNo = partNoValue !== "NO_PART_NO" ? partNoValue : undefined;
    const finish = finishValue !== "NO_FINISH" ? finishValue : undefined;

    // Sort parts by length (descending) within the group
    const sortedGroupParts = [...groupParts].sort(
      (a, b) => b.length - a.length
    );

    // Create a remaining parts queue for this group
    const remainingParts: Part[] = [];
    sortedGroupParts.forEach((part) => {
      // Add each part instance based on its quantity
      for (let i = 0; i < part.qty!; i++) {
        remainingParts.push({
          ...part,
          qty: 1, // Each part instance has qty of 1
        });
      }
    });

    // Continue placing parts until all are placed or we run out of bars
    while (remainingParts.length > 0 && barPool.length > 0) {
      // Find the best bar for the next part
      const nextPart = remainingParts[0];
      let bestBarIndex = -1;

      // Filter bars that can fit the part
      // First, prefer bars that match the part number
      const matchingBars = barPool.filter(
        (b) => b.length >= nextPart.length && (!b.partNo || b.partNo === partNo)
      );

      if (matchingBars.length > 0) {
        // Find the best matching bar (prefer exact matches first, then smallest waste)
        for (let i = 0; i < matchingBars.length; i++) {
          const bar = matchingBars[i];
          const isExactMatch = bar.partNo === partNo;

          if (
            bestBarIndex === -1 ||
            (isExactMatch && barPool[bestBarIndex].partNo !== partNo) ||
            (isExactMatch === (barPool[bestBarIndex].partNo === partNo) &&
              bar.length < barPool[bestBarIndex].length)
          ) {
            bestBarIndex = barPool.indexOf(bar);
          }
        }
      }

      // If no suitable bar is found, break
      if (bestBarIndex === -1) break;

      // Use the selected bar
      const selectedBar = barPool[bestBarIndex];
      const barCuts: BarCut[] = [];
      let remainingLength = selectedBar.length;

      // Keep track of parts placed on this bar
      const placedPartsIndices: number[] = [];

      // Place first part
      barCuts.push({
        partId: nextPart.id,
        barId: selectedBar.id,
        barNo: selectedBar.barNo || 1, // Use barNo if available, otherwise default to 1
        position: 0,
        length: nextPart.length,
        markNo: nextPart.markNo,
        finish: nextPart.finish,
        fab: nextPart.fab,
        partNo: nextPart.partNo,
      });

      placedPartsIndices.push(0);
      remainingLength -= nextPart.length;

      // Try to fit more parts on this bar
      let position = nextPart.length + kerf;

      // Look for more parts that fit
      for (let i = 1; i < remainingParts.length; i++) {
        const part = remainingParts[i];

        // Check if part fits in remaining space
        if (remainingLength >= part.length + kerf) {
          barCuts.push({
            partId: part.id,
            barId: selectedBar.id,
            barNo: selectedBar.barNo || 1, // Use barNo if available, otherwise default to 1
            position: position,
            length: part.length,
            markNo: part.markNo,
            finish: part.finish,
            fab: part.fab,
            partNo: part.partNo,
          });

          placedPartsIndices.push(i);
          position += part.length + kerf;
          remainingLength -= part.length + kerf;
        }
      }

      // Calculate used length and waste
      const usedLength = selectedBar.length - remainingLength;

      // Add bar to used bars
      usedBars.push({
        barId: selectedBar.id,
        barNo: selectedBar.barNo || 1, // Use barNo if available, otherwise default to 1
        length: selectedBar.length,
        usedLength,
        wastePercentage: 100 * (remainingLength / selectedBar.length),
        cuts: barCuts,
        partNo: selectedBar.partNo,
        description: selectedBar.description,
      });

      // Add cuts to results
      cuts.push(...barCuts);

      // Remove the placed parts from the remaining parts
      // Remove in reverse order to not affect indices
      placedPartsIndices
        .sort((a, b) => b - a)
        .forEach((index) => {
          remainingParts.splice(index, 1);
          partsPlaced++;
        });

      // Remove the used bar from the pool
      barPool.splice(bestBarIndex, 1);
    }
  }

  // Calculate summary statistics
  const totalLength = usedBars.reduce((sum, b) => sum + b.length, 0);
  const usedLength = usedBars.reduce((sum, b) => sum + b.usedLength, 0);
  const wastePercentage = totalLength
    ? 100 * (1 - usedLength / totalLength)
    : 0;

  return {
    cuts,
    bars: usedBars,
    summary: {
      totalBars: usedBars.length,
      totalLength,
      usedLength,
      wastePercentage,
      totalPartsPlaced: partsPlaced,
      totalPartsNeeded: totalPartsToPlace,
      barTypesUsed: bars.filter((b) => usedBars.some((ub) => ub.barId === b.id))
        .length,
    },
  };
}

/**
 * Find the optimal bar length for a given set of parts
 * Enhanced to ensure it can fit the longest part
 */
export function findBestBarLength(
  parts: Part[],
  minLength: number = 120,
  maxLength: number = 480,
  stepSize: number = 12,
  kerf: number = 0.125
): { length: number } {
  // Clone parts and find the longest part length
  const partsData = parts.map((p) => ({ ...p, qty: p.qty || 1 }));
  const longestPartLength = Math.max(...partsData.map((p) => p.length));

  // Ensure minLength is at least the longest part length
  minLength = Math.max(minLength, longestPartLength);

  // Calculate total part length and estimate kerf waste
  const totalPartLength = partsData.reduce(
    (sum, part) => sum + part.length * part.qty!,
    0
  );
  const totalParts = partsData.reduce((sum, part) => sum + part.qty!, 0);
  const estimatedKerfWaste = (totalParts - 1) * kerf; // -1 because last part doesn't need kerf

  // Generate candidate lengths
  const candidateLengths: number[] = [];
  for (let length = minLength; length <= maxLength; length += stepSize) {
    candidateLengths.push(length);
  }

  // Add standard lengths if not already included
  const standardLengths = [120, 144, 192, 240, 288, 360, 480];
  for (const length of standardLengths) {
    if (
      length >= minLength &&
      length <= maxLength &&
      !candidateLengths.includes(length)
    ) {
      candidateLengths.push(length);
    }
  }

  // Sort candidates
  candidateLengths.sort((a, b) => a - b);

  // Track best results
  let bestLength = maxLength;
  let bestWaste = Infinity;
  let bestBarsNeeded = Infinity;

  // Test each candidate length
  for (const length of candidateLengths) {
    // Skip if length can't fit the longest part
    if (length < longestPartLength) continue;

    // Create a test bar
    const bar: Bar = {
      id: 1,
      length,
      qty: 1000, // Large quantity for testing
    };

    // Run optimization with this bar
    const result = optimizeBars(partsData, [bar], kerf);

    // Calculate waste and efficiency
    const barsNeeded = result.summary.totalBars;
    const totalMaterial = barsNeeded * length;
    const waste = totalMaterial - result.summary.usedLength;
    const efficiency = result.summary.usedLength / totalMaterial;

    // Check if this length is better
    // Prioritize: (1) Fewer bars, (2) Less waste
    if (
      barsNeeded < bestBarsNeeded ||
      (barsNeeded === bestBarsNeeded && waste < bestWaste)
    ) {
      bestBarsNeeded = barsNeeded;
      bestWaste = waste;
      bestLength = length;
    }
  }

  return { length: bestLength };
}

/**
 * Find optimal bar lengths for each part number
 * Enhanced to ensure it can fit the longest part in each group
 */
export function findOptimalBarsByPartNo(
  parts: Part[],
  minLength: number = 120,
  maxLength: number = 480,
  stepSize: number = 12,
  kerf: number = 0.125
): { partNo: string; length: number }[] {
  // Group parts by partNo
  const partsByPartNo: Record<string, Part[]> = {};

  parts.forEach((part) => {
    const partNoKey = part.partNo || "NO_PART_NO";

    if (!partsByPartNo[partNoKey]) {
      partsByPartNo[partNoKey] = [];
    }
    partsByPartNo[partNoKey].push({ ...part, qty: part.qty || 1 });
  });

  // Find optimal bar length for each partNo group
  const results: { partNo: string; length: number }[] = [];

  for (const [partNo, groupParts] of Object.entries(partsByPartNo)) {
    // Skip determining for "NO_PART_NO" if it's a fallback
    if (partNo === "NO_PART_NO" && Object.keys(partsByPartNo).length > 1) {
      continue;
    }

    const optimalBar = findBestBarLength(
      groupParts,
      minLength,
      maxLength,
      stepSize,
      kerf
    );

    results.push({
      partNo: partNo === "NO_PART_NO" ? "" : partNo,
      length: optimalBar.length,
    });
  }

  return results;
}

/**
 * Create Bar objects from optimal bar results
 */
export function createBarsFromOptimalResults(
  optimalResults: { partNo: string; length: number }[],
  defaultBars: Bar[] = []
): Bar[] {
  const bars: Bar[] = [...defaultBars];
  let nextId = bars.length > 0 ? Math.max(...bars.map((b) => b.id)) + 1 : 1;

  // Create a bar for each optimal result
  optimalResults.forEach((result) => {
    // Check if a bar with this length and partNo already exists
    const existingBar = bars.find(
      (b) =>
        b.length === result.length && b.partNo === (result.partNo || undefined)
    );

    if (!existingBar) {
      bars.push({
        id: nextId++,
        length: result.length,
        qty: 1000, // Large quantity for optimization
        partNo: result.partNo || undefined,
        description: `Optimal ${result.length}" bar${
          result.partNo ? ` for ${result.partNo}` : ""
        }`,
      });
    } else {
      // Ensure there's enough quantity
      existingBar.qty = Math.max(existingBar.qty, 1000);
    }
  });

  return bars;
}

/**
 * Main optimization function that handles part-specific bars
 */
export function optimizeBarsWithPartMatching(
  parts: Part[],
  bars: Bar[],
  kerf: number = 0.125
): BarOptimizationResult {
  // The rewritten optimizeBars function already handles part matching
  return optimizeBars(parts, bars, kerf);
}
