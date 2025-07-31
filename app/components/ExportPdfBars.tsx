import React from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarCut, CutBar } from "../types";
import { decimalToFraction } from "./formatters";

interface ExportPdfBarsProps {
  cuts: BarCut[];
  bars: CutBar[];
  kerf: number;
  jobName?: string;
  notes?: string;
  children?: React.ReactNode;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

// Interface for the materials inventory summary
interface MaterialSummary {
  partNo: string;
  finish: string;
  length: number;
  count: number;
  totalGrossFeet: number;
  totalNetFeet: number;
  yield: number;
}

// Helper function to convert inches to feet
const inToFt = (inches: number): number => inches / 12;

// Helper function to generate a unique pattern key for grouping identical bars
const generatePatternKey = (barCuts: BarCut[], kerf: number): string => {
  if (!barCuts.length) return "";

  // Sort cuts by position
  const sortedCuts = [...barCuts].sort((a, b) => a.position - b.position);

  // Create a key that represents the pattern: [length]_[markNo]_[partNo]_[position]...
  return sortedCuts
    .map((cut) => `${cut.length}_${cut.markNo}_${cut.partNo}_${cut.position}`)
    .join("|");
};

export default function ExportPdfBars({
  cuts,
  bars,
  kerf,
  jobName = "Bar Optimization",
  notes = "",
  children = "Print",
  variant = "outline",
  size = "sm",
  ...props
}: ExportPdfBarsProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const exportPdf = async () => {
    if (bars.length === 0) return;

    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Add fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Page size (letter size in points: 8.5 x 11 inches)
      const pageWidth = 8.5 * 72;
      const pageHeight = 11 * 72;

      // Margins
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;

      // Header height and spacing between bar diagrams
      const headerHeight = 80;
      const barSpacing = 20;
      const barHeight = 40; // Height of each bar visualization

      // Create a function to group bars by finish
      const groupBarsByFinish = (): { finish: string; bars: CutBar[] }[] => {
        // Group all bars by looking at their cuts
        const groupedBars: Record<string, CutBar[]> = {};

        for (const bar of bars) {
          // Find cuts for this bar
          const barCuts = cuts.filter(
            (cut) => cut.barId === bar.barId && cut.barNo === bar.barNo
          );

          // Use first cut's finish as the bar finish, or "Unknown" if no cuts
          const finish =
            barCuts.length > 0 && barCuts[0].finish
              ? barCuts[0].finish
              : "Unknown";

          if (!groupedBars[finish]) {
            groupedBars[finish] = [];
          }

          groupedBars[finish].push(bar);
        }

        // Convert to array for easier handling
        return Object.entries(groupedBars).map(([finish, finishBars]) => ({
          finish,
          bars: finishBars,
        }));
      };

      // Generate materials inventory summary
      const generateMaterialsSummary = (): MaterialSummary[] => {
        // Create a map to store material summaries by partNo-finish-length
        const materialSummaryMap: Record<string, MaterialSummary> = {};

        // Process all bars
        for (const bar of bars) {
          // Find cuts for this bar
          const barCuts = cuts.filter(
            (cut) => cut.barId === bar.barId && cut.barNo === bar.barNo
          );

          // Skip if no cuts (unlikely but possible)
          if (barCuts.length === 0) continue;

          // Get finish from first cut
          const finish = barCuts[0].finish || "Unknown";

          // Get the part number from the first cut's partNo
          const partNo = barCuts[0].partNo || "Unknown";

          // Create a unique key for this part-finish-length combination
          const key = `${partNo}-${finish}-${bar.length}`;

          if (!materialSummaryMap[key]) {
            // Initialize a new entry if this combination doesn't exist
            materialSummaryMap[key] = {
              partNo,
              finish,
              length: bar.length,
              count: 0,
              totalGrossFeet: 0,
              totalNetFeet: 0,
              yield: 0,
            };
          }

          // Update counts and measurements
          materialSummaryMap[key].count++;
          materialSummaryMap[key].totalGrossFeet += inToFt(bar.length);
          materialSummaryMap[key].totalNetFeet += inToFt(bar.usedLength);
        }

        // Calculate yield percentages
        for (const key in materialSummaryMap) {
          const summary = materialSummaryMap[key];
          summary.yield = (summary.totalNetFeet / summary.totalGrossFeet) * 100;
        }

        // Convert to array and sort by part number and finish
        return Object.values(materialSummaryMap).sort((a, b) => {
          // First sort by part number - handle potential non-string values
          const partNoA = String(a.partNo || "");
          const partNoB = String(b.partNo || "");
          const partNoComparison = partNoA.localeCompare(partNoB);
          if (partNoComparison !== 0) return partNoComparison;

          // Then by finish - handle potential non-string values
          const finishA = String(a.finish || "");
          const finishB = String(b.finish || "");
          return finishA.localeCompare(finishB);
        });
      };

      // Get materials summary
      const materialsSummary = generateMaterialsSummary();

      // Group bars by finish
      const barsByFinish = groupBarsByFinish();

      // ========== CREATE SUMMARY PAGE FIRST ==========
      // Add summary page
      let summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);

      // Summary page header
      summaryPage.drawText(`${jobName} - Cutting Summary`, {
        x: margin,
        y: pageHeight - margin,
        size: 18, // Increased from 16
        font: helveticaBold,
      });

      let currentY = pageHeight - margin - 20;

      // Add notes if they exist
      if (notes && notes.trim()) {
        // Split notes into lines that fit within the page width
        const maxLineWidth = contentWidth;
        const notesFontSize = 10;
        const lineHeight = 14;

        // Simple word wrapping
        const words = notes.trim().split(" ");
        const lines: string[] = [];
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = helveticaFont.widthOfTextAtSize(
            testLine,
            notesFontSize
          );

          if (testWidth <= maxLineWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              // Word is too long, just add it anyway
              lines.push(word);
            }
          }
        }

