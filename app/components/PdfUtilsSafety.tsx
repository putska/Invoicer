// components/safetyPdfUtils.ts
import { PDFDocument } from "pdf-lib";
import { format } from "date-fns";

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return format(date, "MM/dd/yyyy");
  } catch (error) {
    console.warn("Invalid date format:", dateString);
    return dateString;
  }
};

// Helper to safely set text field values
const safeSetTextField = (form: any, fieldName: string, value: string) => {
  try {
    const field = form.getTextField(fieldName);
    if (field) {
      field.setText(value);
    }
  } catch (error) {
    console.warn(`Field ${fieldName} not found in PDF`);
  }
};

// Helper to safely set checkbox values
const safeSetCheckBox = (form: any, fieldName: string, checked: boolean) => {
  try {
    const field = form.getCheckBox(fieldName);
    if (field) {
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
    }
  } catch (error) {
    console.warn(`Checkbox ${fieldName} not found in PDF`);
  }
};

export const generatePDF = async (data: any) => {
  try {
    // First, determine which PDF template to use based on the form name
    let pdfPath;
    console.log(`Generating PDF for form: ${data.formName}`);
    switch (data.formName) {
      case "Job Hazard Analysis":
        pdfPath = "/JHA.pdf";
        break;
      case "Fall Protection Inspection Form":
        pdfPath = "/FallProtection.pdf";
        break;
      default:
        throw new Error(`Unknown form type: ${data.formName}`);
    }

    console.log(`Using PDF template: ${pdfPath}`);

    // Fetch the PDF template
    const pdfTemplate = await fetch(pdfPath);
    const pdfBytes = await pdfTemplate.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Get all field names from the PDF for debugging
    const fields = form.getFields();
    console.log(
      "Available PDF fields:",
      fields.map((f) => f.getName())
    );

    // Fill the form based on the form type
    if (data.formName === "Job Hazard Analysis") {
      // JHA specific fields
      safeSetTextField(form, "Text1", formatDate(data.dateCreated));
      safeSetTextField(form, "Text2", data.shiftTime || "");
      safeSetTextField(form, "Text3", data.jobName || "");
      safeSetTextField(form, "Text4", data.jobNumber || "");
      safeSetTextField(form, "Text5", data.formData.weather || "");
      safeSetTextField(form, "Text6", data.formData.competentPersonName || "");
      safeSetTextField(form, "Text7", data.formData.phoneNumber || "");
      safeSetTextField(form, "Text8", data.formData.workDescription || "");

      // PPE Requirements
      if (data.formData.ppeRequirements) {
        safeSetCheckBox(
          form,
          "Check Box1",
          !!data.formData.ppeRequirements.hardHat
        );
        safeSetCheckBox(
          form,
          "Check Box2",
          !!data.formData.ppeRequirements.safetyShoes
        );
        safeSetCheckBox(
          form,
          "Check Box3",
          !!data.formData.ppeRequirements.safetyGlasses
        );
        safeSetCheckBox(
          form,
          "Check Box4",
          !!data.formData.ppeRequirements.protectiveGloves
        );
        safeSetCheckBox(
          form,
          "Check Box5",
          !!data.formData.ppeRequirements.dustMask
        );
        safeSetCheckBox(
          form,
          "Check Box6",
          !!data.formData.ppeRequirements.hearingProtection
        );
        safeSetCheckBox(
          form,
          "Check Box7",
          !!data.formData.ppeRequirements.fallProtection
        );
        safeSetCheckBox(
          form,
          "Check Box8",
          !!data.formData.ppeRequirements.faceShield
        );

        safeSetTextField(
          form,
          "Text71",
          data.formData.ppeRequirements.other1 || ""
        );
        safeSetTextField(
          form,
          "Text72",
          data.formData.ppeRequirements.other2 || ""
        );
        safeSetTextField(
          form,
          "Text73",
          data.formData.ppeRequirements.other3 || ""
        );
        safeSetTextField(
          form,
          "Text74",
          data.formData.ppeRequirements.other4 || ""
        );
      }

      // Notes
      safeSetTextField(form, "Text75", data.formData.notes || "");

      // Tasks (handle dynamically)
      if (data.formData.tasks && Array.isArray(data.formData.tasks)) {
        data.formData.tasks.forEach(
          (
            task: { task: string; hazard: string; control: string },
            index: number
          ) => {
            if (index < 20) {
              // Assuming max 20 task fields
              safeSetTextField(form, `Task${index + 1}`, task.task || "");
              safeSetTextField(form, `Hazard${index + 1}`, task.hazard || "");
              safeSetTextField(form, `Control${index + 1}`, task.control || "");
            }
          }
        );
      }

      // Supervisor
      safeSetTextField(
        form,
        "SupervisorName",
        data.formData.supervisorName || ""
      );
      safeSetTextField(
        form,
        "SupervisorSignature",
        data.formData.supervisorSignature || ""
      );
    } else if (data.formName === "Fall Protection Inspection Form") {
      // Fall Protection specific fields
      safeSetTextField(form, "Text1", data.formData.manufacturer || "");
      safeSetTextField(
        form,
        "Text2",
        formatDate(data.formData.dateOfManufacture)
      );
      safeSetTextField(form, "Text3", data.formData.serialNumber || "");
      safeSetTextField(form, "Text4", data.formData.modelNumber || "");
      safeSetTextField(form, "Text5", formatDate(data.formData.inspectionDate));
      safeSetTextField(
        form,
        "Text6",
        formatDate(data.formData.removeFromServiceDate)
      );
      safeSetTextField(form, "Text7", data.formData.authorizedPerson || "");
      safeSetTextField(form, "Text8", data.formData.competentPerson || "");

      // Labels & Markings
      if (data.formData.labelsAndMarkings) {
        // Label
        safeSetCheckBox(
          form,
          "Check Box2",
          !!data.formData.labelsAndMarkings.label?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box3",
          !!data.formData.labelsAndMarkings.label?.fail
        );
        safeSetTextField(
          form,
          "Text9",
          data.formData.labelsAndMarkings.label?.note || ""
        );

        // Markings
        safeSetCheckBox(
          form,
          "Check Box4",
          !!data.formData.labelsAndMarkings.markings?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box5",
          !!data.formData.labelsAndMarkings.markings?.fail
        );
        safeSetTextField(
          form,
          "Text10",
          data.formData.labelsAndMarkings.markings?.note || ""
        );

        // Date of First Use
        safeSetCheckBox(
          form,
          "Check Box6",
          !!data.formData.labelsAndMarkings.dateOfFirstUse?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box7",
          !!data.formData.labelsAndMarkings.dateOfFirstUse?.fail
        );
        safeSetTextField(
          form,
          "Text11",
          data.formData.labelsAndMarkings.dateOfFirstUse?.note || ""
        );

        // Impact Indicator
        safeSetCheckBox(
          form,
          "Check Box8",
          !!data.formData.labelsAndMarkings.impactIndicator?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box9",
          !!data.formData.labelsAndMarkings.impactIndicator?.fail
        );
        safeSetTextField(
          form,
          "Text12",
          data.formData.labelsAndMarkings.impactIndicator?.note || ""
        );
      }

      // Hardware
      if (data.formData.hardware) {
        // Shoulder Buckles
        safeSetCheckBox(
          form,
          "ShoulderBucklesPass",
          !!data.formData.hardware.shoulderBuckles?.pass
        );
        safeSetCheckBox(
          form,
          "ShoulderBucklesFail",
          !!data.formData.hardware.shoulderBuckles?.fail
        );
        safeSetTextField(
          form,
          "ShoulderBucklesNote",
          data.formData.hardware.shoulderBuckles?.note || ""
        );

        // Leg & Waist Buckles
        safeSetCheckBox(
          form,
          "LegWaistBucklesPass",
          !!data.formData.hardware.legWaistBuckles?.pass
        );
        safeSetCheckBox(
          form,
          "LegWaistBucklesFail",
          !!data.formData.hardware.legWaistBuckles?.fail
        );
        safeSetTextField(
          form,
          "LegWaistBucklesNote",
          data.formData.hardware.legWaistBuckles?.note || ""
        );

        // D-Rings
        safeSetCheckBox(
          form,
          "DRingsPass",
          !!data.formData.hardware.dRings?.pass
        );
        safeSetCheckBox(
          form,
          "DRingsFail",
          !!data.formData.hardware.dRings?.fail
        );
        safeSetTextField(
          form,
          "DRingsNote",
          data.formData.hardware.dRings?.note || ""
        );

        // Corrosion
        safeSetCheckBox(
          form,
          "CorrosionPass",
          !!data.formData.hardware.corrosion?.pass
        );
        safeSetCheckBox(
          form,
          "CorrosionFail",
          !!data.formData.hardware.corrosion?.fail
        );
        safeSetTextField(
          form,
          "CorrosionNote",
          data.formData.hardware.corrosion?.note || ""
        );
      }

      // Webbing
      if (data.formData.webbing) {
        // Shoulder Strap
        safeSetCheckBox(
          form,
          "ShoulderStrapPass",
          !!data.formData.webbing.shoulderStrap?.pass
        );
        safeSetCheckBox(
          form,
          "ShoulderStrapFail",
          !!data.formData.webbing.shoulderStrap?.fail
        );
        safeSetTextField(
          form,
          "ShoulderStrapNote",
          data.formData.webbing.shoulderStrap?.note || ""
        );

        // Cuts/Burns
        safeSetCheckBox(
          form,
          "CutsBurnsPass",
          !!data.formData.webbing.cutsBurns?.pass
        );
        safeSetCheckBox(
          form,
          "CutsBurnsFail",
          !!data.formData.webbing.cutsBurns?.fail
        );
        safeSetTextField(
          form,
          "CutsBurnsNote",
          data.formData.webbing.cutsBurns?.note || ""
        );

        // Paint Contamination
        safeSetCheckBox(
          form,
          "PaintContaminationPass",
          !!data.formData.webbing.paintContamination?.pass
        );
        safeSetCheckBox(
          form,
          "PaintContaminationFail",
          !!data.formData.webbing.paintContamination?.fail
        );
        safeSetTextField(
          form,
          "PaintContaminationNote",
          data.formData.webbing.paintContamination?.note || ""
        );

        // Excessive Wear
        safeSetCheckBox(
          form,
          "ExcessiveWearPass",
          !!data.formData.webbing.excessiveWear?.pass
        );
        safeSetCheckBox(
          form,
          "ExcessiveWearFail",
          !!data.formData.webbing.excessiveWear?.fail
        );
        safeSetTextField(
          form,
          "ExcessiveWearNote",
          data.formData.webbing.excessiveWear?.note || ""
        );

        // Heat Damage
        safeSetCheckBox(
          form,
          "HeatDamagePass",
          !!data.formData.webbing.heatDamage?.pass
        );
        safeSetCheckBox(
          form,
          "HeatDamageFail",
          !!data.formData.webbing.heatDamage?.fail
        );
        safeSetTextField(
          form,
          "HeatDamageNote",
          data.formData.webbing.heatDamage?.note || ""
        );
      }

      // Stitching
      if (data.formData.stitching) {
        // Shoulders/Chest
        safeSetCheckBox(
          form,
          "ShouldersChestPass",
          !!data.formData.stitching.shouldersChest?.pass
        );
        safeSetCheckBox(
          form,
          "ShouldersChestFail",
          !!data.formData.stitching.shouldersChest?.fail
        );
        safeSetTextField(
          form,
          "ShouldersChestNote",
          data.formData.stitching.shouldersChest?.note || ""
        );

        // Legs/Back Straps
        safeSetCheckBox(
          form,
          "LegsBackStrapsPass",
          !!data.formData.stitching.legsBackStraps?.pass
        );
        safeSetCheckBox(
          form,
          "LegsBackStrapsFail",
          !!data.formData.stitching.legsBackStraps?.fail
        );
        safeSetTextField(
          form,
          "LegsBackStrapsNote",
          data.formData.stitching.legsBackStraps?.note || ""
        );
      }

      // Additional Notes
      safeSetTextField(
        form,
        "AdditionalNotes",
        data.formData.additionalNotes || ""
      );
    }

    // Generate the PDF
    const pdfData = await pdfDoc.save();

    // Create a Blob URL and open it in a new tab
    const blob = new Blob([pdfData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    return url;
  } catch (error) {
    console.error("Error generating PDF:", error);

    // Add more detailed error logging
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }

    return null;
  }
};

// Utility function to list all fields in a PDF (useful for debugging)
export const listPDFFields = async (pdfPath: string): Promise<string[]> => {
  try {
    const pdfTemplate = await fetch(pdfPath);
    const pdfBytes = await pdfTemplate.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    const fields = form.getFields();
    const fieldDetails = fields.map((field) => ({
      name: field.getName(),
      type: field.constructor.name,
    }));

    console.log("PDF Fields:", fieldDetails);

    return fields.map((field) => field.getName());
  } catch (error) {
    console.error("Error listing PDF fields:", error);
    return [];
  }
};
