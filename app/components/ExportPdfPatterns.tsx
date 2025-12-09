// components/ExportPdfPatterns.tsx
import React from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Placement, CutSheet } from "../types";

interface ExportPdfPatternsProps {
  sheets: CutSheet[];
  placements: Placement[];
  jobName?: string;
  allowRotation?: boolean;
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

export default function ExportPdfPatterns({
  sheets,
  placements,
  jobName = "Panel Optimization",
  allowRotation = true,
  children = "Print",
  variant = "outline",
  size = "sm",
  ...props
}: ExportPdfPatternsProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const exportPdf = async () => {
    if (sheets.length === 0) return;

    /**
     * Converts decimal inches to a fractional representation
     * Example: 4.25 becomes "4-1/4"
     */
    function decimalToFraction(decimal: number): string {
      // Handle whole numbers
      if (Math.round(decimal) === decimal) {
        return decimal.toString();
      }

      // Split into whole and decimal parts
      const wholePart = Math.floor(decimal);
      let decimalPart = decimal - wholePart;

      // Round to nearest 1/16th (or your desired precision)
      const precision = 16;
      let numerator = Math.round(decimalPart * precision);
      let denominator = precision;

      // Simplify the fraction
      const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
      const divisor = gcd(numerator, denominator);

      numerator = numerator / divisor;
      denominator = denominator / divisor;

      // Format the result
      if (numerator === 0) {
        return wholePart.toString();
      } else if (wholePart === 0) {
        return `${numerator}/${denominator}`;
      } else {
        return `${wholePart}-${numerator}/${denominator}`;
      }
    }

    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Add a custom font
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Page size (letter size in points: 8.5 x 11 inches)
      const pageWidth = 8.5 * 72;
      const pageHeight = 11 * 72;

      // Margins
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;

      // Header height and spacing between patterns
      const headerHeight = 80;
      const patternSpacing = 15;

      // Calculate available space for patterns
      const availableHeight = contentHeight - headerHeight;

      // Number of patterns per page (3 in portrait mode)
      const patternsPerPage = 3;
      const patternHeight =
        (availableHeight - patternSpacing * (patternsPerPage - 1)) /
        patternsPerPage;

      // Group placements by sheet
      const placementsBySheet = sheets.map((sheet) => {
        return {
          sheet,
          placements: placements.filter(
            (p) => p.sheetId === sheet.sheetId && p.sheetNo === sheet.sheetNo
          ),
        };
      });

      // ========== CONSOLIDATED LAYOUTS ==========
      // Create a hash of each layout to identify identical ones
      const layoutHashMap = new Map();
      const uniqueLayouts: string[] = [];

      placementsBySheet.forEach((sheetData) => {
        // Create a hash based on sheet dimensions and placement data
        const { sheet, placements } = sheetData;

        // Sort placements to ensure consistent hashing regardless of order
        const sortedPlacements = [...placements].sort(
          (a, b) =>
            a.x - b.x || a.y - b.y || a.width - b.width || a.height - b.height
        );

        // Create a hash string that uniquely identifies this layout
        const layoutHash = JSON.stringify({
          width: sheet.width,
          height: sheet.height,
          placements: sortedPlacements.map((p) => ({
            x: p.x,
            y: p.y,
            width: p.width,
            height: p.height,
            mark: p.mark,
          })),
        });

        // Check if we've seen this layout before
        if (!layoutHashMap.has(layoutHash)) {
          // First time seeing this layout - add to unique layouts
          layoutHashMap.set(layoutHash, {
            sheet,
            placements: sortedPlacements,
            count: 1,
            sheetNumbers: [sheet.sheetNo],
          });
          uniqueLayouts.push(layoutHash);
        } else {
          // We've seen this layout before - increment count
          const existingLayout = layoutHashMap.get(layoutHash);
          existingLayout.count++;
          existingLayout.sheetNumbers.push(sheet.sheetNo);
        }
      });

      // Convert our unique layouts back to an array for drawing
      const consolidatedLayouts = uniqueLayouts.map((hash) =>
        layoutHashMap.get(hash)
      );

      // ========== CREATE SUMMARY PAGE FIRST ==========
      // Add summary page
      let summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);

      // Summary page header
      summaryPage.drawText(`${jobName} - Cutting Summary`, {
        x: margin,
        y: pageHeight - margin,
        size: 16,
        font: helveticaBold,
      });

      summaryPage.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
        x: margin,
        y: pageHeight - margin - 20,
        size: 10,
        font: helveticaFont,
      });

      // Add rotation information
      const rotationInfo = allowRotation
        ? "Panels can be rotated (non-directional)"
        : "Panels cannot be rotated (directional)";

      summaryPage.drawText(rotationInfo, {
        x: margin,
        y: pageHeight - margin - 40,
        size: 10,
        font: helveticaFont,
      });

      // Group sheets by size
      const sheetsBySize = sheets.reduce((groups, sheet) => {
        const key = `${sheet.width} x ${sheet.height}`;
        if (!groups[key]) {
          groups[key] = {
            width: sheet.width,
            height: sheet.height,
            count: 0,
            totalArea: 0,
            usedArea: 0,
          };
        }

        groups[key].count++;
        groups[key].totalArea += sheet.width * sheet.height;
        groups[key].usedArea += sheet.usedArea;

        return groups;
      }, {} as Record<string, { width: number; height: number; count: number; totalArea: number; usedArea: number }>);

      // Draw sheet summary table
      summaryPage.drawText("Sheet Summary:", {
        x: margin,
        y: pageHeight - margin - 60,
        size: 14,
        font: helveticaBold,
      });

      // Table headers
      const columns = [
        margin,
        margin + 120,
        margin + 200,
        margin + 300,
        margin + 400,
      ];

      summaryPage.drawText("Sheet Size", {
        x: columns[0],
        y: pageHeight - margin - 90,
        size: 11,
        font: helveticaBold,
      });

      summaryPage.drawText("Quantity", {
        x: columns[1],
        y: pageHeight - margin - 90,
        size: 11,
        font: helveticaBold,
      });

      summaryPage.drawText("Total Area (sq.ft)", {
        x: columns[2],
        y: pageHeight - margin - 90,
        size: 11,
        font: helveticaBold,
      });

      summaryPage.drawText("Used Area (sq.ft)", {
        x: columns[3],
        y: pageHeight - margin - 90,
        size: 11,
        font: helveticaBold,
      });

      summaryPage.drawText("Yield %", {
        x: columns[4],
        y: pageHeight - margin - 90,
        size: 11,
        font: helveticaBold,
      });

      // Draw horizontal line
      summaryPage.drawLine({
        start: { x: margin, y: pageHeight - margin - 95 },
        end: { x: pageWidth - margin, y: pageHeight - margin - 95 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Table rows
      let rowY = pageHeight - margin - 115;
      let totalSheets = 0;
      let totalAreaSqFt = 0;
      let totalUsedAreaSqFt = 0;

      Object.entries(sheetsBySize).forEach(([size, data]) => {
        summaryPage.drawText(`${data.width}" × ${data.height}"`, {
          x: columns[0],
          y: rowY,
          size: 10,
          font: helveticaFont,
        });

        summaryPage.drawText(`${data.count}`, {
          x: columns[1],
          y: rowY,
          size: 10,
          font: helveticaFont,
        });

        const areaSqFt = data.totalArea / 144;
        const usedAreaSqFt = data.usedArea / 144;

        summaryPage.drawText(`${areaSqFt.toFixed(2)}`, {
          x: columns[2],
          y: rowY,
          size: 10,
          font: helveticaFont,
        });

        summaryPage.drawText(`${usedAreaSqFt.toFixed(2)}`, {
          x: columns[3],
          y: rowY,
          size: 10,
          font: helveticaFont,
        });

        const pnlYield = (data.usedArea / data.totalArea) * 100;
        summaryPage.drawText(`${pnlYield.toFixed(1)}%`, {
          x: columns[4],
          y: rowY,
          size: 10,
          font: helveticaFont,
        });

        totalSheets += data.count;
        totalAreaSqFt += areaSqFt;
        totalUsedAreaSqFt += usedAreaSqFt;

        rowY -= 20;
      });

      // Draw horizontal line
      summaryPage.drawLine({
        start: { x: margin, y: rowY + 10 },
        end: { x: pageWidth - margin, y: rowY + 10 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Totals row
      summaryPage.drawText("TOTALS:", {
        x: columns[0],
        y: rowY - 10,
        size: 10,
        font: helveticaBold,
      });

      summaryPage.drawText(`${totalSheets}`, {
        x: columns[1],
        y: rowY - 10,
        size: 10,
        font: helveticaBold,
      });

      summaryPage.drawText(`${totalAreaSqFt.toFixed(2)}`, {
        x: columns[2],
        y: rowY - 10,
        size: 10,
        font: helveticaBold,
      });

      summaryPage.drawText(`${totalUsedAreaSqFt.toFixed(2)}`, {
        x: columns[3],
        y: rowY - 10,
        size: 10,
        font: helveticaBold,
      });

      const overallYield = (totalUsedAreaSqFt / totalAreaSqFt) * 100;
      summaryPage.drawText(`${overallYield.toFixed(1)}%`, {
        x: columns[4],
        y: rowY - 10,
        size: 10,
        font: helveticaBold,
      });

      // Draw panel count summary
      rowY -= 50;

      summaryPage.drawText("Panel Summary:", {
        x: margin,
        y: rowY,
        size: 14,
        font: helveticaBold,
      });

      // Group panels by mark
      const panelsByMark = placements.reduce((groups, placement) => {
        if (!groups[placement.mark]) {
          groups[placement.mark] = {
            width: placement.width,
            height: placement.height,
            count: 0,
            totalArea: 0,
            rotated: 0,
          };
        }

        groups[placement.mark].count++;
        groups[placement.mark].totalArea += placement.width * placement.height;
        if (placement.rotated) {
          groups[placement.mark].rotated++;
        }

        return groups;
      }, {} as Record<string, { width: number; height: number; count: number; totalArea: number; rotated: number }>);

      // Table headers for panels
      rowY -= 30;

      // Table headers for panels - make columns wider for dimensions
      const pnlColumns = [
        margin,
        margin + 125,
        margin + 240,
        margin + 310,
        margin + 380,
      ];

      summaryPage.drawText("Panel Mark", {
        x: pnlColumns[0],
        y: rowY,
        size: 11,
        font: helveticaBold,
      });

      summaryPage.drawText("Dimensions", {
        x: pnlColumns[1],
        y: rowY,
        size: 11,
        font: helveticaBold,
      });

      summaryPage.drawText("Quantity", {
        x: pnlColumns[2],
        y: rowY,
        size: 11,
        font: helveticaBold,
      });

      if (allowRotation) {
        summaryPage.drawText("Rotated", {
          x: pnlColumns[3],
          y: rowY,
          size: 11,
          font: helveticaBold,
        });
      }

      summaryPage.drawText("Area (sq.ft)", {
        x: pnlColumns[4],
        y: rowY,
        size: 11,
        font: helveticaBold,
      });

      // Draw horizontal line
      summaryPage.drawLine({
        start: { x: margin, y: rowY - 5 },
        end: { x: pageWidth - margin, y: rowY - 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Table rows for panels
      rowY -= 20;
      let totalPanels = 0;
      let totalPanelAreaSqFt = 0;
      let totalRotated = 0;

      Object.entries(panelsByMark).forEach(([mark, data]) => {
        if (rowY < margin + 40) {
          // Add new page if we're running out of space
          summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);
          summaryPage.drawText(`${jobName} - Panel Summary (continued)`, {
            x: margin,
            y: pageHeight - margin,
            size: 16,
            font: helveticaBold,
          });

          // Reset row position for new page
          rowY = pageHeight - margin - 60;

          // Redraw table headers
          summaryPage.drawText("Panel Mark", {
            x: pnlColumns[0],
            y: rowY,
            size: 11,
            font: helveticaBold,
          });

          summaryPage.drawText("Dimensions", {
            x: pnlColumns[1],
            y: rowY,
            size: 11,
            font: helveticaBold,
          });

          summaryPage.drawText("Quantity", {
            x: pnlColumns[2],
            y: rowY,
            size: 11,
            font: helveticaBold,
          });

          if (allowRotation) {
            summaryPage.drawText("Rotated", {
              x: pnlColumns[3],
              y: rowY,
              size: 11,
              font: helveticaBold,
            });
          }

          summaryPage.drawText("Area (sq.ft)", {
            x: pnlColumns[4],
            y: rowY,
            size: 11,
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

        summaryPage.drawText(mark, {
          x: pnlColumns[0],
          y: rowY,
          size: 10,
          font: helveticaFont,
        });
        // Convert dimensions to fractional format
        const widthFraction = decimalToFraction(data.width);
        const heightFraction = decimalToFraction(data.height);
        summaryPage.drawText(`${widthFraction}" × ${heightFraction}"`, {
          x: pnlColumns[1],
          y: rowY,
          size: 10,
          font: helveticaFont,
        });

        summaryPage.drawText(`${data.count}`, {
          x: pnlColumns[2],
          y: rowY,
          size: 10,
          font: helveticaFont,
        });

        if (allowRotation) {
          summaryPage.drawText(`${data.rotated}`, {
            x: pnlColumns[3],
            y: rowY,
            size: 10,
            font: helveticaFont,
          });

          totalRotated += data.rotated;
        }

        const areaSqFt = data.totalArea / 144;
        summaryPage.drawText(`${areaSqFt.toFixed(2)}`, {
          x: pnlColumns[4],
          y: rowY,
          size: 10,
          font: helveticaFont,
        });

        totalPanels += data.count;
        totalPanelAreaSqFt += areaSqFt;

        rowY -= 20;
      });

      // Draw horizontal line for panel totals
      summaryPage.drawLine({
        start: { x: margin, y: rowY + 10 },
        end: { x: pageWidth - margin, y: rowY + 10 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Totals row for panels
      summaryPage.drawText("TOTALS:", {
        x: pnlColumns[0],
        y: rowY - 10,
        size: 10,
        font: helveticaBold,
      });

      summaryPage.drawText(`${totalPanels}`, {
        x: pnlColumns[2],
        y: rowY - 10,
        size: 10,
        font: helveticaBold,
      });

      if (allowRotation) {
        summaryPage.drawText(`${totalRotated}`, {
          x: pnlColumns[3],
          y: rowY - 10,
          size: 10,
          font: helveticaBold,
        });
      }

      summaryPage.drawText(`${totalPanelAreaSqFt.toFixed(2)}`, {
        x: pnlColumns[4],
        y: rowY - 10,
        size: 10,
        font: helveticaBold,
      });

      // ========== LAYOUT PAGES ==========
      // Calculate total pages needed based on consolidated layouts
      const totalPages = Math.ceil(
        consolidatedLayouts.length / patternsPerPage
      );

      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        // Add a new page
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Draw page header
        page.drawText(jobName, {
          x: margin,
          y: pageHeight - margin,
          size: 16,
          font: helveticaBold,
        });

        page.drawText(
          `Cutting Patterns - Page ${pageNum + 1} of ${totalPages}`,
          {
            x: margin,
            y: pageHeight - margin - 20,
            size: 12,
            font: helveticaFont,
          }
        );

        // Draw current date
        const currentDate = new Date().toLocaleDateString();
        page.drawText(`Generated: ${currentDate}`, {
          x: pageWidth - margin - 150,
          y: pageHeight - margin - 20,
          size: 10,
          font: helveticaFont,
        });

        // Calculate patterns for this page
        const startIdx = pageNum * patternsPerPage;
        const endIdx = Math.min(
          startIdx + patternsPerPage,
          consolidatedLayouts.length
        );
        const patternsOnPage = consolidatedLayouts.slice(startIdx, endIdx);

        // Draw each pattern
        for (let i = 0; i < patternsOnPage.length; i++) {
          const { sheet, placements, count, sheetNumbers } = patternsOnPage[i];

          // Calculate pattern position
          const patternY =
            pageHeight -
            margin -
            headerHeight -
            i * (patternHeight + patternSpacing);

          // Draw sheet info with quantity and sheet numbers
          // Format the sheet numbers to show ranges where possible
          const formatSheetNumbers = (nums: number[]): string => {
            if (nums.length <= 4) return nums.join(", ");

            const ranges: string[] = [];
            let rangeStart = nums[0];
            let rangeEnd = nums[0];

            for (let i = 1; i < nums.length; i++) {
              if (nums[i] === rangeEnd + 1) {
                rangeEnd = nums[i];
              } else {
                ranges.push(
                  rangeStart === rangeEnd
                    ? `${rangeStart}`
                    : `${rangeStart}-${rangeEnd}`
                );
                rangeStart = rangeEnd = nums[i];
              }
            }

            ranges.push(
              rangeStart === rangeEnd
                ? `${rangeStart}`
                : `${rangeStart}-${rangeEnd}`
            );

            return ranges.join(", ");
          };

          const sheetNumbersText =
            sheetNumbers.length > 10
              ? `${sheetNumbers.length} sheets (# ${formatSheetNumbers([
                  sheetNumbers[0],
                  sheetNumbers[sheetNumbers.length - 1],
                ])})`
              : `${sheetNumbers.length} sheets (# ${formatSheetNumbers(
                  sheetNumbers
                )})`;

          page.drawText(
            `${sheetNumbersText} - Size: ${sheet.width}" × ${
              sheet.height
            }" - Yield: ${(100 - sheet.wastePercentage).toFixed(1)}%`,
            {
              x: margin,
              y: patternY,
              size: 11,
              font: helveticaBold,
            }
          );

          // Calculate scale to fit the pattern within the available width/height
          const patternWidth = contentWidth * 0.98; // 98% of content width
          const patternBoxHeight = patternHeight - 20; // Leave space for the title

          const scaleX = patternWidth / sheet.width;
          const scaleY = patternBoxHeight / sheet.height;
          const scale = Math.min(scaleX, scaleY);

          // Calculate centered position
          const scaledWidth = sheet.width * scale;
          const scaledHeight = sheet.height * scale;
          const centerX = margin + (contentWidth - scaledWidth) / 2;
          const patternTopY = patternY - 15; // Below title

          // Draw sheet outline
          page.drawRectangle({
            x: centerX,
            y: patternTopY - scaledHeight,
            width: scaledWidth,
            height: scaledHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
            color: rgb(0.95, 0.95, 0.95),
          });

          // Draw each panel on the sheet
          for (const placement of placements) {
            // Generate a deterministic color for each panel based on its mark
            const markHash = placement.mark
              .split("")
              .reduce(
                (acc: number, char: string) => acc + char.charCodeAt(0),
                0
              );
            const hue = (markHash * 137.5) % 360;
            const saturation = 0.7;
            const lightness = 0.6;

            // Convert HSL to RGB (simple conversion for pdf-lib)
            let r, g, b;
            const h = hue / 360;
            const s = saturation as number; // Explicitly cast to number
            const l = lightness;

            if (s === 0) {
              r = g = b = l;
            } else {
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
            }

            // Draw panel rectangle
            page.drawRectangle({
              x: centerX + placement.x * scale,
              y: patternTopY - placement.y * scale - placement.height * scale,
              width: placement.width * scale,
              height: placement.height * scale,
              borderColor: rgb(0, 0, 0),
              borderWidth: 0.5,
              color: rgb(r, g, b),
            });

            // Calculate text size based on panel size, with min/max limits
            const minTextSize = 6;
            const maxTextSize = 12;
            const calculatedSize =
              Math.min(placement.width, placement.height) * scale * 0.2;
            const textSize = Math.max(
              minTextSize,
              Math.min(maxTextSize, calculatedSize)
            );

            // Add panel mark text
            const textX =
              centerX + placement.x * scale + (placement.width * scale) / 2;
            const textY =
              patternTopY -
              placement.y * scale -
              (placement.height * scale) / 2;

            // Ensure enough contrast for text color
            const textColor =
              (r + g + b) / 3 > 0.65 ? rgb(0, 0, 0) : rgb(1, 1, 1);

            // Center the text
            const textWidth = helveticaBold.widthOfTextAtSize(
              placement.mark,
              textSize
            );
            page.drawText(placement.mark, {
              x: textX - textWidth / 2,
              y: textY - textSize / 3, // Approximate vertical centering
              size: textSize,
              font: helveticaBold,
              color: textColor,
            });

            // Add dimensions to larger panels
            if (placement.width * scale > 50 && placement.height * scale > 30) {
              const widthFraction = decimalToFraction(placement.width);
              const heightFraction = decimalToFraction(placement.height);
              const dimText = `${widthFraction}" × ${heightFraction}"`;
              const dimTextSize = Math.max(minTextSize, textSize * 0.7);
              const dimTextWidth = helveticaFont.widthOfTextAtSize(
                dimText,
                dimTextSize
              );

              page.drawText(dimText, {
                x: textX - dimTextWidth / 2,
                y: textY - textSize / 2 - dimTextSize,
                size: dimTextSize,
                font: helveticaFont,
                color: textColor,
              });

              // If rotated, show a rotation indicator
              if (placement.rotated && allowRotation) {
                const rotationText = "R";
                const rotationTextWidth = helveticaFont.widthOfTextAtSize(
                  rotationText,
                  dimTextSize
                );

                page.drawText(rotationText, {
                  x: textX - rotationTextWidth / 2,
                  y: textY + textSize,
                  size: dimTextSize,
                  font: helveticaBold,
                  color: textColor,
                });
              }
            }
          }
        }
      }

      // Generate PDF
      const pdfBytes = await pdfDoc.save();

      // Create download link
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
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
