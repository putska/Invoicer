// components/barOptimization.ts

import { Part, Bar, BarCut, BarOptimizationResult, CutBar } from "../types";

/**
 * First-fit algorithm for 1D bin packing (bar cutting optimization)
 */
export function optimizeBars(
  parts: Part[],
  bars: Bar[],
  kerf: number = 0.125
): BarOptimizationResult {
  // Clone input data
  const partsData = parts.map((p) => ({ ...p, qty: p.qty || 1 }));
  let barsData = bars.map((b) => ({ ...b, maxQty: b.maxQty ?? b.qty }));

  // Sort parts by length (longest first)
  const sortedParts = [...partsData].sort((a, b) => b.length - a.length);

  // Initialize results
  const cuts: BarCut[] = [];
  const usedBars: CutBar[] = [];

  // Track total parts to place
  const totalPartsToPlace = sortedParts.reduce((sum, p) => sum + p.qty!, 0);
  let partsPlaced = 0;

  // Track bar usage
  const barCounts = new Map<number, number>();
  barsData.forEach((b) => barCounts.set(b.id, 0));

  // Group parts by part number and finish
  const partsByGroup: Record<string, Part[]> = {};

  // Special marker for parts with no finish or partNo
  const NO_FINISH = "__NO_FINISH__";
  const NO_PART_NO = "__NO_PART_NO__";

  sortedParts.forEach((part) => {
    const finishKey = part.finish || NO_FINISH;
    const partNoKey = part.partNo || NO_PART_NO;
    const groupKey = `${partNoKey}|${finishKey}`;

    if (!partsByGroup[groupKey]) {
      partsByGroup[groupKey] = [];
    }
    partsByGroup[groupKey].push(part);
  });

  // Process each group separately
  for (const [groupKey, groupParts] of Object.entries(partsByGroup)) {
    // Extract the finish from the group key
    const [partNoValue, finishValue] = groupKey.split("|");
    const finish = finishValue !== NO_FINISH ? finishValue : undefined;

    // Continue placing parts until all are placed or we run out of bars
    let remainingParts = [...groupParts];

    while (remainingParts.some((p) => p.qty! > 0) && barsData.length > 0) {
      // Find the best bar for the current set of parts
      let bestBarIndex = -1;
      let bestBarUsage = -1;
      let bestBarCuts: BarCut[] = [];

      // Try each available bar type
      for (let i = 0; i < barsData.length; i++) {
        const bar = barsData[i];
        if (bar.qty <= 0) continue;

        // Try to place parts on this bar
        const result = placePartsOnBar(
          remainingParts,
          bar,
          kerf,
          finish // Now using the extracted finish value
        );

        // Calculate usage efficiency
        const efficiency = result.usedLength / bar.length;

        // If this bar has better usage or places more parts, select it
        if (
          result.cuts.length > 0 &&
          (bestBarIndex === -1 || efficiency > bestBarUsage)
        ) {
          bestBarIndex = i;
          bestBarUsage = efficiency;
          bestBarCuts = result.cuts;
        }
      }

      // If no suitable bar is found, break
      if (bestBarIndex === -1) break;

      // Use the selected bar
      const selectedBar = barsData[bestBarIndex];

      // Update bar usage count
      const usageCount = (barCounts.get(selectedBar.id) || 0) + 1;
      barCounts.set(selectedBar.id, usageCount);

      // Update bar number in cuts
      bestBarCuts.forEach((c) => {
        c.barNo = usageCount;
      });

      // Calculate used length and waste
      const usedLength =
        bestBarCuts.reduce((total, cut) => total + cut.length, 0) +
        (bestBarCuts.length - 1) * kerf;

      // Add bar to used bars
      usedBars.push({
        barId: selectedBar.id,
        barNo: usageCount,
        length: selectedBar.length,
        usedLength,
        wastePercentage: 100 * (1 - usedLength / selectedBar.length),
        cuts: bestBarCuts,
        partNo: selectedBar.partNo, // Include the part number
        description: selectedBar.description, // Include the description
      });

      // Add cuts to results
      cuts.push(...bestBarCuts);

      // Update part quantities based on what was placed
      bestBarCuts.forEach((cut) => {
        const partIndex = remainingParts.findIndex((p) => p.id === cut.partId);
        if (partIndex >= 0 && remainingParts[partIndex].qty! > 0) {
          remainingParts[partIndex].qty!--;
          partsPlaced++;
        }
      });

      // Update bar quantity
      barsData[bestBarIndex].qty--;

      // Filter out bars with zero quantity
      barsData = barsData.filter((b) => b.qty > 0);
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
      barTypesUsed: [...barCounts.entries()].filter(([_, count]) => count > 0)
        .length,
    },
  };
}

