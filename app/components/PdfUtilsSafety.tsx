// components/safetyPdfUtils.ts
import { PDFDocument, rgb } from "pdf-lib";
import { format } from "date-fns";
import {
  fillMultiLineField,
  fillAllMultiLineFields,
  type FieldMapping,
} from "./pdfHelper";

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
      case "JHA":
        pdfPath = "/JHA.pdf";
        break;
      case "THA":
        pdfPath = "/THA.pdf";
        break;
      case "Fall-Protection":
        pdfPath = "/FallProtection.pdf";
        break;
      case "Telehandler":
        pdfPath = "/Telehandler.pdf";
        break;
      case "Swing-Stage":
        pdfPath = "/SwingStage.pdf";
        break;
      case "Witness-Statement":
        pdfPath = "/Witness-Statement.pdf";
        break;
      case "MEWP":
        pdfPath = "/MEWP.pdf";
        break;
      case "Lanyard-Inspection":
        pdfPath = "/LanyardInspection.pdf";
        break;
      case "Near-Miss-Report":
        pdfPath = "/Near-Miss.pdf";
        break;
      case "Jobsite-Safety-Inspection":
        pdfPath = "/JobsiteInspection.pdf";
        break;
      case "Safety-Meeting":
        pdfPath = "/SafetyMeeting.pdf";
        break;
      case "Accident-Incident-Report":
        pdfPath = "/AccidentReport.pdf";
        break;
      default:
        throw new Error(`Unknown form type at top of file: ${data.formName}`);
    }

    console.log(`Using PDF template: ${pdfPath}`);

    // Fetch the PDF template
    const pdfTemplate = await fetch(pdfPath);
    const pdfBytes = await pdfTemplate.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Get all field names from the PDF for debugging
    //const fields = form.getFields();
    //console.log(
    //  "Available PDF fields:",
    //  fields.map((f) => f.getName())
    //);

    // Fill the form based on the form type
    if (data.formName === "JHA" || data.formName === "THA") {
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
      safeSetTextField(form, "Text126", data.formData.supervisorName || "");
      safeSetTextField(
        form,
        "Text127",
        data.formData.supervisorSignature || ""
      );

      //************** Fall Protection Inspection Form */
    } else if (data.formName === "Fall-Protection") {
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
          "Check Box10",
          !!data.formData.hardware.shoulderBuckles?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box11",
          !!data.formData.hardware.shoulderBuckles?.fail
        );
        safeSetTextField(
          form,
          "Text13",
          data.formData.hardware.shoulderBuckles?.note || ""
        );

        // Leg & Waist Buckles
        safeSetCheckBox(
          form,
          "Check Box12",
          !!data.formData.hardware.legWaistBuckles?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box13",
          !!data.formData.hardware.legWaistBuckles?.fail
        );
        safeSetTextField(
          form,
          "Text14",
          data.formData.hardware.legWaistBuckles?.note || ""
        );

        // D-Rings
        safeSetCheckBox(
          form,
          "Check Box14",
          !!data.formData.hardware.dRings?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box15",
          !!data.formData.hardware.dRings?.fail
        );
        safeSetTextField(
          form,
          "Text15",
          data.formData.hardware.dRings?.note || ""
        );

        // Corrosion
        safeSetCheckBox(
          form,
          "Check Box16",
          !!data.formData.hardware.corrosion?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box17",
          !!data.formData.hardware.corrosion?.fail
        );
        safeSetTextField(
          form,
          "Text16",
          data.formData.hardware.corrosion?.note || ""
        );
      }

      // Webbing
      if (data.formData.webbing) {
        // Shoulder Strap
        safeSetCheckBox(
          form,
          "Check Box18",
          !!data.formData.webbing.shoulderStrap?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box19",
          !!data.formData.webbing.shoulderStrap?.fail
        );
        safeSetTextField(
          form,
          "Text17",
          data.formData.webbing.shoulderStrap?.note || ""
        );

        // Cuts/Burns
        safeSetCheckBox(
          form,
          "Check Box20",
          !!data.formData.webbing.cutsBurns?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box21",
          !!data.formData.webbing.cutsBurns?.fail
        );
        safeSetTextField(
          form,
          "Text18",
          data.formData.webbing.cutsBurns?.note || ""
        );

        // Paint Contamination
        safeSetCheckBox(
          form,
          "Check Box22",
          !!data.formData.webbing.paintContamination?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box23",
          !!data.formData.webbing.paintContamination?.fail
        );
        safeSetTextField(
          form,
          "Text19",
          data.formData.webbing.paintContamination?.note || ""
        );

        // Excessive Wear
        safeSetCheckBox(
          form,
          "Check Box24",
          !!data.formData.webbing.excessiveWear?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box25",
          !!data.formData.webbing.excessiveWear?.fail
        );
        safeSetTextField(
          form,
          "Text20",
          data.formData.webbing.excessiveWear?.note || ""
        );

        // Heat Damage
        safeSetCheckBox(
          form,
          "Check Box26",
          !!data.formData.webbing.heatDamage?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box27",
          !!data.formData.webbing.heatDamage?.fail
        );
        safeSetTextField(
          form,
          "Text21",
          data.formData.webbing.heatDamage?.note || ""
        );
      }

      // Stitching
      if (data.formData.stitching) {
        // Shoulders/Chest
        safeSetCheckBox(
          form,
          "Check Box28",
          !!data.formData.stitching.shouldersChest?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box29",
          !!data.formData.stitching.shouldersChest?.fail
        );
        safeSetTextField(
          form,
          "Text22",
          data.formData.stitching.shouldersChest?.note || ""
        );

        // Legs/Back Straps
        safeSetCheckBox(
          form,
          "Check Box30",
          !!data.formData.stitching.legsBackStraps?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box31",
          !!data.formData.stitching.legsBackStraps?.fail
        );
        safeSetTextField(
          form,
          "Text23",
          data.formData.stitching.legsBackStraps?.note || ""
        );
      }

      // Additional Notes
      safeSetTextField(form, "Text24", data.formData.additionalNotes || "");

      //************** Mobile Elevating Work Platform (MEWP) Pre-Use Inspection */
    } else if (data.formName === "MEWP") {
      // Basic Information
      safeSetTextField(form, "Text1", data.formData.jobName || "");
      safeSetTextField(form, "Text2", data.formData.mewpMakeModel || "");

      // MEWP Type Checkboxes
      safeSetCheckBox(
        form,
        "Check Box1",
        !!data.formData.mewpType?.scissorLift
      );
      safeSetCheckBox(
        form,
        "Check Box2",
        !!data.formData.mewpType?.personnelLift
      );
      safeSetCheckBox(form, "Check Box3", !!data.formData.mewpType?.aerialLift);
      safeSetCheckBox(
        form,
        "Check Box4",
        !!data.formData.mewpType?.telescopingLift
      );
      safeSetCheckBox(form, "Check Box5", !!data.formData.mewpType?.boomLift);
      safeSetCheckBox(
        form,
        "Check Box6",
        !!data.formData.mewpType?.articulatingLift
      );

      safeSetTextField(form, "Text3", data.formData.mewpId || "");
      safeSetTextField(form, "Text4", data.formData.hourMeterReading || "");
      safeSetTextField(
        form,
        "Text5",
        data.formData.inspectionConductedBy || ""
      );
      safeSetTextField(form, "Text6", formatDate(data.formData.inspectionDate));

      // Power Off Checks
      if (data.formData.powerOffChecks) {
        // Wheels and tires
        safeSetCheckBox(
          form,
          "Check Box7",
          !!data.formData.powerOffChecks.wheelsAndTires?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box8",
          !!data.formData.powerOffChecks.wheelsAndTires?.no
        );
        safeSetCheckBox(
          form,
          "Check Box9",
          !!data.formData.powerOffChecks.wheelsAndTires?.na
        );

        // Lights/strobes
        safeSetCheckBox(
          form,
          "Check Box10",
          !!data.formData.powerOffChecks.lightsStrobes?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box11",
          !!data.formData.powerOffChecks.lightsStrobes?.no
        );
        safeSetCheckBox(
          form,
          "Check Box12",
          !!data.formData.powerOffChecks.lightsStrobes?.na
        );

        // Mirrors/visibility aids
        safeSetCheckBox(
          form,
          "Check Box13",
          !!data.formData.powerOffChecks.mirrorsVisibilityAids?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box14",
          !!data.formData.powerOffChecks.mirrorsVisibilityAids?.no
        );
        safeSetCheckBox(
          form,
          "Check Box15",
          !!data.formData.powerOffChecks.mirrorsVisibilityAids?.na
        );

        // Engine compartment - Belts/hoses
        safeSetCheckBox(
          form,
          "Check Box16",
          !!data.formData.powerOffChecks.engineCompartmentBeltsHoses?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box17",
          !!data.formData.powerOffChecks.engineCompartmentBeltsHoses?.no
        );
        safeSetCheckBox(
          form,
          "Check Box18",
          !!data.formData.powerOffChecks.engineCompartmentBeltsHoses?.na
        );

        // Engine compartment - Cables/wires
        safeSetCheckBox(
          form,
          "Check Box19",
          !!data.formData.powerOffChecks.engineCompartmentCablesWires?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box20",
          !!data.formData.powerOffChecks.engineCompartmentCablesWires?.no
        );
        safeSetCheckBox(
          form,
          "Check Box21",
          !!data.formData.powerOffChecks.engineCompartmentCablesWires?.na
        );

        // Engine compartment - Debris
        safeSetCheckBox(
          form,
          "Check Box22",
          !!data.formData.powerOffChecks.engineCompartmentDebris?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box23",
          !!data.formData.powerOffChecks.engineCompartmentDebris?.no
        );
        safeSetCheckBox(
          form,
          "Check Box24",
          !!data.formData.powerOffChecks.engineCompartmentDebris?.na
        );

        // Battery - Terminals tight
        safeSetCheckBox(
          form,
          "Check Box25",
          !!data.formData.powerOffChecks.batteryTerminalsTight?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box26",
          !!data.formData.powerOffChecks.batteryTerminalsTight?.no
        );
        safeSetCheckBox(
          form,
          "Check Box27",
          !!data.formData.powerOffChecks.batteryTerminalsTight?.na
        );

        // Battery - Clean/dry/secure
        safeSetCheckBox(
          form,
          "Check Box28",
          !!data.formData.powerOffChecks.batteryCleanDrySecure?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box29",
          !!data.formData.powerOffChecks.batteryCleanDrySecure?.no
        );
        safeSetCheckBox(
          form,
          "Check Box30",
          !!data.formData.powerOffChecks.batteryCleanDrySecure?.na
        );

        // Hydraulics - Cylinders/rods
        safeSetCheckBox(
          form,
          "Check Box31",
          !!data.formData.powerOffChecks.hydraulicsCylindersRods?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box32",
          !!data.formData.powerOffChecks.hydraulicsCylindersRods?.no
        );
        safeSetCheckBox(
          form,
          "Check Box33",
          !!data.formData.powerOffChecks.hydraulicsCylindersRods?.na
        );

        // Hydraulics - Hoses/lines/fittings
        safeSetCheckBox(
          form,
          "Check Box34",
          !!data.formData.powerOffChecks.hydraulicsHosesLinesFittings?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box35",
          !!data.formData.powerOffChecks.hydraulicsHosesLinesFittings?.no
        );
        safeSetCheckBox(
          form,
          "Check Box36",
          !!data.formData.powerOffChecks.hydraulicsHosesLinesFittings?.na
        );

        // Fluids - Engine oil
        safeSetCheckBox(
          form,
          "Check Box37",
          !!data.formData.powerOffChecks.engineOil?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box38",
          !!data.formData.powerOffChecks.engineOil?.no
        );
        safeSetCheckBox(
          form,
          "Check Box39",
          !!data.formData.powerOffChecks.engineOil?.na
        );

        // Fluids - Engine coolant
        safeSetCheckBox(
          form,
          "Check Box40",
          !!data.formData.powerOffChecks.engineCoolant?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box41",
          !!data.formData.powerOffChecks.engineCoolant?.no
        );
        safeSetCheckBox(
          form,
          "Check Box42",
          !!data.formData.powerOffChecks.engineCoolant?.na
        );

        // Fluids - Hydraulic oil
        safeSetCheckBox(
          form,
          "Check Box43",
          !!data.formData.powerOffChecks.hydraulicOil?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box44",
          !!data.formData.powerOffChecks.hydraulicOil?.no
        );
        safeSetCheckBox(
          form,
          "Check Box45",
          !!data.formData.powerOffChecks.hydraulicOil?.na
        );

        // Fluids - Fuel/battery
        safeSetCheckBox(
          form,
          "Check Box46",
          !!data.formData.powerOffChecks.fuelBattery?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box47",
          !!data.formData.powerOffChecks.fuelBattery?.no
        );
        safeSetCheckBox(
          form,
          "Check Box48",
          !!data.formData.powerOffChecks.fuelBattery?.na
        );

        // Data/capacity plate
        safeSetCheckBox(
          form,
          "Check Box49",
          !!data.formData.powerOffChecks.dataCapacityPlate?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box50",
          !!data.formData.powerOffChecks.dataCapacityPlate?.no
        );
        safeSetCheckBox(
          form,
          "Check Box51",
          !!data.formData.powerOffChecks.dataCapacityPlate?.na
        );

        // Continue with other power off checks...
        safeSetCheckBox(
          form,
          "Check Box52",
          !!data.formData.powerOffChecks.counterweightBolts?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box53",
          !!data.formData.powerOffChecks.counterweightBolts?.no
        );
        safeSetCheckBox(
          form,
          "Check Box54",
          !!data.formData.powerOffChecks.counterweightBolts?.na
        );

        safeSetCheckBox(
          form,
          "Check Box55",
          !!data.formData.powerOffChecks.coverPanels?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box56",
          !!data.formData.powerOffChecks.coverPanels?.no
        );
        safeSetCheckBox(
          form,
          "Check Box57",
          !!data.formData.powerOffChecks.coverPanels?.na
        );

        safeSetCheckBox(
          form,
          "Check Box58",
          !!data.formData.powerOffChecks.boomValleyUnderPlatform?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box59",
          !!data.formData.powerOffChecks.boomValleyUnderPlatform?.no
        );
        safeSetCheckBox(
          form,
          "Check Box60",
          !!data.formData.powerOffChecks.boomValleyUnderPlatform?.na
        );

        safeSetCheckBox(
          form,
          "Check Box61",
          !!data.formData.powerOffChecks.accessoryPlugsCables?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box62",
          !!data.formData.powerOffChecks.accessoryPlugsCables?.no
        );
        safeSetCheckBox(
          form,
          "Check Box63",
          !!data.formData.powerOffChecks.accessoryPlugsCables?.na
        );

        safeSetCheckBox(
          form,
          "Check Box64",
          !!data.formData.powerOffChecks.boomLiftArmsCondition?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box65",
          !!data.formData.powerOffChecks.boomLiftArmsCondition?.no
        );
        safeSetCheckBox(
          form,
          "Check Box66",
          !!data.formData.powerOffChecks.boomLiftArmsCondition?.na
        );
        safeSetCheckBox(
          form,
          "Check Box67",
          !!data.formData.powerOffChecks.powerTrackLinesHoses?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box68",
          !!data.formData.powerOffChecks.powerTrackLinesHoses?.no
        );
        safeSetCheckBox(
          form,
          "Check Box69",
          !!data.formData.powerOffChecks.powerTrackLinesHoses?.na
        );
        safeSetCheckBox(
          form,
          "Check Box70",
          !!data.formData.powerOffChecks.safetyPropFunctional?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box71",
          !!data.formData.powerOffChecks.safetyPropFunctional?.no
        );
        safeSetCheckBox(
          form,
          "Check Box72",
          !!data.formData.powerOffChecks.safetyPropFunctional?.na
        );
        safeSetCheckBox(
          form,
          "Check Box73",
          !!data.formData.powerOffChecks.platformGuardrailsEtc?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box74",
          !!data.formData.powerOffChecks.platformGuardrailsEtc?.no
        );
        safeSetCheckBox(
          form,
          "Check Box75",
          !!data.formData.powerOffChecks.platformGuardrailsEtc?.na
        );
        safeSetCheckBox(
          form,
          "Check Box76",
          !!data.formData.powerOffChecks.storageCompartmentManuals?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box77",
          !!data.formData.powerOffChecks.storageCompartmentManuals?.no
        );
        safeSetCheckBox(
          form,
          "Check Box78",
          !!data.formData.powerOffChecks.storageCompartmentManuals?.na
        );
        safeSetCheckBox(
          form,
          "Check Box79",
          !!data.formData.powerOffChecks.controlMarkingsVisible?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box80",
          !!data.formData.powerOffChecks.controlMarkingsVisible?.no
        );
        safeSetCheckBox(
          form,
          "Check Box81",
          !!data.formData.powerOffChecks.controlMarkingsVisible?.na
        );
        safeSetCheckBox(
          form,
          "Check Box82",
          !!data.formData.powerOffChecks.other1?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box83",
          !!data.formData.powerOffChecks.other1?.no
        );
        safeSetCheckBox(
          form,
          "Check Box84",
          !!data.formData.powerOffChecks.other1?.na
        );
        safeSetCheckBox(
          form,
          "Check Box85",
          !!data.formData.powerOffChecks.other2?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box86",
          !!data.formData.powerOffChecks.other2?.no
        );
        safeSetCheckBox(
          form,
          "Check Box87",
          !!data.formData.powerOffChecks.other2?.na
        );
        safeSetCheckBox(
          form,
          "Check Box88",
          !!data.formData.powerOffChecks.other3?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box89",
          !!data.formData.powerOffChecks.other3?.no
        );
        safeSetCheckBox(
          form,
          "Check Box90",
          !!data.formData.powerOffChecks.other3?.na
        );
      }

      // Power On Checks section
      if (data.formData.powerOnChecks) {
        // Unit starts and runs properly
        safeSetCheckBox(
          form,
          "Check Box91",
          !!data.formData.powerOnChecks.unitStartsRunsProperly?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box92",
          !!data.formData.powerOnChecks.unitStartsRunsProperly?.no
        );
        safeSetCheckBox(
          form,
          "Check Box93",
          !!data.formData.powerOnChecks.unitStartsRunsProperly?.na
        );

        // Instruments/gauges
        safeSetCheckBox(
          form,
          "Check Box94",
          !!data.formData.powerOnChecks.instrumentsGauges?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box95",
          !!data.formData.powerOnChecks.instrumentsGauges?.no
        );
        safeSetCheckBox(
          form,
          "Check Box96",
          !!data.formData.powerOnChecks.instrumentsGauges?.na
        );
        // Warning lights/audible alarms
        safeSetCheckBox(
          form,
          "Check Box97",
          !!data.formData.powerOnChecks.warningLightsAlarms?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box98",
          !!data.formData.powerOnChecks.warningLightsAlarms?.no
        );
        safeSetCheckBox(
          form,
          "Check Box99",
          !!data.formData.powerOnChecks.warningLightsAlarms?.na
        );
        //fuelChargeLevel
        safeSetCheckBox(
          form,
          "Check Box100",
          !!data.formData.powerOnChecks.fuelChargeLevel?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box101",
          !!data.formData.powerOnChecks.fuelChargeLevel?.no
        );
        safeSetCheckBox(
          form,
          "Check Box102",
          !!data.formData.powerOnChecks.fuelChargeLevel?.na
        );
        //hornWarningDevices
        safeSetCheckBox(
          form,
          "Check Box103",
          !!data.formData.powerOnChecks.hornWarningDevices?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box104",
          !!data.formData.powerOnChecks.hornWarningDevices?.no
        );
        safeSetCheckBox(
          form,
          "Check Box105",
          !!data.formData.powerOnChecks.hornWarningDevices?.na
        );
        //boomJimLiftArms
        safeSetCheckBox(
          form,
          "Check Box106",
          !!data.formData.powerOnChecks.boomJimLiftArms?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box107",
          !!data.formData.powerOnChecks.boomJimLiftArms?.no
        );
        safeSetCheckBox(
          form,
          "Check Box108",
          !!data.formData.powerOnChecks.boomJimLiftArms?.na
        );
        //turretRotate
        safeSetCheckBox(
          form,
          "Check Box109",
          !!data.formData.powerOnChecks.turretRotate?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box110",
          !!data.formData.powerOnChecks.turretRotate?.no
        );
        safeSetCheckBox(
          form,
          "Check Box111",
          !!data.formData.powerOnChecks.turretRotate?.na
        );
        //driveForwardReverse
        safeSetCheckBox(
          form,
          "Check Box112",
          !!data.formData.powerOnChecks.driveForwardReverse?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box113",
          !!data.formData.powerOnChecks.driveForwardReverse?.no
        );
        safeSetCheckBox(
          form,
          "Check Box114",
          !!data.formData.powerOnChecks.driveForwardReverse?.na
        );
        //steeLeftRight
        safeSetCheckBox(
          form,
          "Check Box115",
          !!data.formData.powerOnChecks.steeLeftRight?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box116",
          !!data.formData.powerOnChecks.steeLeftRight?.no
        );
        safeSetCheckBox(
          form,
          "Check Box117",
          !!data.formData.powerOnChecks.steeLeftRight?.na
        );
        //platformTiltRotateExtend
        safeSetCheckBox(
          form,
          "Check Box118",
          !!data.formData.powerOnChecks.platformTiltRotateExtend?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box119",
          !!data.formData.powerOnChecks.platformTiltRotateExtend?.no
        );
        safeSetCheckBox(
          form,
          "Check Box120",
          !!data.formData.powerOnChecks.platformTiltRotateExtend?.na
        );
        //stabilityEnhanceDevices
        safeSetCheckBox(
          form,
          "Check Box121",
          !!data.formData.powerOnChecks.stabilityEnhanceDevices?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box122",
          !!data.formData.powerOnChecks.stabilityEnhanceDevices?.no
        );
        safeSetCheckBox(
          form,
          "Check Box123",
          !!data.formData.powerOnChecks.stabilityEnhanceDevices?.na
        );
        //functionEnableDevices
        safeSetCheckBox(
          form,
          "Check Box124",
          !!data.formData.powerOnChecks.functionEnableDevices?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box125",
          !!data.formData.powerOnChecks.functionEnableDevices?.no
        );
        safeSetCheckBox(
          form,
          "Check Box126",
          !!data.formData.powerOnChecks.functionEnableDevices?.na
        );
        //emergencyAuxiliaryControls
        safeSetCheckBox(
          form,
          "Check Box127",
          !!data.formData.powerOnChecks.emergencyAuxiliaryControls?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box128",
          !!data.formData.powerOnChecks.emergencyAuxiliaryControls?.no
        );
        safeSetCheckBox(
          form,
          "Check Box129",
          !!data.formData.powerOnChecks.emergencyAuxiliaryControls?.na
        );
        //safetyInterlocks
        safeSetCheckBox(
          form,
          "Check Box130",
          !!data.formData.powerOnChecks.safetyInterlocks?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box131",
          !!data.formData.powerOnChecks.safetyInterlocks?.no
        );
        safeSetCheckBox(
          form,
          "Check Box132",
          !!data.formData.powerOnChecks.safetyInterlocks?.na
        );
        //brakingStopsHolds
        safeSetCheckBox(
          form,
          "Check Box133",
          !!data.formData.powerOnChecks.brakingStopsHolds?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box134",
          !!data.formData.powerOnChecks.brakingStopsHolds?.no
        );
        safeSetCheckBox(
          form,
          "Check Box135",
          !!data.formData.powerOnChecks.brakingStopsHolds?.na
        );
        //otherPowerOn
        safeSetCheckBox(
          form,
          "Check Box136",
          !!data.formData.powerOnChecks.otherPowerOn?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box137",
          !!data.formData.powerOnChecks.otherPowerOn?.no
        );
        safeSetCheckBox(
          form,
          "Check Box138",
          !!data.formData.powerOnChecks.otherPowerOn?.na
        );
      }

      // General Checks
      if (data.formData.generalChecks) {
        safeSetCheckBox(
          form,
          "Check Box139",
          !!data.formData.generalChecks.mfrOperatingManual?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box140",
          !!data.formData.generalChecks.mfrOperatingManual?.no
        );
        safeSetCheckBox(
          form,
          "Check Box141",
          !!data.formData.generalChecks.mfrOperatingManual?.na
        );

        safeSetCheckBox(
          form,
          "Check Box142",
          !!data.formData.generalChecks.safetyDecalsWarnings?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box143",
          !!data.formData.generalChecks.safetyDecalsWarnings?.no
        );
        safeSetCheckBox(
          form,
          "Check Box144",
          !!data.formData.generalChecks.safetyDecalsWarnings?.na
        );

        safeSetCheckBox(
          form,
          "Check Box145",
          !!data.formData.generalChecks.miscPartsLooseMissingBroken?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box146",
          !!data.formData.generalChecks.miscPartsLooseMissingBroken?.no
        );
        safeSetCheckBox(
          form,
          "Check Box147",
          !!data.formData.generalChecks.miscPartsLooseMissingBroken?.na
        );
      }

      // Work Area Checks
      if (data.formData.workAreaChecks) {
        safeSetCheckBox(
          form,
          "Check Box148",
          !!data.formData.workAreaChecks.dropOffsHoles?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box149",
          !!data.formData.workAreaChecks.dropOffsHoles?.no
        );
        safeSetCheckBox(
          form,
          "Check Box150",
          !!data.formData.workAreaChecks.dropOffsHoles?.na
        );
        //bumpsFloorObstructions
        safeSetCheckBox(
          form,
          "Check Box151",
          !!data.formData.workAreaChecks.bumpsFloorObstructions?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box152",
          !!data.formData.workAreaChecks.bumpsFloorObstructions?.no
        );
        safeSetCheckBox(
          form,
          "Check Box153",
          !!data.formData.workAreaChecks.bumpsFloorObstructions?.na
        );
        //debris
        safeSetCheckBox(
          form,
          "Check Box154",
          !!data.formData.workAreaChecks.debris?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box155",
          !!data.formData.workAreaChecks.debris?.no
        );
        safeSetCheckBox(
          form,
          "Check Box156",
          !!data.formData.workAreaChecks.debris?.na
        );
        //overheadObstructions
        safeSetCheckBox(
          form,
          "Check Box157",
          !!data.formData.workAreaChecks.overheadObstructions?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box158",
          !!data.formData.workAreaChecks.overheadObstructions?.no
        );
        safeSetCheckBox(
          form,
          "Check Box159",
          !!data.formData.workAreaChecks.overheadObstructions?.na
        );
        //energizedPowerLines
        safeSetCheckBox(
          form,
          "Check Box160",
          !!data.formData.workAreaChecks.energizedPowerLines?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box161",
          !!data.formData.workAreaChecks.energizedPowerLines?.no
        );
        safeSetCheckBox(
          form,
          "Check Box162",
          !!data.formData.workAreaChecks.energizedPowerLines?.na
        );
        //hazardousLocations
        safeSetCheckBox(
          form,
          "Check Box163",
          !!data.formData.workAreaChecks.hazardousLocations?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box164",
          !!data.formData.workAreaChecks.hazardousLocations?.no
        );
        safeSetCheckBox(
          form,
          "Check Box165",
          !!data.formData.workAreaChecks.hazardousLocations?.na
        );
        //groundSurfaceSupport
        safeSetCheckBox(
          form,
          "Check Box166",
          !!data.formData.workAreaChecks.groundSurfaceSupport?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box167",
          !!data.formData.workAreaChecks.groundSurfaceSupport?.no
        );
        safeSetCheckBox(
          form,
          "Check Box168",
          !!data.formData.workAreaChecks.groundSurfaceSupport?.na
        );
        //pedestrianVehicleTraffic
        safeSetCheckBox(
          form,
          "Check Box169",
          !!data.formData.workAreaChecks.pedestrianVehicleTraffic?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box170",
          !!data.formData.workAreaChecks.pedestrianVehicleTraffic?.no
        );
        safeSetCheckBox(
          form,
          "Check Box171",
          !!data.formData.workAreaChecks.pedestrianVehicleTraffic?.na
        );
        //windWeatherConditions
        safeSetCheckBox(
          form,
          "Check Box172",
          !!data.formData.workAreaChecks.windWeatherConditions?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box173",
          !!data.formData.workAreaChecks.windWeatherConditions?.no
        );
        safeSetCheckBox(
          form,
          "Check Box174",
          !!data.formData.workAreaChecks.windWeatherConditions?.na
        );
        //otherPossibleHazards
        safeSetCheckBox(
          form,
          "Check Box175",
          !!data.formData.workAreaChecks.otherPossibleHazards?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box176",
          !!data.formData.workAreaChecks.otherPossibleHazards?.no
        );
        safeSetCheckBox(
          form,
          "Check Box177",
          !!data.formData.workAreaChecks.otherPossibleHazards?.na
        );
      }

      // Comment Items
      if (
        data.formData.commentItems &&
        Array.isArray(data.formData.commentItems)
      ) {
        data.formData.commentItems.forEach(
          (item: { itemNumber: string; comment: string }, index: number) => {
            if (index < 5) {
              // 5 comment rows
              const baseField = 7 + index * 2; // 7, 9, 11, 13, 15
              const itemNumberField = `Text${baseField}`;
              const commentField = `Text${baseField + 1}`;

              safeSetTextField(form, itemNumberField, item.itemNumber || "");
              safeSetTextField(form, commentField, item.comment || "");
            }
          }
        );
      }
      //************** Telehandler/Forklift Pre-Use Inspection */
    } else if (data.formName === "Telehandler") {
      // Basic Information
      safeSetTextField(form, "Text1", data.formData.jobName || "");
      safeSetTextField(form, "Calibri10", data.formData.makeModel || "");
      safeSetTextField(form, "Text2", data.formData.type || "");

      // Type checkboxes
      safeSetCheckBox(
        form,
        "Check Box1",
        !!data.formData.telehandlerType?.telehandler
      );
      safeSetCheckBox(
        form,
        "Check Box2",
        !!data.formData.telehandlerType?.forklift
      );

      safeSetTextField(form, "Text3", data.formData.hourMeterReading || "");
      safeSetTextField(
        form,
        "Text4",
        data.formData.inspectionConductedBy || ""
      );
      safeSetTextField(form, "Text5", formatDate(data.formData.inspectionDate));

      // Power Off Checks
      if (data.formData.powerOffChecks) {
        // Wheels and tires
        safeSetCheckBox(
          form,
          "Check Box3",
          !!data.formData.powerOffChecks.wheelsAndTires?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box4",
          !!data.formData.powerOffChecks.wheelsAndTires?.no
        );
        safeSetCheckBox(
          form,
          "Check Box5",
          !!data.formData.powerOffChecks.wheelsAndTires?.na
        );
        // Lights/strobes
        safeSetCheckBox(
          form,
          "Check Box6",
          !!data.formData.powerOffChecks.lightsStrobes?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box7",
          !!data.formData.powerOffChecks.lightsStrobes?.no
        );
        safeSetCheckBox(
          form,
          "Check Box8",
          !!data.formData.powerOffChecks.lightsStrobes?.na
        );
        // Mirrors/visibility aids
        safeSetCheckBox(
          form,
          "Check Box9",
          !!data.formData.powerOffChecks.mirrorsVisibilityAids?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box10",
          !!data.formData.powerOffChecks.mirrorsVisibilityAids?.no
        );
        safeSetCheckBox(
          form,
          "Check Box11",
          !!data.formData.powerOffChecks.mirrorsVisibilityAids?.na
        );
        // Engine compartment - Belts/hoses
        safeSetCheckBox(
          form,
          "Check Box12",
          !!data.formData.powerOffChecks.engineCompartmentBeltsHoses?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box13",
          !!data.formData.powerOffChecks.engineCompartmentBeltsHoses?.no
        );
        safeSetCheckBox(
          form,
          "Check Box14",
          !!data.formData.powerOffChecks.engineCompartmentBeltsHoses?.na
        );
        // Engine compartment - Cables/wires
        safeSetCheckBox(
          form,
          "Check Box15",
          !!data.formData.powerOffChecks.engineCompartmentCablesWires?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box16",
          !!data.formData.powerOffChecks.engineCompartmentCablesWires?.no
        );
        safeSetCheckBox(
          form,
          "Check Box17",
          !!data.formData.powerOffChecks.engineCompartmentCablesWires?.na
        );
        // Engine compartment - Debris
        safeSetCheckBox(
          form,
          "Check Box18",
          !!data.formData.powerOffChecks.engineCompartmentDebris?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box19",
          !!data.formData.powerOffChecks.engineCompartmentDebris?.no
        );
        safeSetCheckBox(
          form,
          "Check Box20",
          !!data.formData.powerOffChecks.engineCompartmentDebris?.na
        );
        // Battery - Terminals tight
        safeSetCheckBox(
          form,
          "Check Box21",
          !!data.formData.powerOffChecks.batteryTerminalsTight?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box22",
          !!data.formData.powerOffChecks.batteryTerminalsTight?.no
        );
        safeSetCheckBox(
          form,
          "Check Box23",
          !!data.formData.powerOffChecks.batteryTerminalsTight?.na
        );
        // Battery - Clean/dry/secure
        safeSetCheckBox(
          form,
          "Check Box24",
          !!data.formData.powerOffChecks.batteryCleanDrySecure?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box25",
          !!data.formData.powerOffChecks.batteryCleanDrySecure?.no
        );
        safeSetCheckBox(
          form,
          "Check Box26",
          !!data.formData.powerOffChecks.batteryCleanDrySecure?.na
        );
        // Hydraulics - Cylinders/rods
        safeSetCheckBox(
          form,
          "Check Box27",
          !!data.formData.powerOffChecks.hydraulicsCylindersRods?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box28",
          !!data.formData.powerOffChecks.hydraulicsCylindersRods?.no
        );
        safeSetCheckBox(
          form,
          "Check Box29",
          !!data.formData.powerOffChecks.hydraulicsCylindersRods?.na
        );
        // Hydraulics - Hoses/lines/fittings
        safeSetCheckBox(
          form,
          "Check Box30",
          !!data.formData.powerOffChecks.hydraulicsHosesLinesFittings?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box31",
          !!data.formData.powerOffChecks.hydraulicsHosesLinesFittings?.no
        );
        safeSetCheckBox(
          form,
          "Check Box32",
          !!data.formData.powerOffChecks.hydraulicsHosesLinesFittings?.na
        );
        // Fluids - Engine oil
        safeSetCheckBox(
          form,
          "Check Box33",
          !!data.formData.powerOffChecks.engineOil?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box34",
          !!data.formData.powerOffChecks.engineOil?.no
        );
        safeSetCheckBox(
          form,
          "Check Box35",
          !!data.formData.powerOffChecks.engineOil?.na
        );
        // Fluids - Engine coolant
        safeSetCheckBox(
          form,
          "Check Box36",
          !!data.formData.powerOffChecks.engineCoolant?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box37",
          !!data.formData.powerOffChecks.engineCoolant?.no
        );
        safeSetCheckBox(
          form,
          "Check Box38",
          !!data.formData.powerOffChecks.engineCoolant?.na
        );
        // Fluids - Hydraulic oil
        safeSetCheckBox(
          form,
          "Check Box39",
          !!data.formData.powerOffChecks.hydraulicOil?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box40",
          !!data.formData.powerOffChecks.hydraulicOil?.no
        );
        safeSetCheckBox(
          form,
          "Check Box41",
          !!data.formData.powerOffChecks.hydraulicOil?.na
        );
        // Fluids - Fuel/battery
        safeSetCheckBox(
          form,
          "Check Box42",
          !!data.formData.powerOffChecks.fuelBattery?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box43",
          !!data.formData.powerOffChecks.fuelBattery?.no
        );
        safeSetCheckBox(
          form,
          "Check Box44",
          !!data.formData.powerOffChecks.fuelBattery?.na
        );
        // Data/capacity plate
        safeSetCheckBox(
          form,
          "Check Box45",
          !!data.formData.powerOffChecks.dataCapacityPlate?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box46",
          !!data.formData.powerOffChecks.dataCapacityPlate?.no
        );
        safeSetCheckBox(
          form,
          "Check Box47",
          !!data.formData.powerOffChecks.dataCapacityPlate?.na
        );
        // Windows Glass Doors
        safeSetCheckBox(
          form,
          "Check Box48",
          !!data.formData.powerOffChecks.windowsGlassDoors?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box49",
          !!data.formData.powerOffChecks.windowsGlassDoors?.no
        );
        safeSetCheckBox(
          form,
          "Check Box50",
          !!data.formData.powerOffChecks.windowsGlassDoors?.na
        );
        //hoodCoverPanels
        safeSetCheckBox(
          form,
          "Check Box51",
          !!data.formData.powerOffChecks.hoodCoverPanels?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box52",
          !!data.formData.powerOffChecks.hoodCoverPanels?.no
        );
        safeSetCheckBox(
          form,
          "Check Box53",
          !!data.formData.powerOffChecks.hoodCoverPanels?.na
        );
        //airFilterIndicator
        safeSetCheckBox(
          form,
          "Check Box54",
          !!data.formData.powerOffChecks.airFilterIndicator?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box55",
          !!data.formData.powerOffChecks.airFilterIndicator?.no
        );
        safeSetCheckBox(
          form,
          "Check Box56",
          !!data.formData.powerOffChecks.airFilterIndicator?.na
        );
        //counterweightBolts
        safeSetCheckBox(
          form,
          "Check Box57",
          !!data.formData.powerOffChecks.counterweightBolts?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box58",
          !!data.formData.powerOffChecks.counterweightBolts?.no
        );
        safeSetCheckBox(
          form,
          "Check Box59",
          !!data.formData.powerOffChecks.counterweightBolts?.na
        );
        //liftingAttachments
        safeSetCheckBox(
          form,
          "Check Box60",
          !!data.formData.powerOffChecks.liftingAttachments?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box61",
          !!data.formData.powerOffChecks.liftingAttachments?.no
        );
        safeSetCheckBox(
          form,
          "Check Box62",
          !!data.formData.powerOffChecks.liftingAttachments?.na
        );
        //boomSectionsDamage
        safeSetCheckBox(
          form,
          "Check Box63",
          !!data.formData.powerOffChecks.boomSectionsDamage?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box64",
          !!data.formData.powerOffChecks.boomSectionsDamage?.no
        );
        safeSetCheckBox(
          form,
          "Check Box65",
          !!data.formData.powerOffChecks.boomSectionsDamage?.na
        );
        //boomAngleIndicator
        safeSetCheckBox(
          form,
          "Check Box66",
          !!data.formData.powerOffChecks.boomAngleIndicator?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box67",
          !!data.formData.powerOffChecks.boomAngleIndicator?.no
        );
        safeSetCheckBox(
          form,
          "Check Box68",
          !!data.formData.powerOffChecks.boomAngleIndicator?.na
        );
        //ropsCab
        safeSetCheckBox(
          form,
          "Check Box69",
          !!data.formData.powerOffChecks.ropsCab?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box70",
          !!data.formData.powerOffChecks.ropsCab?.no
        );
        safeSetCheckBox(
          form,
          "Check Box71",
          !!data.formData.powerOffChecks.ropsCab?.na
        );
        //frameLevelIndicator
        safeSetCheckBox(
          form,
          "Check Box72",
          !!data.formData.powerOffChecks.frameLevelIndicator?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box73",
          !!data.formData.powerOffChecks.frameLevelIndicator?.no
        );
        safeSetCheckBox(
          form,
          "Check Box74",
          !!data.formData.powerOffChecks.frameLevelIndicator?.na
        );
        //seatbelt
        safeSetCheckBox(
          form,
          "Check Box75",
          !!data.formData.powerOffChecks.seatbelt?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box76",
          !!data.formData.powerOffChecks.seatbelt?.no
        );
        safeSetCheckBox(
          form,
          "Check Box77",
          !!data.formData.powerOffChecks.seatbelt?.na
        );
        //other1
        safeSetCheckBox(
          form,
          "Check Box78",
          !!data.formData.powerOffChecks.other1?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box79",
          !!data.formData.powerOffChecks.other1?.no
        );
        safeSetCheckBox(
          form,
          "Check Box80",
          !!data.formData.powerOffChecks.other1?.na
        );
        //other2
        safeSetCheckBox(
          form,
          "Check Box81",
          !!data.formData.powerOffChecks.other2?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box82",
          !!data.formData.powerOffChecks.other2?.no
        );
        safeSetCheckBox(
          form,
          "Check Box83",
          !!data.formData.powerOffChecks.other2?.na
        );
        //other3
        safeSetCheckBox(
          form,
          "Check Box84",
          !!data.formData.powerOffChecks.other3?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box85",
          !!data.formData.powerOffChecks.other3?.no
        );
        safeSetCheckBox(
          form,
          "Check Box86",
          !!data.formData.powerOffChecks.other3?.na
        );
      }
      // Power On Checks
      if (data.formData.powerOnChecks) {
        // Unit starts and runs properly
        safeSetCheckBox(
          form,
          "Check Box87",
          !!data.formData.powerOnChecks.unitStartsRunsProperly?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box88",
          !!data.formData.powerOnChecks.unitStartsRunsProperly?.no
        );
        safeSetCheckBox(
          form,
          "Check Box89",
          !!data.formData.powerOnChecks.unitStartsRunsProperly?.na
        );
        // Instruments/gauges
        safeSetCheckBox(
          form,
          "Check Box90",
          !!data.formData.powerOnChecks.instrumentsGauges?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box91",
          !!data.formData.powerOnChecks.instrumentsGauges?.no
        );
        safeSetCheckBox(
          form,
          "Check Box92",
          !!data.formData.powerOnChecks.instrumentsGauges?.na
        );
        // Warning lights/audible alarms
        safeSetCheckBox(
          form,
          "Check Box93",
          !!data.formData.powerOnChecks.warningLightsAlarms?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box94",
          !!data.formData.powerOnChecks.warningLightsAlarms?.no
        );
        safeSetCheckBox(
          form,
          "Check Box95",
          !!data.formData.powerOnChecks.warningLightsAlarms?.na
        );
        //fuelLevel
        safeSetCheckBox(
          form,
          "Check Box96",
          !!data.formData.powerOnChecks.fuelLevel?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box97",
          !!data.formData.powerOnChecks.fuelLevel?.no
        );
        safeSetCheckBox(
          form,
          "Check Box98",
          !!data.formData.powerOnChecks.fuelLevel?.na
        );
        //hornWarningDevices
        safeSetCheckBox(
          form,
          "Check Box99",
          !!data.formData.powerOnChecks.hornWarningDevices?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box100",
          !!data.formData.powerOnChecks.hornWarningDevices?.no
        );
        safeSetCheckBox(
          form,
          "Check Box101",
          !!data.formData.powerOnChecks.hornWarningDevices?.na
        );
        //boomCarriage
        safeSetCheckBox(
          form,
          "Check Box102",
          !!data.formData.powerOnChecks.boomCarriage?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box103",
          !!data.formData.powerOnChecks.boomCarriage?.no
        );
        safeSetCheckBox(
          form,
          "Check Box104",
          !!data.formData.powerOnChecks.boomCarriage?.na
        );
        //liftingAttachment
        safeSetCheckBox(
          form,
          "Check Box105",
          !!data.formData.powerOnChecks.liftingAttachment?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box106",
          !!data.formData.powerOnChecks.liftingAttachment?.no
        );
        safeSetCheckBox(
          form,
          "Check Box107",
          !!data.formData.powerOnChecks.liftingAttachment?.na
        );
        //driveForwardReverse
        safeSetCheckBox(
          form,
          "Check Box108",
          !!data.formData.powerOnChecks.driveForwardReverse?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box109",
          !!data.formData.powerOnChecks.driveForwardReverse?.no
        );
        safeSetCheckBox(
          form,
          "Check Box110",
          !!data.formData.powerOnChecks.driveForwardReverse?.na
        );
        //steerLeftRight
        safeSetCheckBox(
          form,
          "Check Box111",
          !!data.formData.powerOnChecks.steerLeftRight?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box112",
          !!data.formData.powerOnChecks.steerLeftRight?.no
        );
        safeSetCheckBox(
          form,
          "Check Box113",
          !!data.formData.powerOnChecks.steerLeftRight?.na
        );
        //frameLevel
        safeSetCheckBox(
          form,
          "Check Box114",
          !!data.formData.powerOnChecks.frameLevel?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box115",
          !!data.formData.powerOnChecks.frameLevel?.no
        );

        safeSetCheckBox(
          form,
          "Check Box116",
          !!data.formData.powerOnChecks.frameLevel?.na
        );
        //outriggers
        safeSetCheckBox(
          form,
          "Check Box117",
          !!data.formData.powerOnChecks.outriggers?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box118",
          !!data.formData.powerOnChecks.outriggers?.no
        );
        safeSetCheckBox(
          form,
          "Check Box119",
          !!data.formData.powerOnChecks.outriggers?.na
        );
        //otherFunctionControl
        safeSetCheckBox(
          form,
          "Check Box120",
          !!data.formData.powerOnChecks.otherFunctionControl?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box121",
          !!data.formData.powerOnChecks.otherFunctionControl?.no
        );
        safeSetCheckBox(
          form,
          "Check Box122",
          !!data.formData.powerOnChecks.otherFunctionControl?.na
        );
        //braking
        safeSetCheckBox(
          form,
          "Check Box123",
          !!data.formData.powerOnChecks.braking?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box124",
          !!data.formData.powerOnChecks.braking?.no
        );
        safeSetCheckBox(
          form,
          "Check Box125",
          !!data.formData.powerOnChecks.braking?.na
        );
        //serviceDeClutch
        safeSetCheckBox(
          form,
          "Check Box126",
          !!data.formData.powerOnChecks.serviceDeClutch?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box127",
          !!data.formData.powerOnChecks.serviceDeClutch?.no
        );
        safeSetCheckBox(
          form,
          "Check Box128",
          !!data.formData.powerOnChecks.serviceDeClutch?.na
        );
        //parking
        safeSetCheckBox(
          form,
          "Check Box129",
          !!data.formData.powerOnChecks.parking?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box130",
          !!data.formData.powerOnChecks.parking?.no
        );
        safeSetCheckBox(
          form,
          "Check Box131",
          !!data.formData.powerOnChecks.parking?.na
        );
        //otherPowerOn
        safeSetCheckBox(
          form,
          "Check Box132",
          !!data.formData.powerOnChecks.otherPowerOn?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box133",
          !!data.formData.powerOnChecks.otherPowerOn?.no
        );
        safeSetCheckBox(
          form,
          "Check Box134",
          !!data.formData.powerOnChecks.otherPowerOn?.na
        );
      }
      // General Checks
      if (data.formData.generalChecks) {
        //decalsWarningsPlacards
        safeSetCheckBox(
          form,
          "Check Box135",
          !!data.formData.generalChecks.decalsWarningsPlacards?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box136",
          !!data.formData.generalChecks.decalsWarningsPlacards?.no
        );
        safeSetCheckBox(
          form,
          "Check Box137",
          !!data.formData.generalChecks.decalsWarningsPlacards?.na
        );
        //manufacturerOperatorsManual
        safeSetCheckBox(
          form,
          "Check Box138",
          !!data.formData.generalChecks.manufacturerOperatorsManual?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box139",
          !!data.formData.generalChecks.manufacturerOperatorsManual?.no
        );
        safeSetCheckBox(
          form,
          "Check Box140",
          !!data.formData.generalChecks.manufacturerOperatorsManual?.na
        );
        //miscPartsLooseMissingBroken
        safeSetCheckBox(
          form,
          "Check Box141",
          !!data.formData.generalChecks.miscPartsLooseMissingBroken?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box142",
          !!data.formData.generalChecks.miscPartsLooseMissingBroken?.no
        );
        safeSetCheckBox(
          form,
          "Check Box143",
          !!data.formData.generalChecks.miscPartsLooseMissingBroken?.na
        );
      }
      // Work Area Checks
      if (data.formData.workAreaChecks) {
        //dropOffsHoles
        safeSetCheckBox(
          form,
          "Check Box144",
          !!data.formData.workAreaChecks.dropOffsHoles?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box145",
          !!data.formData.workAreaChecks.dropOffsHoles?.no
        );
        safeSetCheckBox(
          form,
          "Check Box146",
          !!data.formData.workAreaChecks.dropOffsHoles?.na
        );
        //bumpsFloorObstructions
        safeSetCheckBox(
          form,
          "Check Box147",
          !!data.formData.workAreaChecks.bumpsFloorObstructions?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box148",
          !!data.formData.workAreaChecks.bumpsFloorObstructions?.no
        );
        safeSetCheckBox(
          form,
          "Check Box149",
          !!data.formData.workAreaChecks.bumpsFloorObstructions?.na
        );
        //debris
        safeSetCheckBox(
          form,
          "Check Box150",
          !!data.formData.workAreaChecks.debris?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box151",
          !!data.formData.workAreaChecks.debris?.no
        );
        safeSetCheckBox(
          form,
          "Check Box152",
          !!data.formData.workAreaChecks.debris?.na
        );
        //overheadObstructions
        safeSetCheckBox(
          form,
          "Check Box153",
          !!data.formData.workAreaChecks.overheadObstructions?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box154",
          !!data.formData.workAreaChecks.overheadObstructions?.no
        );
        safeSetCheckBox(
          form,
          "Check Box155",
          !!data.formData.workAreaChecks.overheadObstructions?.na
        );
        //energizedPowerLines
        safeSetCheckBox(
          form,
          "Check Box156",
          !!data.formData.workAreaChecks.energizedPowerLines?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box157",
          !!data.formData.workAreaChecks.energizedPowerLines?.no
        );
        safeSetCheckBox(
          form,
          "Check Box158",
          !!data.formData.workAreaChecks.energizedPowerLines?.na
        );
        //hazardousLocations
        safeSetCheckBox(
          form,
          "Check Box159",
          !!data.formData.workAreaChecks.hazardousLocations?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box160",
          !!data.formData.workAreaChecks.hazardousLocations?.no
        );
        safeSetCheckBox(
          form,
          "Check Box161",
          !!data.formData.workAreaChecks.hazardousLocations?.na
        );
        //groundSurfaceSupport
        safeSetCheckBox(
          form,
          "Check Box162",
          !!data.formData.workAreaChecks.groundSurfaceSupport?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box163",
          !!data.formData.workAreaChecks.groundSurfaceSupport?.no
        );
        safeSetCheckBox(
          form,
          "Check Box164",
          !!data.formData.workAreaChecks.groundSurfaceSupport?.na
        );
        //pedestrianVehicleTraffic
        safeSetCheckBox(
          form,
          "Check Box165",
          !!data.formData.workAreaChecks.pedestrianVehicleTraffic?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box166",
          !!data.formData.workAreaChecks.pedestrianVehicleTraffic?.no
        );
        safeSetCheckBox(
          form,
          "Check Box167",
          !!data.formData.workAreaChecks.pedestrianVehicleTraffic?.na
        );
        //windWeatherConditions
        safeSetCheckBox(
          form,
          "Check Box168",
          !!data.formData.workAreaChecks.windWeatherConditions?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box169",
          !!data.formData.workAreaChecks.windWeatherConditions?.no
        );
        safeSetCheckBox(
          form,
          "Check Box170",
          !!data.formData.workAreaChecks.windWeatherConditions?.na
        );
        //otherPossibleHazards
        safeSetCheckBox(
          form,
          "Check Box171",
          !!data.formData.workAreaChecks.otherPossibleHazards?.ok
        );
        safeSetCheckBox(
          form,
          "Check Box172",
          !!data.formData.workAreaChecks.otherPossibleHazards?.no
        );
        safeSetCheckBox(
          form,
          "Check Box173",
          !!data.formData.workAreaChecks.otherPossibleHazards?.na
        );
      }
      // Comment Items
      if (
        data.formData.commentItems &&
        Array.isArray(data.formData.commentItems)
      ) {
        data.formData.commentItems.forEach(
          (item: { itemNumber: string; comment: string }, index: number) => {
            if (index < 5) {
              // 5 comment rows
              const baseField = 6 + index * 2; // 7, 9, 11, 13, 15
              const itemNumberField = `Text${baseField}`;
              const commentField = `Text${baseField + 1}`;

              safeSetTextField(form, itemNumberField, item.itemNumber || "");
              safeSetTextField(form, commentField, item.comment || "");
            }
          }
        );
      }
    } else if (data.formName === "Swing-Stage") {
      // Basic Information
      safeSetTextField(form, "Text1", data.formData.jobName || "");
      safeSetTextField(form, "Text2", data.formData.jobNumber || "");
      safeSetTextField(form, "Text3", data.formData.jobsiteAddress || "");
      safeSetTextField(form, "Text4", formatDate(data.formData.date));
      safeSetTextField(form, "Text5", data.formData.superintendent || "");
      safeSetTextField(form, "Text6", data.formData.weather || "");

      // General Checks
      if (data.formData.generalChecks) {
        // Any Damage to Equipment
        safeSetCheckBox(
          form,
          "Check Box1",
          !!data.formData.generalChecks.damageToEquipment?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box2",
          !!data.formData.generalChecks.damageToEquipment?.no
        );
        safeSetCheckBox(
          form,
          "Check Box3",
          !!data.formData.generalChecks.damageToEquipment?.na
        );

        // Equipment Overloaded
        safeSetCheckBox(
          form,
          "Check Box4",
          !!data.formData.generalChecks.equipmentOverloaded?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box5",
          !!data.formData.generalChecks.equipmentOverloaded?.no
        );
        safeSetCheckBox(
          form,
          "Check Box6",
          !!data.formData.generalChecks.equipmentOverloaded?.na
        );

        // Competent Person Qualified
        safeSetCheckBox(
          form,
          "Check Box7",
          !!data.formData.generalChecks.competentPersonQualified?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box8",
          !!data.formData.generalChecks.competentPersonQualified?.no
        );
        safeSetCheckBox(
          form,
          "Check Box9",
          !!data.formData.generalChecks.competentPersonQualified?.na
        );

        // Equipment Used Correctly
        safeSetCheckBox(
          form,
          "Check Box10",
          !!data.formData.generalChecks.equipmentUsedCorrectly?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box11",
          !!data.formData.generalChecks.equipmentUsedCorrectly?.no
        );
        safeSetCheckBox(
          form,
          "Check Box12",
          !!data.formData.generalChecks.equipmentUsedCorrectly?.na
        );

        // Communication Available
        safeSetCheckBox(
          form,
          "Check Box13",
          !!data.formData.generalChecks.communicationAvailable?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box14",
          !!data.formData.generalChecks.communicationAvailable?.no
        );
        safeSetCheckBox(
          form,
          "Check Box15",
          !!data.formData.generalChecks.communicationAvailable?.na
        );

        // Connection Hardware Good
        safeSetCheckBox(
          form,
          "Check Box16",
          !!data.formData.generalChecks.connectionHardwareGood?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box17",
          !!data.formData.generalChecks.connectionHardwareGood?.no
        );
        safeSetCheckBox(
          form,
          "Check Box18",
          !!data.formData.generalChecks.connectionHardwareGood?.na
        );

        // Unattended Platforms Secured
        safeSetCheckBox(
          form,
          "Check Box19",
          !!data.formData.generalChecks.unattendedPlatformsSecured?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box20",
          !!data.formData.generalChecks.unattendedPlatformsSecured?.no
        );
        safeSetCheckBox(
          form,
          "Check Box21",
          !!data.formData.generalChecks.unattendedPlatformsSecured?.na
        );

        // Required Labels Present
        safeSetCheckBox(
          form,
          "Check Box22",
          !!data.formData.generalChecks.requiredLabelsPresent?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box23",
          !!data.formData.generalChecks.requiredLabelsPresent?.no
        );
        safeSetCheckBox(
          form,
          "Check Box24",
          !!data.formData.generalChecks.requiredLabelsPresent?.na
        );
      }

      // Rigging Equipment
      if (data.formData.riggingEquipment) {
        // Structure Supports Loads
        safeSetCheckBox(
          form,
          "Check Box25",
          !!data.formData.riggingEquipment.structureSupportsLoads?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box26",
          !!data.formData.riggingEquipment.structureSupportsLoads?.no
        );
        safeSetCheckBox(
          form,
          "Check Box27",
          !!data.formData.riggingEquipment.structureSupportsLoads?.na
        );

        // Rigging Equipment Designed
        safeSetCheckBox(
          form,
          "Check Box28",
          !!data.formData.riggingEquipment.riggingEquipmentDesigned?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box29",
          !!data.formData.riggingEquipment.riggingEquipmentDesigned?.no
        );
        safeSetCheckBox(
          form,
          "Check Box30",
          !!data.formData.riggingEquipment.riggingEquipmentDesigned?.na
        );

        // Additional Welding Safety
        safeSetCheckBox(
          form,
          "Check Box31",
          !!data.formData.riggingEquipment.additionalWeldingSafety?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box32",
          !!data.formData.riggingEquipment.additionalWeldingSafety?.no
        );
        safeSetCheckBox(
          form,
          "Check Box33",
          !!data.formData.riggingEquipment.additionalWeldingSafety?.na
        );

        // Davits Sockets Installed
        safeSetCheckBox(
          form,
          "Check Box34",
          !!data.formData.riggingEquipment.davitsSocketsInstalled?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box35",
          !!data.formData.riggingEquipment.davitsSocketsInstalled?.no
        );
        safeSetCheckBox(
          form,
          "Check Box36",
          !!data.formData.riggingEquipment.davitsSocketsInstalled?.na
        );

        // Counterweights Match
        safeSetCheckBox(
          form,
          "Check Box37",
          !!data.formData.riggingEquipment.counterweightsMatch?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box38",
          !!data.formData.riggingEquipment.counterweightsMatch?.no
        );
        safeSetCheckBox(
          form,
          "Check Box39",
          !!data.formData.riggingEquipment.counterweightsMatch?.na
        );

        // Tested Anchorage Supports
        safeSetCheckBox(
          form,
          "Check Box40",
          !!data.formData.riggingEquipment.testedAnchorageSupports?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box41",
          !!data.formData.riggingEquipment.testedAnchorageSupports?.no
        );
        safeSetCheckBox(
          form,
          "Check Box42",
          !!data.formData.riggingEquipment.testedAnchorageSupports?.na
        );

        // Welds In Good Condition
        safeSetCheckBox(
          form,
          "Check Box43",
          !!data.formData.riggingEquipment.weldsInGoodCondition?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box44",
          !!data.formData.riggingEquipment.weldsInGoodCondition?.no
        );
        safeSetCheckBox(
          form,
          "Check Box45",
          !!data.formData.riggingEquipment.weldsInGoodCondition?.na
        );

        // Components Undamaged
        safeSetCheckBox(
          form,
          "Check Box46",
          !!data.formData.riggingEquipment.componentsUndamaged?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box47",
          !!data.formData.riggingEquipment.componentsUndamaged?.no
        );
        safeSetCheckBox(
          form,
          "Check Box48",
          !!data.formData.riggingEquipment.componentsUndamaged?.na
        );

        // Steel Parts No Penetrating Rust
        safeSetCheckBox(
          form,
          "Check Box49",
          !!data.formData.riggingEquipment.steelPartsNoPenetRust?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box50",
          !!data.formData.riggingEquipment.steelPartsNoPenetRust?.no
        );
        safeSetCheckBox(
          form,
          "Check Box51",
          !!data.formData.riggingEquipment.steelPartsNoPenetRust?.na
        );
      }

      // Suspended Platform
      if (data.formData.suspendedPlatform) {
        // Platform Stirrups In Line
        safeSetCheckBox(
          form,
          "Check Box52",
          !!data.formData.suspendedPlatform.platformStirrupsInLine?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box53",
          !!data.formData.suspendedPlatform.platformStirrupsInLine?.no
        );
        safeSetCheckBox(
          form,
          "Check Box54",
          !!data.formData.suspendedPlatform.platformStirrupsInLine?.na
        );

        // Live Load Not Exceed
        safeSetCheckBox(
          form,
          "Check Box55",
          !!data.formData.suspendedPlatform.liveLoadNotExceed?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box56",
          !!data.formData.suspendedPlatform.liveLoadNotExceed?.no
        );
        safeSetCheckBox(
          form,
          "Check Box57",
          !!data.formData.suspendedPlatform.liveLoadNotExceed?.na
        );

        // Platform Properly Designed
        safeSetCheckBox(
          form,
          "Check Box58",
          !!data.formData.suspendedPlatform.platformPropDesigned?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box59",
          !!data.formData.suspendedPlatform.platformPropDesigned?.no
        );
        safeSetCheckBox(
          form,
          "Check Box60",
          !!data.formData.suspendedPlatform.platformPropDesigned?.na
        );

        // Components In Good Order
        safeSetCheckBox(
          form,
          "Check Box61",
          !!data.formData.suspendedPlatform.componentsInGoodOrder?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box62",
          !!data.formData.suspendedPlatform.componentsInGoodOrder?.no
        );
        safeSetCheckBox(
          form,
          "Check Box63",
          !!data.formData.suspendedPlatform.componentsInGoodOrder?.na
        );

        // Visible Welds Good
        safeSetCheckBox(
          form,
          "Check Box64",
          !!data.formData.suspendedPlatform.visibleWeldsGood?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box65",
          !!data.formData.suspendedPlatform.visibleWeldsGood?.no
        );
        safeSetCheckBox(
          form,
          "Check Box66",
          !!data.formData.suspendedPlatform.visibleWeldsGood?.na
        );

        // Wire Rope Properly Reeved
        safeSetCheckBox(
          form,
          "Check Box67",
          !!data.formData.suspendedPlatform.wireRopePropReeved?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box68",
          !!data.formData.suspendedPlatform.wireRopePropReeved?.no
        );
        safeSetCheckBox(
          form,
          "Check Box69",
          !!data.formData.suspendedPlatform.wireRopePropReeved?.na
        );

        // Mounting Holes Free
        safeSetCheckBox(
          form,
          "Check Box70",
          !!data.formData.suspendedPlatform.mountingHolesFree?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box71",
          !!data.formData.suspendedPlatform.mountingHolesFree?.no
        );
        safeSetCheckBox(
          form,
          "Check Box72",
          !!data.formData.suspendedPlatform.mountingHolesFree?.na
        );

        // Hardware Grade 5
        safeSetCheckBox(
          form,
          "Check Box73",
          !!data.formData.suspendedPlatform.hardwareGrade5?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box74",
          !!data.formData.suspendedPlatform.hardwareGrade5?.no
        );
        safeSetCheckBox(
          form,
          "Check Box75",
          !!data.formData.suspendedPlatform.hardwareGrade5?.na
        );

        // Stirrup Sheaves Good
        safeSetCheckBox(
          form,
          "Check Box76",
          !!data.formData.suspendedPlatform.stirrupSheavesGood?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box77",
          !!data.formData.suspendedPlatform.stirrupSheavesGood?.no
        );
        safeSetCheckBox(
          form,
          "Check Box78",
          !!data.formData.suspendedPlatform.stirrupSheavesGood?.na
        );

        // Platform Free Corrosion 1
        safeSetCheckBox(
          form,
          "Check Box79",
          !!data.formData.suspendedPlatform.platformFreeCorrosion1?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box80",
          !!data.formData.suspendedPlatform.platformFreeCorrosion1?.no
        );
        safeSetCheckBox(
          form,
          "Check Box81",
          !!data.formData.suspendedPlatform.platformFreeCorrosion1?.na
        );

        // Deck Free Debris
        safeSetCheckBox(
          form,
          "Check Box82",
          !!data.formData.suspendedPlatform.deckFreeDebris?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box83",
          !!data.formData.suspendedPlatform.deckFreeDebris?.no
        );
        safeSetCheckBox(
          form,
          "Check Box84",
          !!data.formData.suspendedPlatform.deckFreeDebris?.na
        );

        // Platform Free Corrosion 2
        safeSetCheckBox(
          form,
          "Check Box85",
          !!data.formData.suspendedPlatform.platformFreeCorrosion2?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box86",
          !!data.formData.suspendedPlatform.platformFreeCorrosion2?.no
        );
        safeSetCheckBox(
          form,
          "Check Box87",
          !!data.formData.suspendedPlatform.platformFreeCorrosion2?.na
        );

        // Safe Distance Power Lines
        safeSetCheckBox(
          form,
          "Check Box88",
          !!data.formData.suspendedPlatform.safeDistancePowerLines?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box89",
          !!data.formData.suspendedPlatform.safeDistancePowerLines?.no
        );
        safeSetCheckBox(
          form,
          "Check Box90",
          !!data.formData.suspendedPlatform.safeDistancePowerLines?.na
        );

        // Weather Conditions Acceptable
        safeSetCheckBox(
          form,
          "Check Box91",
          !!data.formData.suspendedPlatform.weatherConditionsAcceptable?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box92",
          !!data.formData.suspendedPlatform.weatherConditionsAcceptable?.no
        );
        safeSetCheckBox(
          form,
          "Check Box93",
          !!data.formData.suspendedPlatform.weatherConditionsAcceptable?.na
        );

        // Power Company Contacted
        safeSetCheckBox(
          form,
          "Check Box94",
          !!data.formData.suspendedPlatform.powerCompanyContacted?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box95",
          !!data.formData.suspendedPlatform.powerCompanyContacted?.no
        );
        safeSetCheckBox(
          form,
          "Check Box96",
          !!data.formData.suspendedPlatform.powerCompanyContacted?.na
        );
      }

      // Hoist, Wire Rope & Power
      if (data.formData.hoistWireRopePower) {
        // Hoists Properly Selected
        safeSetCheckBox(
          form,
          "Check Box97",
          !!data.formData.hoistWireRopePower.hoistsProperlySelected?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box98",
          !!data.formData.hoistWireRopePower.hoistsProperlySelected?.no
        );
        safeSetCheckBox(
          form,
          "Check Box99",
          !!data.formData.hoistWireRopePower.hoistsProperlySelected?.na
        );

        // Manufacturer Instructions
        safeSetCheckBox(
          form,
          "Check Box100",
          !!data.formData.hoistWireRopePower.manufacturerInstructions?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box101",
          !!data.formData.hoistWireRopePower.manufacturerInstructions?.no
        );
        safeSetCheckBox(
          form,
          "Check Box102",
          !!data.formData.hoistWireRopePower.manufacturerInstructions?.na
        );

        // Daily Tests Performed
        safeSetCheckBox(
          form,
          "Check Box103",
          !!data.formData.hoistWireRopePower.dailyTestsPerformed?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box104",
          !!data.formData.hoistWireRopePower.dailyTestsPerformed?.no
        );
        safeSetCheckBox(
          form,
          "Check Box105",
          !!data.formData.hoistWireRopePower.dailyTestsPerformed?.na
        );

        // Hoists Proper Working
        safeSetCheckBox(
          form,
          "Check Box106",
          !!data.formData.hoistWireRopePower.hoistsProperWorking?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box107",
          !!data.formData.hoistWireRopePower.hoistsProperWorking?.no
        );
        safeSetCheckBox(
          form,
          "Check Box108",
          !!data.formData.hoistWireRopePower.hoistsProperWorking?.na
        );

        // Cable Connections
        safeSetCheckBox(
          form,
          "Check Box109",
          !!data.formData.hoistWireRopePower.cableConnections?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box110",
          !!data.formData.hoistWireRopePower.cableConnections?.no
        );
        safeSetCheckBox(
          form,
          "Check Box111",
          !!data.formData.hoistWireRopePower.cableConnections?.na
        );

        // Power Supply Adequate
        safeSetCheckBox(
          form,
          "Check Box112",
          !!data.formData.hoistWireRopePower.powerSupplyAdequate?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box113",
          !!data.formData.hoistWireRopePower.powerSupplyAdequate?.no
        );
        safeSetCheckBox(
          form,
          "Check Box114",
          !!data.formData.hoistWireRopePower.powerSupplyAdequate?.na
        );

        // Wire Rope Inspected
        safeSetCheckBox(
          form,
          "Check Box115",
          !!data.formData.hoistWireRopePower.wireRopeInspected?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box116",
          !!data.formData.hoistWireRopePower.wireRopeInspected?.no
        );
        safeSetCheckBox(
          form,
          "Check Box117",
          !!data.formData.hoistWireRopePower.wireRopeInspected?.na
        );

        // Wire Rope Length
        safeSetCheckBox(
          form,
          "Check Box118",
          !!data.formData.hoistWireRopePower.wireRopeLength?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box119",
          !!data.formData.hoistWireRopePower.wireRopeLength?.no
        );
        safeSetCheckBox(
          form,
          "Check Box120",
          !!data.formData.hoistWireRopePower.wireRopeLength?.na
        );

        // Emergency Stop Works
        safeSetCheckBox(
          form,
          "Check Box121",
          !!data.formData.hoistWireRopePower.emergencyStopWorks?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box122",
          !!data.formData.hoistWireRopePower.emergencyStopWorks?.no
        );
        safeSetCheckBox(
          form,
          "Check Box123",
          !!data.formData.hoistWireRopePower.emergencyStopWorks?.na
        );

        // Controlled Descent Test
        safeSetCheckBox(
          form,
          "Check Box124",
          !!data.formData.hoistWireRopePower.controlledDescentTest?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box125",
          !!data.formData.hoistWireRopePower.controlledDescentTest?.no
        );
        safeSetCheckBox(
          form,
          "Check Box126",
          !!data.formData.hoistWireRopePower.controlledDescentTest?.na
        );
      }

      // Fall Protection System
      if (data.formData.fallProtectionSystem) {
        // Workers Use Fall Arrest
        safeSetCheckBox(
          form,
          "Check Box127",
          !!data.formData.fallProtectionSystem.workersUseFallArrest?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box128",
          !!data.formData.fallProtectionSystem.workersUseFallArrest?.no
        );
        safeSetCheckBox(
          form,
          "Check Box129",
          !!data.formData.fallProtectionSystem.workersUseFallArrest?.na
        );

        // Rope Grab Installed
        safeSetCheckBox(
          form,
          "Check Box130",
          !!data.formData.fallProtectionSystem.ropeGrabInstalled?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box131",
          !!data.formData.fallProtectionSystem.ropeGrabInstalled?.no
        );
        safeSetCheckBox(
          form,
          "Check Box132",
          !!data.formData.fallProtectionSystem.ropeGrabInstalled?.na
        );

        // Shock Absorbing Lanyard
        safeSetCheckBox(
          form,
          "Check Box133",
          !!data.formData.fallProtectionSystem.shockAbsorbingLanyard?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box134",
          !!data.formData.fallProtectionSystem.shockAbsorbingLanyard?.no
        );
        safeSetCheckBox(
          form,
          "Check Box135",
          !!data.formData.fallProtectionSystem.shockAbsorbingLanyard?.na
        );

        // Full Body Harness
        safeSetCheckBox(
          form,
          "Check Box136",
          !!data.formData.fallProtectionSystem.fullBodyHarness?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box137",
          !!data.formData.fallProtectionSystem.fullBodyHarness?.no
        );
        safeSetCheckBox(
          form,
          "Check Box138",
          !!data.formData.fallProtectionSystem.fullBodyHarness?.na
        );

        // Vertical Lifeline
        safeSetCheckBox(
          form,
          "Check Box139",
          !!data.formData.fallProtectionSystem.verticalLifeline?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box140",
          !!data.formData.fallProtectionSystem.verticalLifeline?.no
        );
        safeSetCheckBox(
          form,
          "Check Box141",
          !!data.formData.fallProtectionSystem.verticalLifeline?.na
        );

        // Fall Arrest Unguarded Areas
        safeSetCheckBox(
          form,
          "Check Box142",
          !!data.formData.fallProtectionSystem.fallArrestUnguardedAreas?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box143",
          !!data.formData.fallProtectionSystem.fallArrestUnguardedAreas?.no
        );
        safeSetCheckBox(
          form,
          "Check Box144",
          !!data.formData.fallProtectionSystem.fallArrestUnguardedAreas?.na
        );

        // Emergency Rescue Plan
        safeSetCheckBox(
          form,
          "Check Box145",
          !!data.formData.fallProtectionSystem.emergencyRescuePlan?.yes
        );
        safeSetCheckBox(
          form,
          "Check Box146",
          !!data.formData.fallProtectionSystem.emergencyRescuePlan?.no
        );
        safeSetCheckBox(
          form,
          "Check Box147",
          !!data.formData.fallProtectionSystem.emergencyRescuePlan?.na
        );
      }

      // Comment Items
      if (
        data.formData.commentItems &&
        Array.isArray(data.formData.commentItems)
      ) {
        // In the PDF, there are 5 comment rows
        data.formData.commentItems.forEach(
          (item: { comment: string }, index: number) => {
            if (index < 5) {
              const commentField = `Text${7 + index}`;
              safeSetTextField(form, commentField, item.comment || "");
            }
          }
        );
      }
    } else if (data.formName === "Lanyard-Inspection") {
      // Basic Information
      safeSetTextField(form, "Text1", data.formData.manufacturer || "");
      safeSetTextField(
        form,
        "Text2",
        formatDate(data.formData.dateOfManufacture)
      );
      safeSetTextField(form, "Text3", data.formData.serialNumber || "");
      safeSetTextField(form, "Text4", data.formData.modelNumber || "");
      safeSetTextField(form, "Text5", data.formData.typeMaterial || "");
      safeSetTextField(form, "Text6", formatDate(data.formData.inspectionDate));
      safeSetTextField(form, "Text7", formatDate(data.formData.inServiceDate));
      safeSetTextField(form, "Text8", data.formData.authorizedPerson || "");
      safeSetTextField(form, "Text9", data.formData.competentPerson || "");

      // Labels & Markings
      if (data.formData.labelsAndMarkings) {
        // Label
        safeSetCheckBox(
          form,
          "Check Box1",
          !!data.formData.labelsAndMarkings.label?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box2",
          !!data.formData.labelsAndMarkings.label?.fail
        );
        safeSetTextField(
          form,
          "Text10",
          data.formData.labelsAndMarkings.label?.note || ""
        );

        // ANSI/OSHA Markings
        safeSetCheckBox(
          form,
          "Check Box3",
          !!data.formData.labelsAndMarkings.markings?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box4",
          !!data.formData.labelsAndMarkings.markings?.fail
        );
        safeSetTextField(
          form,
          "Text11",
          data.formData.labelsAndMarkings.markings?.note || ""
        );

        // Date of First Use
        safeSetCheckBox(
          form,
          "Check Box5",
          !!data.formData.labelsAndMarkings.dateOfFirstUse?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box6",
          !!data.formData.labelsAndMarkings.dateOfFirstUse?.fail
        );
        safeSetTextField(
          form,
          "Text12",
          data.formData.labelsAndMarkings.dateOfFirstUse?.note || ""
        );

        // Inspections Current
        safeSetCheckBox(
          form,
          "Check Box7",
          !!data.formData.labelsAndMarkings.inspectionsCurrent?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box8",
          !!data.formData.labelsAndMarkings.inspectionsCurrent?.fail
        );
        safeSetTextField(
          form,
          "Text13",
          data.formData.labelsAndMarkings.inspectionsCurrent?.note || ""
        );
      }

      // Connectors
      if (data.formData.connectors) {
        // Connector
        safeSetCheckBox(
          form,
          "Check Box9",
          !!data.formData.connectors.connector?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box10",
          !!data.formData.connectors.connector?.fail
        );
        safeSetTextField(
          form,
          "Text14",
          data.formData.connectors.connector?.note || ""
        );

        // Hook Gate / Rivets
        safeSetCheckBox(
          form,
          "Check Box11",
          !!data.formData.connectors.hookGateRivets?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box12",
          !!data.formData.connectors.hookGateRivets?.fail
        );
        safeSetTextField(
          form,
          "Text15",
          data.formData.connectors.hookGateRivets?.note || ""
        );

        // Corrosion
        safeSetCheckBox(
          form,
          "Check Box13",
          !!data.formData.connectors.corrosion?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box14",
          !!data.formData.connectors.corrosion?.fail
        );
        safeSetTextField(
          form,
          "Text16",
          data.formData.connectors.corrosion?.note || ""
        );

        // Pitting / Nicks
        safeSetCheckBox(
          form,
          "Check Box15",
          !!data.formData.connectors.pittingNicks?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box16",
          !!data.formData.connectors.pittingNicks?.fail
        );
        safeSetTextField(
          form,
          "Text17",
          data.formData.connectors.pittingNicks?.note || ""
        );
      }

      // Material (Web or Cable)
      if (data.formData.material) {
        // Broken / Missing / Loose Stitching
        safeSetCheckBox(
          form,
          "Check Box17",
          !!data.formData.material.brokenStitching?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box18",
          !!data.formData.material.brokenStitching?.fail
        );
        safeSetTextField(
          form,
          "Text18",
          data.formData.material.brokenStitching?.note || ""
        );

        // Termination
        safeSetCheckBox(
          form,
          "Check Box19",
          !!data.formData.material.termination?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box20",
          !!data.formData.material.termination?.fail
        );
        safeSetTextField(
          form,
          "Text19",
          data.formData.material.termination?.note || ""
        );

        // Webbing Length
        safeSetCheckBox(
          form,
          "Check Box21",
          !!data.formData.material.webbingLength?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box22",
          !!data.formData.material.webbingLength?.fail
        );
        safeSetTextField(
          form,
          "Text20",
          data.formData.material.webbingLength?.note || ""
        );

        // Cuts / Burns / Holes / Paint Damage
        safeSetCheckBox(
          form,
          "Check Box23",
          !!data.formData.material.cutsBurns?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box24",
          !!data.formData.material.cutsBurns?.fail
        );
        safeSetTextField(
          form,
          "Text21",
          data.formData.material.cutsBurns?.note || ""
        );

        // Cable Separating / Bird-Caging
        safeSetCheckBox(
          form,
          "Check Box25",
          !!data.formData.material.cableSeparating?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box26",
          !!data.formData.material.cableSeparating?.fail
        );
        safeSetTextField(
          form,
          "Text22",
          data.formData.material.cableSeparating?.note || ""
        );
      }

      // Shock Pack
      if (data.formData.shockPack) {
        // Cover / Shrink Tube
        safeSetCheckBox(
          form,
          "Check Box27",
          !!data.formData.shockPack.coverShrinkTube?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box28",
          !!data.formData.shockPack.coverShrinkTube?.fail
        );
        safeSetTextField(
          form,
          "Text23",
          data.formData.shockPack.coverShrinkTube?.note || ""
        );

        // Damage / Fraying / Broken Stitching
        safeSetCheckBox(
          form,
          "Check Box29",
          !!data.formData.shockPack.damageFraying?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box30",
          !!data.formData.shockPack.damageFraying?.fail
        );
        safeSetTextField(
          form,
          "Text24",
          data.formData.shockPack.damageFraying?.note || ""
        );

        // Impact Indicator
        safeSetCheckBox(
          form,
          "Check Box31",
          !!data.formData.shockPack.impactIndicator?.pass
        );
        safeSetCheckBox(
          form,
          "Check Box32",
          !!data.formData.shockPack.impactIndicator?.fail
        );
        safeSetTextField(
          form,
          "Text25",
          data.formData.shockPack.impactIndicator?.note || ""
        );
      }

      // Additional Notes
      safeSetTextField(form, "Text26", data.formData.additionalNotes || "");
    } else if (data.formName === "Accident-Incident-Report") {
      // Accident Classification
      if (data.formData.accidentClassification) {
        safeSetCheckBox(
          form,
          "Check Box1",
          !!data.formData.accidentClassification.injury
        );
        safeSetCheckBox(
          form,
          "Check Box2",
          !!data.formData.accidentClassification.illness
        );
        safeSetCheckBox(
          form,
          "Check Box3",
          !!data.formData.accidentClassification.fatality
        );
        safeSetCheckBox(
          form,
          "Check Box4",
          !!data.formData.accidentClassification.propertyDamage
        );
        safeSetCheckBox(
          form,
          "Check Box5",
          !!data.formData.accidentClassification.environment
        );
        safeSetCheckBox(
          form,
          "Check Box6",
          !!data.formData.accidentClassification.proceduralIssues
        );
        safeSetCheckBox(
          form,
          "Check Box7",
          !!data.formData.accidentClassification.other
        );
        safeSetTextField(
          form,
          "Text1",
          data.formData.accidentClassification.otherDescription || ""
        );
      }

      // Day and Date of accident
      if (data.formData.dayOfAccident) {
        safeSetCheckBox(form, "Check Box8", !!data.formData.dayOfAccident.m);
        safeSetCheckBox(form, "Check Box9", !!data.formData.dayOfAccident.t);
        safeSetCheckBox(form, "Check Box10", !!data.formData.dayOfAccident.w);
        safeSetCheckBox(form, "Check Box11", !!data.formData.dayOfAccident.th);
        safeSetCheckBox(form, "Check Box12", !!data.formData.dayOfAccident.f);
        safeSetCheckBox(form, "Check Box13", !!data.formData.dayOfAccident.s);
        safeSetCheckBox(form, "Check Box14", !!data.formData.dayOfAccident.su);
        // Format the date for the PDF
        if (data.formData.dayOfAccident.date) {
          safeSetTextField(
            form,
            "Text3",
            formatDate(data.formData.dayOfAccident.date)
          );
        }
      }

      // This report is made by
      if (data.formData.reportMadeBy) {
        safeSetCheckBox(
          form,
          "Check Box15",
          !!data.formData.reportMadeBy.employee
        );
        safeSetCheckBox(
          form,
          "Check Box16",
          !!data.formData.reportMadeBy.superintendent
        );
        safeSetCheckBox(
          form,
          "Check Box17",
          !!data.formData.reportMadeBy.management
        );
        safeSetCheckBox(
          form,
          "Check Box18",
          !!data.formData.reportMadeBy.finalReport
        );
      }

      // First reported info
      safeSetTextField(form, "Text2", data.formData.firstReportedTo || "");
      if (data.formData.dateFirstReported) {
        safeSetTextField(
          form,
          "Text3",
          formatDate(data.formData.dateFirstReported)
        );
      }

      // Step 1: Personal Information - Injured Employee
      if (data.formData.personalInfo) {
        safeSetTextField(form, "Text4", data.formData.personalInfo.name || "");

        // Sex
        if (data.formData.personalInfo.sex === "Male") {
          safeSetCheckBox(form, "Check Box19", true);
        } else if (data.formData.personalInfo.sex === "Female") {
          safeSetCheckBox(form, "Check Box20", true);
        }

        safeSetTextField(form, "Text5", data.formData.personalInfo.age || "");
        safeSetTextField(
          form,
          "Text6",
          data.formData.personalInfo.employedBy || ""
        );
        safeSetTextField(
          form,
          "Text7",
          data.formData.personalInfo.jobTitle || ""
        );

        // Nature of injury
        if (data.formData.personalInfo.natureOfInjury) {
          safeSetCheckBox(
            form,
            "Check Box21",
            !!data.formData.personalInfo.natureOfInjury.abrasionScrapes
          );
          safeSetCheckBox(
            form,
            "Check Box22",
            !!data.formData.personalInfo.natureOfInjury.amputation
          );
          safeSetCheckBox(
            form,
            "Check Box23",
            !!data.formData.personalInfo.natureOfInjury.brokenBone
          );
          safeSetCheckBox(
            form,
            "Check Box24",
            !!data.formData.personalInfo.natureOfInjury.bruise
          );
          safeSetCheckBox(
            form,
            "Check Box25",
            !!data.formData.personalInfo.natureOfInjury.burnHeat
          );
          safeSetCheckBox(
            form,
            "Check Box26",
            !!data.formData.personalInfo.natureOfInjury.burnChemical
          );
          safeSetCheckBox(
            form,
            "Check Box27",
            !!data.formData.personalInfo.natureOfInjury.concussion
          );
          safeSetCheckBox(
            form,
            "Check Box28",
            !!data.formData.personalInfo.natureOfInjury.crushingInjury
          );
          safeSetCheckBox(
            form,
            "Check Box29",
            !!data.formData.personalInfo.natureOfInjury.cutLacerationPuncture
          );
          safeSetCheckBox(
            form,
            "Check Box30",
            !!data.formData.personalInfo.natureOfInjury.hernia
          );
          safeSetCheckBox(
            form,
            "Check Box31",
            !!data.formData.personalInfo.natureOfInjury.illness
          );
          safeSetCheckBox(
            form,
            "Check Box32",
            !!data.formData.personalInfo.natureOfInjury.sprainStrain
          );
          safeSetCheckBox(
            form,
            "Check Box33",
            !!data.formData.personalInfo.natureOfInjury.damageToBodySystem
          );
          safeSetCheckBox(
            form,
            "Check Box34",
            !!data.formData.personalInfo.natureOfInjury.other
          );
          safeSetTextField(
            form,
            "Text9",
            data.formData.personalInfo.natureOfInjury.otherDescription || ""
          );
        }

        // Employee works
        if (data.formData.personalInfo.employeeWorks) {
          safeSetCheckBox(
            form,
            "Check Box35",
            !!data.formData.personalInfo.employeeWorks.regularFullTime
          );
          safeSetCheckBox(
            form,
            "Check Box36",
            !!data.formData.personalInfo.employeeWorks.regularPartTime
          );
          safeSetCheckBox(
            form,
            "Check Box37",
            !!data.formData.personalInfo.employeeWorks.seasonal
          );
          safeSetCheckBox(
            form,
            "Check Box38",
            !!data.formData.personalInfo.employeeWorks.temporary
          );
        }

        safeSetTextField(
          form,
          "Text8",
          data.formData.personalInfo.superintendentName || ""
        );
        safeSetTextField(
          form,
          "Text9",
          data.formData.personalInfo.wasPersonTrained || ""
        );
        safeSetTextField(
          form,
          "Text10",
          data.formData.personalInfo.trainingType || ""
        );
      }

      // Step 2: Witness Information
      if (
        data.formData.witnessInfo &&
        Array.isArray(data.formData.witnessInfo)
      ) {
        // Witness 1
        if (data.formData.witnessInfo[0]) {
          safeSetTextField(
            form,
            "Text13",
            data.formData.witnessInfo[0].name || ""
          );
          safeSetTextField(
            form,
            "Text14",
            data.formData.witnessInfo[0].jobTitle || ""
          );
          safeSetTextField(
            form,
            "Text16",
            data.formData.witnessInfo[0].employedBy || ""
          );
          safeSetTextField(
            form,
            "Text17",
            data.formData.witnessInfo[0].supervisorName || ""
          );
        }

        // Witness 2
        if (data.formData.witnessInfo[1]) {
          safeSetTextField(
            form,
            "Text18",
            data.formData.witnessInfo[1].name || ""
          );
          safeSetTextField(
            form,
            "Text19",
            data.formData.witnessInfo[1].jobTitle || ""
          );
          safeSetTextField(
            form,
            "Text20",
            data.formData.witnessInfo[1].employedBy || ""
          );
          safeSetTextField(
            form,
            "Text21",
            data.formData.witnessInfo[1].supervisorName || ""
          );
        }
      }

      // Site secured
      if (data.formData.siteSecured === "Yes") {
        safeSetCheckBox(form, "Check Box39", true);
      } else if (data.formData.siteSecured === "No") {
        safeSetCheckBox(form, "Check Box40", true);
      }

      safeSetTextField(form, "Text22", data.formData.securedBy || "");

      // Step 3: Accident Description
      if (data.formData.accidentDescription) {
        safeSetTextField(
          form,
          "Text23",
          data.formData.accidentDescription.exactLocation || ""
        );
        safeSetTextField(
          form,
          "Text24",
          data.formData.accidentDescription.jobNameNumber || ""
        );
        safeSetTextField(
          form,
          "Text25",
          data.formData.accidentDescription.exactTime || ""
        );

        // Workday part
        if (data.formData.accidentDescription.workdayPart) {
          safeSetCheckBox(
            form,
            "Check Box41",
            !!data.formData.accidentDescription.workdayPart.enteringLeaving
          );
          safeSetCheckBox(
            form,
            "Check Box42",
            !!data.formData.accidentDescription.workdayPart.normalWork
          );
          safeSetCheckBox(
            form,
            "Check Box43",
            !!data.formData.accidentDescription.workdayPart.mealPeriod
          );
          safeSetCheckBox(
            form,
            "Check Box44",
            !!data.formData.accidentDescription.workdayPart.duringBreak
          );
          safeSetCheckBox(
            form,
            "Check Box45",
            !!data.formData.accidentDescription.workdayPart.overtime
          );
          safeSetCheckBox(
            form,
            "Check Box46",
            !!data.formData.accidentDescription.workdayPart.other
          );
        }

        fillMultiLineField(
          form,
          "description1",
          data.formData.accidentDescription.description || ""
        );
        fillMultiLineField(
          form,
          "description2",
          data.formData.accidentDescription.equipmentInvolved || ""
        );
        fillMultiLineField(
          form,
          "description3",
          data.formData.accidentDescription.equipmentInvolved || ""
        );
        fillMultiLineField(
          form,
          "description4",
          data.formData.accidentDescription.equipmentInvolved || ""
        );
        fillMultiLineField(
          form,
          "description5",
          data.formData.accidentDescription.equipmentInvolved || ""
        );
        fillMultiLineField(
          form,
          "description6",
          data.formData.accidentDescription.equipmentInvolved || ""
        );
      }

      // Step 4: Why did the accident happen?
      // Unsafe workplace conditions
      if (data.formData.accidentCauses?.unsafeConditions) {
        safeSetCheckBox(
          form,
          "Check Box47",
          !!data.formData.accidentCauses.unsafeConditions.inadequateGuard
        );
        safeSetCheckBox(
          form,
          "Check Box48",
          !!data.formData.accidentCauses.unsafeConditions.unguardedHazard
        );
        safeSetCheckBox(
          form,
          "Check Box49",
          !!data.formData.accidentCauses.unsafeConditions.safetyDeviceDefective
        );
        safeSetCheckBox(
          form,
          "Check Box50",
          !!data.formData.accidentCauses.unsafeConditions.toolEquipmentDefective
        );
        safeSetCheckBox(
          form,
          "Check Box51",
          !!data.formData.accidentCauses.unsafeConditions.workstationHazardous
        );
        safeSetCheckBox(
          form,
          "Check Box52",
          !!data.formData.accidentCauses.unsafeConditions.unsafeLighting
        );
        safeSetCheckBox(
          form,
          "Check Box53",
          !!data.formData.accidentCauses.unsafeConditions.unsafeVentilation
        );
        safeSetCheckBox(
          form,
          "Check Box54",
          !!data.formData.accidentCauses.unsafeConditions.lackOfPpe
        );
        safeSetCheckBox(
          form,
          "Check Box55",
          !!data.formData.accidentCauses.unsafeConditions.lackOfEquipment
        );
        safeSetCheckBox(
          form,
          "Check Box56",
          !!data.formData.accidentCauses.unsafeConditions.unsafeClothing
        );
        safeSetCheckBox(
          form,
          "Check Box57",
          !!data.formData.accidentCauses.unsafeConditions.insufficientTraining
        );
        safeSetCheckBox(
          form,
          "Check Box58",
          !!data.formData.accidentCauses.unsafeConditions.other
        );
        safeSetTextField(
          form,
          "Text53",
          data.formData.accidentCauses.unsafeConditions.otherDescription || ""
        );
      }

      // Unsafe acts
      if (data.formData.accidentCauses?.unsafeActs) {
        safeSetCheckBox(
          form,
          "Check Box59",
          !!data.formData.accidentCauses.unsafeActs.operatingWithoutPermission
        );
        safeSetCheckBox(
          form,
          "Check Box60",
          !!data.formData.accidentCauses.unsafeActs.operatingUnsafeSpeed
        );
        safeSetCheckBox(
          form,
          "Check Box61",
          !!data.formData.accidentCauses.unsafeActs.servicingPoweredEquipment
        );
        safeSetCheckBox(
          form,
          "Check Box62",
          !!data.formData.accidentCauses.unsafeActs.safetyDeviceInoperative
        );
        safeSetCheckBox(
          form,
          "Check Box63",
          !!data.formData.accidentCauses.unsafeActs.usingDefectiveEquipment
        );
        safeSetCheckBox(
          form,
          "Check Box64",
          !!data.formData.accidentCauses.unsafeActs.usingEquipmentImproperly
        );
        safeSetCheckBox(
          form,
          "Check Box65",
          !!data.formData.accidentCauses.unsafeActs.unsafeLifting
        );
        safeSetCheckBox(
          form,
          "Check Box66",
          !!data.formData.accidentCauses.unsafeActs.unsafePosition
        );
        safeSetCheckBox(
          form,
          "Check Box67",
          !!data.formData.accidentCauses.unsafeActs.distractionHorseplay
        );
        safeSetCheckBox(
          form,
          "Check Box68",
          !!data.formData.accidentCauses.unsafeActs.failureToWearPpe
        );
        safeSetCheckBox(
          form,
          "Check Box69",
          !!data.formData.accidentCauses.unsafeActs.failureToUseEquipment
        );
        safeSetCheckBox(
          form,
          "Check Box70",
          !!data.formData.accidentCauses.unsafeActs.other
        );
        safeSetTextField(
          form,
          "Text54",
          data.formData.accidentCauses.unsafeActs.otherDescription || ""
        );
      }

      // Why questions
      fillMultiLineField(
        form,
        "description7",
        data.formData.accidentDescription.equipmentInvolved || ""
      );
      fillMultiLineField(
        form,
        "description8",
        data.formData.accidentDescription.equipmentInvolved || ""
      );

      // Reward for unsafe acts
      if (data.formData.accidentCauses?.rewardForUnsafeActs === "Yes") {
        safeSetCheckBox(form, "Check Box71", true);
      } else if (data.formData.accidentCauses?.rewardForUnsafeActs === "No") {
        safeSetCheckBox(form, "Check Box72", true);
      }

      fillMultiLineField(
        form,
        "description9",
        data.formData.accidentDescription.equipmentInvolved || ""
      );

      // Page 4 questions
      // Unsafe acts reported prior
      if (data.formData.accidentCauses?.unsafeActsReportedPrior === "Yes") {
        safeSetCheckBox(form, "Check Box73", true);
      } else if (
        data.formData.accidentCauses?.unsafeActsReportedPrior === "No"
      ) {
        safeSetCheckBox(form, "Check Box74", true);
      }
      fillMultiLineField(
        form,
        "description10",
        data.formData.accidentDescription.equipmentInvolved || ""
      );

      // Similar accidents prior
      if (data.formData.accidentCauses?.similarAccidentsPrior === "Yes") {
        safeSetCheckBox(form, "Check Box75", true);
      } else if (data.formData.accidentCauses?.similarAccidentsPrior === "No") {
        safeSetCheckBox(form, "Check Box76", true);
      }

      fillMultiLineField(
        form,
        "description11",
        data.formData.accidentDescription.equipmentInvolved || ""
      );

      // Step 5: OSHA Information
      if (data.formData.oshaInfo) {
        safeSetTextField(
          form,
          "Text82",
          data.formData.oshaInfo.dateNotified
            ? formatDate(data.formData.oshaInfo.dateNotified)
            : ""
        );
        safeSetTextField(
          form,
          "Text83",
          data.formData.oshaInfo.investigationDates || ""
        );
        safeSetTextField(
          form,
          "Text84",
          data.formData.oshaInfo.citationDate
            ? formatDate(data.formData.oshaInfo.citationDate)
            : ""
        );
        safeSetTextField(
          form,
          "Text85",
          data.formData.oshaInfo.penaltyAmount || ""
        );
      }

      // Step 6: Report Preparer
      if (data.formData.reportPreparer) {
        safeSetTextField(
          form,
          "Text86",
          data.formData.reportPreparer.name || ""
        );
        safeSetTextField(
          form,
          "Text87",
          data.formData.reportPreparer.dateOfReport
            ? formatDate(data.formData.reportPreparer.dateOfReport)
            : ""
        );
        safeSetTextField(
          form,
          "Text88",
          data.formData.reportPreparer.title || ""
        );
        safeSetTextField(
          form,
          "Text89",
          data.formData.reportPreparer.employer || ""
        );
        safeSetTextField(
          form,
          "Text90",
          data.formData.reportPreparer.phoneNumber || ""
        );
      }
      // Draw injury markers on body diagrams
      if (
        data.formData.personalInfo?.bodyMarkers &&
        data.formData.personalInfo?.bodyMarkers.length > 0
      ) {
        const page = pdfDoc.getPage(0); // Assuming body diagram is on the first page
        const { width, height } = page.getSize();
        // You would need to know the exact position and dimensions of your body diagrams in the PDF
        const frontDiagramBounds = { x: 38, y: 290, width: 100, height: 220 }; // Example values
        const backDiagramBounds = { x: 139, y: 295, width: 100, height: 215 }; // Example values

        // Draw each marker
        data.formData.personalInfo.bodyMarkers.forEach(
          (marker: { view: string; x: number; y: number }) => {
            const diagramBounds =
              marker.view === "front" ? frontDiagramBounds : backDiagramBounds;
            const markerX =
              diagramBounds.x + (marker.x / 100) * diagramBounds.width;
            const markerY =
              diagramBounds.y + (marker.y / 100) * diagramBounds.height;

            // Draw a red circle at the marker position
            console.log("Drawing marker at:", markerX, markerY);
            page.drawCircle({
              x: markerX,
              y: height - markerY, // PDF coordinates start from bottom-left
              size: 3,
              color: rgb(1, 0, 0), // Red
              opacity: 1,
            });
          }
        );
      }
    } else if (data.formName === "Jobsite-Safety-Inspection") {
      //jobsite-safety-inspection
      // Project information
      safeSetTextField(form, "Text1", data.formData.projectName || ""); // Project Name
      safeSetTextField(form, "Text2", data.dateCreated || ""); // Date
      safeSetTextField(form, "Text3", data.formData.address || ""); // Address
      safeSetTextField(form, "Text4", data.formData.jobNumber || ""); // Job #
      safeSetTextField(form, "Text5", data.formData.superintendent || ""); // Superintendent
      safeSetTextField(form, "Text6", data.formData.weather || ""); // Weather

      // Notes field
      safeSetTextField(form, "Text11", data.formData.notes || "");

      // Corrective Actions (5 rows, each with item number, date, and action)
      if (
        data.formData.correctiveActions &&
        data.formData.correctiveActions.length > 0
      ) {
        let textFieldIndex = 17;
        for (
          let i = 0;
          i < Math.min(data.formData.correctiveActions.length, 7);
          i++
        ) {
          const action = data.formData.correctiveActions[i];
          if (action) {
            console.log("text field index", textFieldIndex);
            console.log("action item number", action.itemNumber);
            form
              .getTextField(`Text${textFieldIndex++}`)
              .setText(action.itemNumber || "");
            form
              .getTextField(`Text${textFieldIndex++}`)
              .setText(action.dateCorrected || "");
            form
              .getTextField(`Text${textFieldIndex++}`)
              .setText(action.actionTaken || "");
            textFieldIndex++; // Skip empty row
            textFieldIndex++; // Skip empty row
            textFieldIndex++; // Skip empty row
          } else {
            textFieldIndex += 3; // Skip empty rows
          }
        }
      }

      // Project information repeated on page 2
      safeSetTextField(form, "Text13", data.formData.projectName || ""); // Project Name on page 2
      safeSetTextField(form, "Text14", data.dateCreated || ""); // Date on page 2
      safeSetTextField(form, "Text15", data.formData.superintendent || ""); // Superintendent on page 2
      safeSetTextField(form, "Text16", data.formData.jobNumber || ""); // Job # on page 2

      // Safety Checklist Items
      // Item 1: Toolbox Safety Meetings
      safeSetCheckBox(
        form,
        "Check Box1",
        !!data.formData.safetyItems.toolboxMeetings?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box2",
        !!data.formData.safetyItems.toolboxMeetings?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box3",
        !!data.formData.safetyItems.toolboxMeetings?.notApplicable
      );

      // Item 2: Safety Program
      safeSetCheckBox(
        form,
        "Check Box4",
        !!data.formData.safetyItems.safetyProgram?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box5",
        !!data.formData.safetyItems.safetyProgram?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box6",
        !!data.formData.safetyItems.safetyProgram?.notApplicable
      );

      // Item 3: Heat Illness Prevention
      safeSetCheckBox(
        form,
        "Check Box7",
        !!data.formData.safetyItems.heatIllnessPrevention?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box8",
        !!data.formData.safetyItems.heatIllnessPrevention?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box9",
        !!data.formData.safetyItems.heatIllnessPrevention?.notApplicable
      );

      // Item 4: Emergency Evacuation
      safeSetCheckBox(
        form,
        "Check Box10",
        !!data.formData.safetyItems.emergencyEvacuation?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box11",
        !!data.formData.safetyItems.emergencyEvacuation?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box12",
        !!data.formData.safetyItems.emergencyEvacuation?.notApplicable
      );

      // Item 5: First Aid
      safeSetCheckBox(
        form,
        "Check Box13",
        !!data.formData.safetyItems.firstAid?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box14",
        !!data.formData.safetyItems.firstAid?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box15",
        !!data.formData.safetyItems.firstAid?.notApplicable
      );

      // Item 6: Hazard Communication
      safeSetCheckBox(
        form,
        "Check Box16",
        !!data.formData.safetyItems.hazardCommunication?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box17",
        !!data.formData.safetyItems.hazardCommunication?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box18",
        !!data.formData.safetyItems.hazardCommunication?.notApplicable
      );

      // Item 7: PPE
      safeSetCheckBox(
        form,
        "Check Box19",
        !!data.formData.safetyItems.ppe?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box20",
        !!data.formData.safetyItems.ppe?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box21",
        !!data.formData.safetyItems.ppe?.notApplicable
      );

      // Item 8: Scaffolds
      safeSetCheckBox(
        form,
        "Check Box22",
        !!data.formData.safetyItems.scaffolds?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box23",
        !!data.formData.safetyItems.scaffolds?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box24",
        !!data.formData.safetyItems.scaffolds?.notApplicable
      );

      // Item 9: Housekeeping
      safeSetCheckBox(
        form,
        "Check Box25",
        !!data.formData.safetyItems.housekeeping?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box26",
        !!data.formData.safetyItems.housekeeping?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box27",
        !!data.formData.safetyItems.housekeeping?.notApplicable
      );

      // Item 10: Mobile Elevating Platforms
      safeSetCheckBox(
        form,
        "Check Box28",
        !!data.formData.safetyItems.mobileElevatingPlatforms?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box29",
        !!data.formData.safetyItems.mobileElevatingPlatforms?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box30",
        !!data.formData.safetyItems.mobileElevatingPlatforms?.notApplicable
      );

      // Item 11: Fall Protection
      safeSetCheckBox(
        form,
        "Check Box31",
        !!data.formData.safetyItems.fallProtection?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box32",
        !!data.formData.safetyItems.fallProtection?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box33",
        !!data.formData.safetyItems.fallProtection?.notApplicable
      );

      // Item 12: Ladders/Stairways
      safeSetCheckBox(
        form,
        "Check Box34",
        !!data.formData.safetyItems.laddersStairways?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box35",
        !!data.formData.safetyItems.laddersStairways?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box36",
        !!data.formData.safetyItems.laddersStairways?.notApplicable
      );

      // Item 13: Fire Safety
      safeSetCheckBox(
        form,
        "Check Box37",
        !!data.formData.safetyItems.fireSafety?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box38",
        !!data.formData.safetyItems.fireSafety?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box39",
        !!data.formData.safetyItems.fireSafety?.notApplicable
      );

      // Item 14: Lockout/Tagout
      safeSetCheckBox(
        form,
        "Check Box40",
        !!data.formData.safetyItems.lockoutTagout?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box41",
        !!data.formData.safetyItems.lockoutTagout?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box42",
        !!data.formData.safetyItems.lockoutTagout?.notApplicable
      );

      // Item 15: Electrical Safety
      safeSetCheckBox(
        form,
        "Check Box43",
        !!data.formData.safetyItems.electricalSafety?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box44",
        !!data.formData.safetyItems.electricalSafety?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box45",
        !!data.formData.safetyItems.electricalSafety?.notApplicable
      );

      // Item 16: Flammable Liquids
      safeSetCheckBox(
        form,
        "Check Box46",
        !!data.formData.safetyItems.flammableLiquids?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box47",
        !!data.formData.safetyItems.flammableLiquids?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box48",
        !!data.formData.safetyItems.flammableLiquids?.notApplicable
      );

      // Item 17: Hot Work Operations
      safeSetCheckBox(
        form,
        "Check Box49",
        !!data.formData.safetyItems.hotWorkOperations?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box50",
        !!data.formData.safetyItems.hotWorkOperations?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box51",
        !!data.formData.safetyItems.hotWorkOperations?.notApplicable
      );

      // Item 18: Power Tools
      safeSetCheckBox(
        form,
        "Check Box52",
        !!data.formData.safetyItems.powerTools?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box53",
        !!data.formData.safetyItems.powerTools?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box54",
        !!data.formData.safetyItems.powerTools?.notApplicable
      );

      // Item 19: Forklift Operations
      safeSetCheckBox(
        form,
        "Check Box55",
        !!data.formData.safetyItems.forkliftOperations?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box56",
        !!data.formData.safetyItems.forkliftOperations?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box57",
        !!data.formData.safetyItems.forkliftOperations?.notApplicable
      );

      // Item 20: Cranes
      safeSetCheckBox(
        form,
        "Check Box58",
        !!data.formData.safetyItems.cranes?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box59",
        !!data.formData.safetyItems.cranes?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box60",
        !!data.formData.safetyItems.cranes?.notApplicable
      );

      // Item 21: Rigging Equipment
      safeSetCheckBox(
        form,
        "Check Box61",
        !!data.formData.safetyItems.riggingEquipment?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box62",
        !!data.formData.safetyItems.riggingEquipment?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box63",
        !!data.formData.safetyItems.riggingEquipment?.notApplicable
      );

      // Item 22: Confined Space
      safeSetCheckBox(
        form,
        "Check Box64",
        !!data.formData.safetyItems.confinedSpace?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box65",
        !!data.formData.safetyItems.confinedSpace?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box66",
        !!data.formData.safetyItems.confinedSpace?.notApplicable
      );

      // Item 23: Public Protection
      safeSetCheckBox(
        form,
        "Check Box67",
        !!data.formData.safetyItems.publicProtection?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box68",
        !!data.formData.safetyItems.publicProtection?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box69",
        !!data.formData.safetyItems.publicProtection?.notApplicable
      );

      // Item 24: Excavation/Trenching
      safeSetCheckBox(
        form,
        "Check Box70",
        !!data.formData.safetyItems.excavationTrenching?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box71",
        !!data.formData.safetyItems.excavationTrenching?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box72",
        !!data.formData.safetyItems.excavationTrenching?.notApplicable
      );

      // Item 25: Other
      safeSetCheckBox(
        form,
        "Check Box73",
        !!data.formData.safetyItems.other?.satisfactory
      );
      safeSetCheckBox(
        form,
        "Check Box74",
        !!data.formData.safetyItems.other?.improvement
      );
      safeSetCheckBox(
        form,
        "Check Box75",
        !!data.formData.safetyItems.other?.notApplicable
      );
    } else if (data.formName === "Witness-Statement") {
      // Based on the PDF layout reading left to right, top to bottom
      // First row
      safeSetTextField(
        form,
        "Text1",
        formatDate(data.formData.dateOfIncident) || ""
      );
      safeSetTextField(form, "Text2", data.formData.timeOfIncident || "");
      safeSetTextField(
        form,
        "Text3",
        formatDate(data.formData.statementDate) || ""
      );

      // Second row
      safeSetTextField(form, "Text4", data.formData.locationOfIncident || "");
      safeSetTextField(form, "Text5", data.formData.statementTime || "");

      // Third row
      safeSetTextField(form, "Text6", data.formData.generalForemanName || "");
      safeSetTextField(form, "Text7", data.formData.jobNumber || "");

      // Fourth row - Witness Info
      safeSetTextField(form, "Text8", data.formData.witnessName || "");
      safeSetTextField(form, "Text9", data.formData.witnessPhone || "");

      // Fifth row
      safeSetTextField(form, "Text10", data.formData.witnessEmployer || "");

      // Sixth row
      safeSetTextField(form, "Text11", data.formData.employeesInvolved || "");

      // Seventh row
      safeSetTextField(form, "Text12", data.formData.witnesInvolved || "");

      // Eighth row
      safeSetTextField(form, "Text13", data.formData.equipmentInvolved || "");

      // Statement content - might span several fields depending on how the PDF is set up

      fillMultiLineField(
        form,
        "witnessStatement",
        data.formData.statementContent || ""
      );

      // Signature fields at the bottom
      safeSetTextField(form, "Text30", data.formData.witnessSignature || ""); // Adjust this number based on actual field count
      safeSetTextField(
        form,
        "Text31",
        formatDate(data.formData.signatureDate) || ""
      );

      // Near-Miss Report
    } else if (data.formName === "Near-Miss-Report") {
      // First row - Date, Time, Statement Date
      safeSetTextField(
        form,
        "Text1",
        formatDate(data.formData.dateOfIncident) || ""
      );
      safeSetTextField(form, "Text2", data.formData.timeOfIncident || "");
      safeSetTextField(
        form,
        "Text3",
        formatDate(data.formData.statementDate) || ""
      );

      // Second row - Location, Statement Time
      safeSetTextField(form, "Text4", data.formData.locationOfIncident || "");
      safeSetTextField(form, "Text5", data.formData.statementTime || "");

      // Third row - General Foreman, Job Number
      safeSetTextField(form, "Text6", data.formData.generalForemanName || "");
      safeSetTextField(form, "Text7", data.formData.jobNumber || "");

      // Fourth row - Witnesses, Phone Number
      safeSetTextField(form, "Text8", data.formData.witnesses || "");
      safeSetTextField(form, "Text9", data.formData.witnessPhone || "");

      // Type of Near Miss checkboxes
      if (data.formData.typeOfNearMiss === "NEAR MISS") {
        safeSetCheckBox(form, "Check Box1", true);
      } else if (data.formData.typeOfNearMiss === "SAFETY CONCERN") {
        safeSetCheckBox(form, "Check Box3", true);
      } else if (data.formData.typeOfNearMiss === "SAFETY IDEA / SUGGESTIONS") {
        safeSetCheckBox(form, "Check Box5", true);
      }

      // Type of Concern checkboxes
      if (data.formData.typeOfConcern === "UNSAFE ACT") {
        safeSetCheckBox(form, "Check Box2", true);
      } else if (data.formData.typeOfConcern === "UNSAFE CONDITION OF AREA") {
        safeSetCheckBox(form, "Check Box4", true);
      } else if (
        data.formData.typeOfConcern === "UNSAFE CONDITION OF THE EQUIPMENT"
      ) {
        safeSetCheckBox(form, "Check Box6", true);
      }

      // Description text area
      fillMultiLineField(
        form,
        "incidentDescription",
        data.formData.incidentDescription || ""
      );

      // Prevention suggestion text area
      fillMultiLineField(
        form,
        "preventionSuggestion",
        data.formData.preventionSuggestion || ""
      );

      // Corrective actions text area
      fillMultiLineField(
        form,
        "correctiveActions",
        data.formData.correctiveActions || ""
      );

      // Signature fields at the bottom
      safeSetTextField(form, "Text33", data.formData.supervisorSignature || "");
      safeSetTextField(
        form,
        "Text34",
        formatDate(data.formData.signatureDate) || ""
      );

      //Safety Meeting form
    } else if (data.formName === "Safety-Meeting") {
      // Job Information
      safeSetTextField(form, "Text1", data.formData.jobNumber || "");
      safeSetTextField(form, "Text2", data.jobName || "");

      // Meeting Information
      safeSetTextField(
        form,
        "Text3",
        formatDate(data.formData.meetingDate) || ""
      );
      safeSetTextField(form, "Text4", data.formData.meetingTime || "");
      safeSetTextField(form, "Text5", data.formData.weather || "");

      // Meeting Topic
      fillMultiLineField(
        form,
        "safetyMeetingTopic",
        data.formData.meetingTopic || ""
      );

      // Attendance List - Handle up to 20 attendees
      // Using Text12 through Text56 for attendee names and signatures (2 fields per attendee)
      const attendees = data.formData.attendees || [];
      for (let i = 0; i < attendees.length && i < 23; i++) {
        // Attendee name field (odd numbers)
        safeSetTextField(form, `Text${12 + i * 2}`, attendees[i].name || "");

        // Attendee signature field (even numbers)
        safeSetTextField(
          form,
          `Text${13 + i * 2}`,
          attendees[i].signature || ""
        );
      }

      // Superintendent Information (assuming these are the last three fields)
      const baseIndex = 12 + 23 * 2; // 7 for the header fields + 40 for attendees (20 attendees * 2 fields each)

      safeSetTextField(
        form,
        `Text${baseIndex}`,
        data.formData.superintendentName || ""
      );
      safeSetTextField(
        form,
        `Text${baseIndex + 1}`,
        data.formData.superintendentSignature || ""
      );
      safeSetTextField(
        form,
        `Text${baseIndex + 2}`,
        formatDate(data.formData.signatureDate) || ""
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

    //console.log("PDF Fields:", fieldDetails);

    return fields.map((field) => field.getName());
  } catch (error) {
    console.error("Error listing PDF fields:", error);
    return [];
  }
};