        if (currentLine) {
          lines.push(currentLine);
        }

        // Draw notes with proper spacing
        currentY -= 10; // Add some space before notes

        summaryPage.drawText("Notes:", {
          x: margin,
          y: currentY,
          size: 12, // Increased from 11
          font: helveticaBold,
        });

        currentY -= lineHeight;

        for (const line of lines) {
          summaryPage.drawText(line, {
            x: margin,
            y: currentY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });
          currentY -= lineHeight;
        }

        currentY -= 10; // Add space after notes
      }

      summaryPage.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
        x: margin,
        y: currentY,
        size: 11, // Increased from 10
        font: helveticaFont,
      });

      currentY -= 20;

      // Add kerf information
      summaryPage.drawText(`Kerf (Cut Width): ${kerf}"`, {
        x: margin,
        y: currentY,
        size: 11, // Increased from 10
        font: helveticaFont,
      });

      currentY -= 20;

      // Bar summary section
      summaryPage.drawText("S/L Summary:", {
        x: margin,
        y: currentY,
        size: 16, // Increased from 14
        font: helveticaBold,
      });

      currentY -= 30;

      // Updated table headers with new order: Qty, Part No, Finish, Length, Gross (ft), Net (ft), Yield %
      const columns = [
        margin, // Qty
        margin + 60, // Part No
        margin + 160, // Finish
        margin + 240, // Length
        margin + 320, // Total Gross (ft)
        margin + 400, // Total Net (ft)
        margin + 480, // Yield %
      ];

      summaryPage.drawText("Qty", {
        x: columns[0],
        y: currentY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Part No", {
        x: columns[1],
        y: currentY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Finish", {
        x: columns[2],
        y: currentY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Length", {
        x: columns[3],
        y: currentY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Gross (ft)", {
        x: columns[4],
        y: currentY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Net (ft)", {
        x: columns[5],
        y: currentY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Yield %", {
        x: columns[6],
        y: currentY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      // Draw horizontal line
      summaryPage.drawLine({
        start: { x: margin, y: currentY - 5 },
        end: { x: pageWidth - margin, y: currentY - 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Table rows
      let rowY = currentY - 20;
      let totalBars = 0;
      let totalGrossFeet = 0;
      let totalNetFeet = 0;

      // Group materials by part number to show subtotals
      const partNoGroups: Record<string, MaterialSummary[]> = {};
      for (const summary of materialsSummary) {
        if (!partNoGroups[summary.partNo]) {
          partNoGroups[summary.partNo] = [];
        }
        partNoGroups[summary.partNo].push(summary);
      }

      // Process each part number group
      for (const [partNo, summaries] of Object.entries(partNoGroups)) {
        let partSubtotalBars = 0;
        let partSubtotalGrossFeet = 0;
        let partSubtotalNetFeet = 0;

        // Process each material within this part number
        for (const summary of summaries) {
          // Check if we need a new page
          if (rowY < margin + 40) {
            summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);
            summaryPage.drawText(
              `${jobName} - Materials Inventory (continued)`,
              {
                x: margin,
                y: pageHeight - margin,
                size: 18, // Increased from 16
                font: helveticaBold,
              }
            );

            // Reset position and redraw headers
            rowY = pageHeight - margin - 60;

            // Redraw column headers with new order
            summaryPage.drawText("Qty", {
              x: columns[0],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Part No", {
              x: columns[1],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Finish", {
              x: columns[2],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Length", {
              x: columns[3],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Gross (ft)", {
              x: columns[4],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Net (ft)", {
              x: columns[5],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Yield %", {
              x: columns[6],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            // Draw horizontal line
            summaryPage.drawLine({
              start: { x: margin, y: rowY - 5 },
              end: { x: pageWidth - margin, y: rowY - 5 },
              thickness: 1,
              color: rgb(0, 0, 0),
            });

            rowY -= 20;
          }

          // Draw individual material row with new column order
          summaryPage.drawText(`${summary.count}`, {
            x: columns[0],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(String(summary.partNo), {
            x: columns[1],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(String(summary.finish), {
            x: columns[2],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(`${decimalToFraction(summary.length)}"`, {
            x: columns[3],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(`${summary.totalGrossFeet.toFixed(2)}`, {
            x: columns[4],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(`${summary.totalNetFeet.toFixed(2)}`, {
            x: columns[5],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(`${summary.yield.toFixed(1)}%`, {
            x: columns[6],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          // Update subtotals
          partSubtotalBars += summary.count;
          partSubtotalGrossFeet += summary.totalGrossFeet;
          partSubtotalNetFeet += summary.totalNetFeet;

          // Update grand totals
          totalBars += summary.count;
          totalGrossFeet += summary.totalGrossFeet;
          totalNetFeet += summary.totalNetFeet;

          rowY -= 20;
        }

        // Draw part number subtotal row if there's more than one finish
        if (summaries.length > 1) {
          // Draw a lighter separator line
          summaryPage.drawLine({
            start: { x: margin, y: rowY + 10 },
            end: { x: pageWidth - margin, y: rowY + 10 },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
          });

          const partYield = (partSubtotalNetFeet / partSubtotalGrossFeet) * 100;

          // Draw subtotal row with slightly emphasized formatting - updated order
          summaryPage.drawText(`${partSubtotalBars}`, {
            x: columns[0],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaBold,
          });

          summaryPage.drawText(`${partNo} Subtotal:`, {
            x: columns[1],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaBold,
          });

          summaryPage.drawText(`${partSubtotalGrossFeet.toFixed(2)}`, {
            x: columns[4],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaBold,
          });

          summaryPage.drawText(`${partSubtotalNetFeet.toFixed(2)}`, {
            x: columns[5],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaBold,
          });

          summaryPage.drawText(`${partYield.toFixed(1)}%`, {
            x: columns[6],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaBold,
          });

          rowY -= 30; // Extra space after subtotals
        } else {
          rowY -= 10; // Just a little extra space between different part numbers
        }
      }

      // Draw horizontal line for grand totals
      summaryPage.drawLine({
        start: { x: margin, y: rowY + 10 },
        end: { x: pageWidth - margin, y: rowY + 10 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Calculate overall yield
      const overallYield = (totalNetFeet / totalGrossFeet) * 100;

      // Draw grand totals row with updated order
      summaryPage.drawText(`${totalBars}`, {
        x: columns[0],
        y: rowY - 10,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("GRAND TOTAL:", {
        x: columns[1],
        y: rowY - 10,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText(`${totalGrossFeet.toFixed(2)}`, {
        x: columns[4],
        y: rowY - 10,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText(`${totalNetFeet.toFixed(2)}`, {
        x: columns[5],
        y: rowY - 10,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText(`${overallYield.toFixed(1)}%`, {
        x: columns[6],
        y: rowY - 10,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      // Part summary section
      rowY -= 50;
      summaryPage.drawText("Part Summary:", {
        x: margin,
        y: rowY,
        size: 16, // Increased from 14
        font: helveticaBold,
      });

      // Group parts by markNo and partNo
      const partsByMark: Record<
        string,
        {
          partNo: string;
          markNo: string;
          length: number;
          finish: string;
          fab: string;
          count: number;
        }
      > = {};

      for (const cut of cuts) {
        const key = `${cut.markNo}-${cut.partNo}-${cut.length}`;
        if (!partsByMark[key]) {
          partsByMark[key] = {
            partNo: String(cut.partNo || ""),
            markNo: String(cut.markNo || ""),
            length: cut.length,
            finish: String(cut.finish || ""),
            fab: String(cut.fab || ""),
            count: 0,
          };
        }
        partsByMark[key].count++;
      }

      // Table headers for parts
      rowY -= 30;
      const pColumns = [
        margin, // Qty
        margin + 60, // Part No
        margin + 160, // Length
        margin + 230, // Mark No
        margin + 330, // Finish
        margin + 430, // Fab
      ];

      summaryPage.drawText("Qty", {
        x: pColumns[0],
        y: rowY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Part No", {
        x: pColumns[1],
        y: rowY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Length", {
        x: pColumns[2],
        y: rowY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Mark No", {
        x: pColumns[3],
        y: rowY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Finish", {
        x: pColumns[4],
        y: rowY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      summaryPage.drawText("Fab", {
        x: pColumns[5],
        y: rowY,
        size: 12, // Increased from 11
        font: helveticaBold,
      });

      // Draw horizontal line
      summaryPage.drawLine({
        start: { x: margin, y: rowY - 5 },
        end: { x: pageWidth - margin, y: rowY - 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Table rows for parts
      rowY -= 20;
      let totalParts = 0;

      // Sort parts by partNo first, then by length descending
      const sortedParts = Object.values(partsByMark).sort((a, b) => {
        // First sort by partNo - handle potential non-string values
        const partNoA = String(a.partNo || ""); // Convert to string, use empty string as fallback
        const partNoB = String(b.partNo || ""); // Convert to string, use empty string as fallback
        const partNoComparison = partNoA.localeCompare(partNoB);
        if (partNoComparison !== 0) return partNoComparison;

        // Then sort by length (descending)
        return b.length - a.length;
      });

      // Group parts by partNo to show subtotals
      const partNoSummaryGroups: Record<
        string,
        { count: number; parts: typeof sortedParts }
      > = {};
      for (const part of sortedParts) {
        if (!partNoSummaryGroups[part.partNo]) {
          partNoSummaryGroups[part.partNo] = { count: 0, parts: [] };
        }
        partNoSummaryGroups[part.partNo].count += part.count;
        partNoSummaryGroups[part.partNo].parts.push(part);
      }

      // Process each part number group
      for (const [partNo, group] of Object.entries(partNoSummaryGroups)) {
        const parts = group.parts;
        let partNoSubtotal = group.count;

        // Process each part within this part number
        for (const part of parts) {
          // Check if we need a new page
          if (rowY < margin + 40) {
            // Add new page if we're running out of space
            summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);
            summaryPage.drawText(`${jobName} - Part Summary (continued)`, {
              x: margin,
              y: pageHeight - margin,
              size: 18, // Increased from 16
              font: helveticaBold,
            });

            // Reset row position for new page
            rowY = pageHeight - margin - 60;

            // Redraw table headers
            summaryPage.drawText("Qty", {
              x: pColumns[0],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Part No", {
              x: pColumns[1],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Length", {
              x: pColumns[2],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Mark No", {
              x: pColumns[3],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Finish", {
              x: pColumns[4],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            summaryPage.drawText("Fab", {
              x: pColumns[5],
              y: rowY,
              size: 12, // Increased from 11
              font: helveticaBold,
            });

            // Draw horizontal line
            summaryPage.drawLine({
              start: { x: margin, y: rowY - 5 },
              end: { x: pageWidth - margin, y: rowY - 5 },
              thickness: 1,
              color: rgb(0, 0, 0),
            });

            rowY -= 20;
          }

          // Draw part row with the new column order
          summaryPage.drawText(`${part.count}`, {
            x: pColumns[0],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(part.partNo || "", {
            x: pColumns[1],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(`${decimalToFraction(part.length)}"`, {
            x: pColumns[2],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(part.markNo || "", {
            x: pColumns[3],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(part.finish || "", {
            x: pColumns[4],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          summaryPage.drawText(String(part.fab || ""), {
            x: pColumns[5],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaFont,
          });

          totalParts += part.count;
          rowY -= 20;
        }

        // If there are multiple parts with the same part number, show a subtotal
        if (parts.length > 1) {
          // Draw a lighter separator line
          summaryPage.drawLine({
            start: { x: margin, y: rowY + 10 },
            end: { x: pageWidth - margin, y: rowY + 10 },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
          });

          // Draw subtotal row
          summaryPage.drawText(`${partNoSubtotal}`, {
            x: pColumns[0],
            y: rowY,
            size: 11, // Increased from 10
            font: helveticaBold,
          });

          rowY -= 25; // Extra space after subtotals
        } else {
          rowY -= 5; // Just a little extra space between different part numbers
        }
      }

      // Draw horizontal line for part totals
      summaryPage.drawLine({
        start: { x: margin, y: rowY + 10 },
        end: { x: pageWidth - margin, y: rowY + 10 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Totals row for parts
      summaryPage.drawText(`${totalParts}`, {
        x: pColumns[0],
        y: rowY - 10,
        size: 11, // Increased from 10
        font: helveticaBold,
      });

      summaryPage.drawText("TOTAL PARTS TO CUT", {
        x: pColumns[1],
        y: rowY - 10,
        size: 11, // Increased from 10
        font: helveticaBold,
      });

      // Updated Bar Cutting Diagrams section - organized by Part No, Finish, Length (desc) and using full-width scaling

      // ========== BAR CUTTING DIAGRAMS WITH GROUPING ==========
      // First, reorganize the bars by part number, finish, and length (descending)
      // We'll create a structure to group them appropriately
      type PatternGroupType = {
        pattern: string;
        barLength: number;
        representativeBar: CutBar;
        barCuts: BarCut[];
        barIds: { barId: number; barNo: number }[];
        wastePercentage: number;
        partNo: string;
        finish: string;
      };

      // Group all bars by their cutting patterns
      const allPatternGroups: Record<string, PatternGroupType> = {};

      // Process all bars to find unique patterns and organize by part no, finish, and length
      for (const bar of bars) {
        const barCuts = cuts.filter(
          (cut) => cut.barId === bar.barId && cut.barNo === bar.barNo
        );

        // Skip if no cuts
        if (barCuts.length === 0) continue;

        // Get part number and finish from the first cut
        const partNo = String(barCuts[0].partNo || "Unknown");
        const finish = String(barCuts[0].finish || "Unknown");

        // Generate a unique key for this cutting pattern
        const patternKey = generatePatternKey(barCuts, kerf);

        if (!allPatternGroups[patternKey]) {
          allPatternGroups[patternKey] = {
            pattern: patternKey,
            barLength: bar.length,
            representativeBar: bar,
            barCuts: barCuts,
            barIds: [],
            wastePercentage: bar.wastePercentage,
            partNo: partNo,
            finish: finish,
          };
        }

        // Add this bar to the pattern group
        allPatternGroups[patternKey].barIds.push({
          barId: bar.barId,
          barNo: bar.barNo,
        });
      }

      // Convert to array and sort by part number, finish, and length (descending)
      const sortedAllPatterns = Object.values(allPatternGroups).sort((a, b) => {
        // First sort by part number - handle potential non-string values
        const partNoA = String(a.partNo || "");
        const partNoB = String(b.partNo || "");
        const partNoComparison = partNoA.localeCompare(partNoB);
        if (partNoComparison !== 0) return partNoComparison;

        // Then by finish - handle potential non-string values
        const finishA = String(a.finish || "");
        const finishB = String(b.finish || "");
        const finishComparison = finishA.localeCompare(finishB);
        if (finishComparison !== 0) return finishComparison;

        // Finally by length (descending)
        return b.barLength - a.barLength;
      });

      // Group patterns by partNo and finish for better organization
      const patternsByPartNoAndFinish: Record<string, PatternGroupType[]> = {};
      for (const pattern of sortedAllPatterns) {
        const key = `${pattern.partNo}|||${pattern.finish}`;
        if (!patternsByPartNoAndFinish[key]) {
          patternsByPartNoAndFinish[key] = [];
        }
        patternsByPartNoAndFinish[key].push(pattern);
      }

      // Process each part number and finish group
      for (const [groupKey, patternGroup] of Object.entries(
        patternsByPartNoAndFinish
      )) {
        // Extract partNo and finish from the group key
        const [partNo, finish] = groupKey.split("|||");

        // Find the longest bar in this part number + finish group
        // This ensures consistent scaling within each group
        const longestBarLength = patternGroup.reduce(
          (max, pattern) => Math.max(max, pattern.barLength),
          0
        );

        // Add cutting diagram pages for this part number + finish group
        let currentPage = null;
        let patternsOnCurrentPage = 0;
        let yPosition = 0;

        // Create a new page function
        const createNewPage = () => {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentPage.drawText(
            `${jobName} - ${String(partNo)} (${String(
              finish
            )}) Cutting Patterns`,
            {
              x: margin,
              y: pageHeight - margin,
              size: 18, // Increased from 16
              font: helveticaBold,
            }
          );

          currentPage.drawText(
            `Generated: ${new Date().toLocaleDateString()}`,
            {
              x: margin,
              y: pageHeight - margin - 20,
              size: 11, // Increased from 10
              font: helveticaFont,
            }
          );

          patternsOnCurrentPage = 0;
          yPosition = pageHeight - margin - headerHeight;
          return currentPage;
        };

        // Create initial page for this group
        currentPage = createNewPage();

        // Process each pattern in this part number + finish group
        for (const patternInfo of patternGroup) {
          const { representativeBar, barCuts, barIds, wastePercentage } =
            patternInfo;
          const barLength = representativeBar.length;

          // Calculate scale to make the longest bar fill the available width
          // This ensures all bars in this group are scaled proportionally
          const scale = contentWidth / longestBarLength;

          // Check if we need a new page
          if (yPosition - barHeight - barSpacing - 40 < margin) {
            // Extra space for bar count
            currentPage = createNewPage();
          }

          // Sort the cuts by position
          const sortedCuts = [...barCuts].sort(
            (a, b) => a.position - b.position
          );

          // Create a bar ID list for display
          const barIdList = barIds
            .map((b) => `${b.barId}-${b.barNo}`)
            .join(", ");
          const barIdListShort =
            barIdList.length > 60
              ? barIdList.substring(0, 57) + "..."
              : barIdList;

          // Draw pattern label with count - includes length information
          currentPage.drawText(
            `Pattern ${
              patternInfo.barIds.length > 0
                ? `(${patternInfo.barIds.length} Ea)`
                : ""
            }: ${decimalToFraction(
              barLength
            )}"  - Waste: ${wastePercentage.toFixed(1)}%`,
            {
              x: margin,
              y: yPosition,
              size: 12, // Increased from 10
              font: helveticaBold,
            }
          );

          // Add the bar IDs below (if there's more than one)
          if (patternInfo.barIds.length > 1) {
            currentPage.drawText(`Bar IDs: ${barIdListShort}`, {
              x: margin,
              y: yPosition - 15,
              size: 9, // Increased from 8
              font: helveticaFont,
            });
          }

          // Draw bar outline
          const barY =
            yPosition - barHeight - (patternInfo.barIds.length > 1 ? 20 : 0);
          currentPage.drawRectangle({
            x: margin,
            y: barY,
            width: barLength * scale,
            height: barHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5,
            color: rgb(0.95, 0.95, 0.95),
          });

          // Draw cuts
          let currentPosition = 0;

          for (let i = 0; i < sortedCuts.length; i++) {
            const cut = sortedCuts[i];

            // Generate a color based on the mark
            const markHash = cut.markNo
              .split("")
              .reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hue = (markHash * 137.5) % 360;

            // Convert HSL to RGB with lighter colors for better printing
            let r, g, b;
            const h = hue / 360;
            const s = 0.4; // Reduced saturation for lighter colors
            const l = 0.8; // Increased lightness for better printing

            // Since s is never 0, we can directly calculate RGB
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1 / 6) return p + (q - p) * 6 * t;
              if (t < 1 / 2) return q;
              if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
              return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);

            // Draw cut rectangle
            currentPage.drawRectangle({
              x: margin + currentPosition * scale,
              y: barY,
              width: cut.length * scale,
              height: barHeight,
              borderColor: rgb(0, 0, 0),
              borderWidth: 0.5,
              color: rgb(r, g, b),
            });

            // Add label to cut if it's wide enough
            // Increased minimum width check and font sizes for better readability
            if (cut.length * scale > 15) {
              // Reduced minimum width requirement
              // Calculate text size based on cut width - made larger for shop guys
              const textSize = Math.min(
                14, // Increased max size
                Math.max(9, cut.length * scale * 0.12) // Increased scaling factor and min size
              );

              // Center the text
              const textWidth = helveticaBold.widthOfTextAtSize(
                cut.markNo,
                textSize
              );
              const textX =
                margin +
                (currentPosition + cut.length / 2) * scale -
                textWidth / 2;
              const textY = barY + barHeight / 2;

              // Draw mark text
              currentPage.drawText(String(cut.markNo), {
                x: textX,
                y: textY + 5,
                size: textSize,
                font: helveticaBold,
                color: rgb(0, 0, 0),
              });

              // Draw length text - made slightly smaller but still readable
              const lengthText = decimalToFraction(cut.length);
              const lengthTextSize = Math.max(8, textSize - 2); // Ensure minimum readable size
              const lengthTextWidth = helveticaFont.widthOfTextAtSize(
                lengthText,
                lengthTextSize
              );

              currentPage.drawText(lengthText, {
                x:
                  margin +
                  (currentPosition + cut.length / 2) * scale -
                  lengthTextWidth / 2,
                y: textY - 5,
                size: lengthTextSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
              });
            }

            // Update position
            currentPosition += cut.length;

            // Draw kerf if not the last cut
            if (i < sortedCuts.length - 1) {
              currentPage.drawRectangle({
                x: margin + currentPosition * scale,
                y: barY,
                width: kerf * scale,
                height: barHeight,
                color: rgb(0.2, 0.2, 0.2),
              });

              currentPosition += kerf;
            }
          }

          // Draw measurement scale (feet marks)
          // Adjust foot markers to match the new scale
          const totalFeet = Math.ceil(barLength / 12);
          for (let foot = 0; foot <= totalFeet; foot++) {
            const footPosition = foot * 12;
            if (footPosition <= barLength) {
              // Draw foot mark
              currentPage.drawLine({
                start: { x: margin + footPosition * scale, y: barY - 5 },
                end: { x: margin + footPosition * scale, y: barY - 15 },
                thickness: 0.5,
                color: rgb(0, 0, 0),
              });

              // Draw foot label
              currentPage.drawText(`${foot}'`, {
                x: margin + footPosition * scale - 5,
                y: barY - 25,
                size: 9, // Increased from 8
                font: helveticaFont,
                color: rgb(0, 0, 0),
              });
            }
          }

          // Update position for next pattern
          const extraSpace = patternInfo.barIds.length > 1 ? 20 : 0;
          yPosition = barY - barSpacing - 25 - extraSpace; // Add extra space for the measurement scale
          patternsOnCurrentPage++;
        }
      }

      // Add page numbers to all pages
      const totalPages = pdfDoc.getPageCount();
      const pages = pdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageNumber = i + 1;
        const pageText = `Page ${pageNumber} of ${totalPages}`;

        // Calculate position for bottom right
        const textWidth = helveticaFont.widthOfTextAtSize(pageText, 10);
        const xPosition = pageWidth - margin - textWidth;
        const yPosition = margin - 20;

        page.drawText(pageText, {
          x: xPosition,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      // Generate PDF
      const pdfBytes = await pdfDoc.save();

      // Create download link
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${jobName
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_cutting_patterns.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  return (
    <Button onClick={exportPdf} variant={variant} size={size} {...props}>
      <Download className="h-4 w-4 mr-2" />
      {children}
    </Button>
  );
}