/**
 * Place parts on a single bar using first-fit algorithm
 */
function placePartsOnBar(
  parts: Part[],
  bar: Bar,
  kerf: number,
  finish?: string
): { cuts: BarCut[]; usedLength: number } {
  // Filter parts by finish if specified
  const eligibleParts = finish
    ? parts.filter((p) => (p.finish || "") === finish && p.qty! > 0)
    : parts.filter((p) => p.qty! > 0);

  if (eligibleParts.length === 0) {
    return { cuts: [], usedLength: 0 };
  }

  // Current position on the bar
  let position = 0;

  // List of cuts
  const cuts: BarCut[] = [];

  // Copy of parts to track remaining quantities
  const remainingParts = [...eligibleParts];

  // Keep placing parts until we run out of space or parts
  while (position < bar.length && remainingParts.some((p) => p.qty! > 0)) {
    // Find the longest part that fits in the remaining space
    let bestPartIndex = -1;
    let bestPartLength = 0;

    for (let i = 0; i < remainingParts.length; i++) {
      const part = remainingParts[i];
      if (part.qty! <= 0) continue;

      // Check if part fits in remaining space
      if (
        position + part.length <= bar.length &&
        (bestPartIndex === -1 || part.length > bestPartLength)
      ) {
        bestPartIndex = i;
        bestPartLength = part.length;
      }
    }

    // If no part fits, we're done with this bar
    if (bestPartIndex === -1) break;

    // Place the part
    const part = remainingParts[bestPartIndex];

    cuts.push({
      partId: part.id,
      barId: bar.id,
      barNo: 1, // Will be updated later
      position,
      length: part.length,
      markNo: part.markNo,
      finish: part.finish,
      fab: part.fab,
      partNo: part.partNo,
    });

    // Decrement part quantity
    part.qty!--;

    // Move position, accounting for the kerf (blade width)
    position += part.length + kerf;
  }

  // Calculate total used length
  const usedLength =
    cuts.length > 0
      ? cuts.reduce((total, cut) => total + cut.length, 0) +
        (cuts.length - 1) * kerf
      : 0;

  return { cuts, usedLength };
}

/**
 * Find the optimal bar length for a given set of parts
 */
export function findBestBarLength(
  parts: Part[],
  minLength: number = 120,
  maxLength: number = 480,
  stepSize: number = 12,
  kerf: number = 0.125
): { length: number } {
  // Clone parts and calculate their total length
  const partsData = parts.map((p) => ({ ...p, qty: p.qty || 1 }));
  const totalPartLength = partsData.reduce(
    (sum, part) => sum + part.length * part.qty!,
    0
  );

  // Add an estimate for kerf waste
  const totalParts = partsData.reduce((sum, part) => sum + part.qty!, 0);
  const estimatedKerfWaste = (totalParts - partsData.length) * kerf;

  const requiredLength = totalPartLength + estimatedKerfWaste;

  // Generate candidate bar lengths to test
  const candidateLengths: number[] = [];
  for (let length = minLength; length <= maxLength; length += stepSize) {
    candidateLengths.push(length);
  }

  // If standard lengths are preferred, add them to candidates
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

  // Test each candidate length
  for (const length of candidateLengths) {
    // Create a bar with this length
    const bar: Bar = {
      id: 1,
      length,
      qty: 1000, // Large quantity for testing
    };

    // Run optimization with this bar
    const result = optimizeBars(partsData, [bar], kerf);

    // Calculate waste
    const barsNeeded = result.summary.totalBars;
    const totalMaterial = barsNeeded * length;
    const waste = totalMaterial - result.summary.usedLength;

    // If this produces less waste, it's our new best
    if (waste < bestWaste) {
      bestWaste = waste;
      bestLength = length;
    }
  }

  return { length: bestLength };
}

/**
 * Find optimal bar lengths for each part number
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
    // Skip determining for "NO_PART_NO" as it's a fallback
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
      // Just ensure there's enough quantity
      existingBar.qty = Math.max(existingBar.qty, 1000);
    }
  });

  return bars;
}

/**
 * Modified optimize function to respect part number specific bars
 */
