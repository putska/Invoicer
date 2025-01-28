import { PDFDocument } from "pdf-lib";
import { format } from "date-fns";

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return format(date, "MM-dd-yyyy");
};

export const generatePDF = async (po: {
  poNumber: string;
  poDate: string;
  projectName: string;
  shortDescription: string;
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

    // Fill in the form fields with data
    form.getTextField("PO").setText(po.poNumber);
    form.getTextField("Date").setText(formatDate(po.poDate || ""));
    form.getTextField("JobName").setText(po.projectName);
    form.getTextField("Description1").setText(po.shortDescription);
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
