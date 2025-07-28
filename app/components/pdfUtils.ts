import { PDFDocument } from "pdf-lib";
import { format } from "date-fns";

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return format(date, "MM-dd-yyyy");
};

// Helper function to get initials from full name
function getInitials(fullName: string): string {
  if (!fullName) return "";

  const initials = fullName
    .trim()
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  return `-${initials}`;
}

// Helper function to split text into chunks that fit description fields
function splitDescriptionText(
  shortDescription: string,
  longDescription: string = "",
  maxCharsPerLine: number = 60
): string[] {
  const descriptions: string[] = [];

  // Line 1: Always use short description
  descriptions.push(shortDescription || "");

  // Lines 2+: Process long description if it exists
  if (longDescription && longDescription.trim()) {
    // First, split by user's line breaks (\n or \r\n)
    const userLines = longDescription.trim().split(/\r?\n/);

    for (const userLine of userLines) {
      if (!userLine.trim()) {
        // User created an empty line - preserve it
        descriptions.push("");
        continue;
      }

      // Check if the user's line fits in one PDF field
      if (userLine.length <= maxCharsPerLine) {
        descriptions.push(userLine);
      } else {
        // User's line is too long - split it by words
        const words = userLine.trim().split(/\s+/);
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;

          if (testLine.length <= maxCharsPerLine) {
            currentLine = testLine;
          } else {
            // Push current line and start a new one
            if (currentLine) {
              descriptions.push(currentLine);
            }

            // Handle very long words that exceed maxCharsPerLine
            if (word.length > maxCharsPerLine) {
              // Split the word itself
              for (let i = 0; i < word.length; i += maxCharsPerLine) {
                descriptions.push(word.substring(i, i + maxCharsPerLine));
              }
              currentLine = "";
            } else {
              currentLine = word;
            }
          }
        }

        // Don't forget the last line from this user line
        if (currentLine) {
          descriptions.push(currentLine);
        }
      }
    }
  }

  return descriptions;
}

// Alternative approach: Split by character count (simpler but may break words)
function splitDescriptionByChars(
  shortDescription: string,
  longDescription: string = "",
  maxCharsPerLine: number = 60
): string[] {
  const descriptions: string[] = [];

  // Start with short description
  if (shortDescription) {
    descriptions.push(shortDescription);
  }

  // Split long description by character count
  if (longDescription && longDescription.trim()) {
    const text = longDescription.trim();
    for (let i = 0; i < text.length; i += maxCharsPerLine) {
      descriptions.push(text.substring(i, i + maxCharsPerLine));
    }
  }

  return descriptions;
}

export const generatePDF = async (po: {
  poNumber: string;
  poDate: string;
  projectName: string;
  shortDescription: string;
  longDescription?: string; // Add this field
  amount: string;
  projectManager: string;
  vendorName: string;
  dueDate?: string;
  received?: string;
  shipTo?: string;
}) => {
  try {
    // Fetch the PDF template
    const pdfTemplate = await fetch("/POTemplate.pdf");
    const pdfBytes = await pdfTemplate.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const initials = getInitials(po.projectManager);

    // Split descriptions across multiple lines
    const descriptions = splitDescriptionText(
      po.shortDescription,
      po.longDescription || "",
      60 // Adjust this number based on your PDF field width
    );

    // Fill in the form fields with data
    form.getTextField("PO").setText(po.poNumber);
    form.getTextField("POInitials").setText(initials);
    form.getTextField("Date").setText(formatDate(po.poDate || ""));
    form.getTextField("JobName").setText(po.projectName);

    // Fill description fields (Description1 through Description18)
    for (let i = 0; i < Math.min(descriptions.length, 18); i++) {
      const fieldName = `Description${i + 1}`;
      try {
        form.getTextField(fieldName).setText(descriptions[i]);
      } catch (error) {
        console.warn(`Field ${fieldName} not found in PDF template`);
      }
    }

    // Warn if description is too long for available fields
    if (descriptions.length > 18) {
      console.warn(
        `Description too long! ${descriptions.length} lines needed but only 18 available.`
      );
    }

    form.getTextField("Vendor1").setText(po.vendorName);
    form.getTextField("ShipTo1").setText(po.shipTo || "");
    form.getTextField("DateRequired").setText(formatDate(po.dueDate || ""));
    form.getTextField("QuotedAmount").setText(po.amount || "");
    form.getTextField("PM").setText(po.projectManager);

    // Flatten or keep editable based on your requirements
    // form.flatten();

    const pdfData = await pdfDoc.save();

    // Create a Blob URL and open it in a new tab
    const blob = new Blob([pdfData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};