export function optimizeBarsWithPartMatching(
  parts: Part[],
  bars: Bar[],
  kerf: number = 0.125
): BarOptimizationResult {
  // Clone input data
  const partsData = parts.map((p) => ({ ...p, qty: p.qty || 1 }));
  let barsData = bars.map((b) => ({ ...b, maxQty: b.maxQty ?? b.qty }));

  // Sort parts by length (longest first)
  const sortedParts = [...partsData].sort((a, b) => b.length - a.length);

  // Initialize results
  const cuts: BarCut[] = [];
  const usedBars: CutBar[] = [];

  // Track total parts to place
  const totalPartsToPlace = sortedParts.reduce((sum, p) => sum + p.qty!, 0);
  let partsPlaced = 0;

  // Track bar usage
  const barCounts = new Map<number, number>();
  barsData.forEach((b) => barCounts.set(b.id, 0));

  // Group parts by part number and finish
  const partsByGroup: Record<string, Part[]> = {};

  // Special marker for parts with no finish or partNo
  const NO_FINISH = "__NO_FINISH__";
  const NO_PART_NO = "__NO_PART_NO__";

  sortedParts.forEach((part) => {
    const finishKey = part.finish || NO_FINISH;
    const partNoKey = part.partNo || NO_PART_NO;
    const groupKey = `${partNoKey}|${finishKey}`;

    if (!partsByGroup[groupKey]) {
      partsByGroup[groupKey] = [];
    }
    partsByGroup[groupKey].push(part);
  });

  // Process each group separately
  for (const [groupKey, groupParts] of Object.entries(partsByGroup)) {
    // Extract partNo and finish from the group key
    const [partNoValue, finishValue] = groupKey.split("|");
    const partNo = partNoValue !== NO_PART_NO ? partNoValue : undefined;
    const finish = finishValue !== NO_FINISH ? finishValue : undefined;

    // Continue placing parts until all are placed or we run out of bars
    let remainingParts = [...groupParts];

    while (remainingParts.some((p) => p.qty! > 0) && barsData.length > 0) {
      // Find the best bar for the current set of parts
      let bestBarIndex = -1;
      let bestBarUsage = -1;
      let bestBarCuts: BarCut[] = [];

      // First, try bars that match the part number
      const matchingBars = barsData.filter(
        (b) =>
          // Either the bar has no partNo restriction, or it matches this part's partNo
          !b.partNo || b.partNo === partNo
      );

      if (matchingBars.length === 0) {
        console.warn(
          `No matching bars available for part ${partNo || "unknown"}`
        );
        break;
      }

      // Try each available bar type
      for (let i = 0; i < matchingBars.length; i++) {
        const bar = matchingBars[i];
        if (bar.qty <= 0) continue;

        // Try to place parts on this bar
        const result = placePartsOnBar(remainingParts, bar, kerf, finish);

        // Calculate usage efficiency
        const efficiency = result.usedLength / bar.length;

        // Prefer exact-match bars first, then consider efficiency
        const isExactMatch = bar.partNo === partNo;
        const currentBestIsExactMatch =
          bestBarIndex >= 0 && barsData[bestBarIndex].partNo === partNo;

        // If both are exact matches or both are general-purpose, use efficiency
        // If one is exact match and other isn't, prefer exact match
        if (
          result.cuts.length > 0 &&
          (bestBarIndex === -1 ||
            (isExactMatch && !currentBestIsExactMatch) ||
            (isExactMatch === currentBestIsExactMatch &&
              efficiency > bestBarUsage))
        ) {
          // Find the actual index in the original barsData array
          const originalIndex = barsData.findIndex((b) => b.id === bar.id);
          if (originalIndex >= 0) {
            bestBarIndex = originalIndex;
            bestBarUsage = efficiency;
            bestBarCuts = result.cuts;
          }
        }
      }

      // If no suitable bar is found, break
      if (bestBarIndex === -1) break;

      // Use the selected bar
      const selectedBar = barsData[bestBarIndex];

      // Update bar usage count
      const usageCount = (barCounts.get(selectedBar.id) || 0) + 1;
      barCounts.set(selectedBar.id, usageCount);

      // Update bar number in cuts
      bestBarCuts.forEach((c) => {
        c.barNo = usageCount;
      });

      // Calculate used length and waste
      const usedLength =
        bestBarCuts.reduce((total, cut) => total + cut.length, 0) +
        (bestBarCuts.length - 1) * kerf;

      // Add bar to used bars
      usedBars.push({
        barId: selectedBar.id,
        barNo: usageCount,
        length: selectedBar.length,
        usedLength,
        wastePercentage: 100 * (1 - usedLength / selectedBar.length),
        cuts: bestBarCuts,
      });

      // Add cuts to results
      cuts.push(...bestBarCuts);

      // Update part quantities based on what was placed
      bestBarCuts.forEach((cut) => {
        const partIndex = remainingParts.findIndex((p) => p.id === cut.partId);
        if (partIndex >= 0 && remainingParts[partIndex].qty! > 0) {
          remainingParts[partIndex].qty!--;
          partsPlaced++;
        }
      });

      // Update bar quantity
      barsData[bestBarIndex].qty--;

      // Filter out bars with zero quantity
      barsData = barsData.filter((b) => b.qty > 0);
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
      barTypesUsed: [...barCounts.entries()].filter(([_, count]) => count > 0)
        .length,
    },
  };
}
