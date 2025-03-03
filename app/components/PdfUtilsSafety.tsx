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
      case "JHA":
        pdfPath = "/JHA.pdf";
        break;
      case "Fall-Protection":
        pdfPath = "/FallProtection.pdf";
        break;
      case "Telehandler":
        pdfPath = "/Telehandler.pdf";
        break;
      case "MEWP":
        pdfPath = "/MEWP.pdf";
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
    //const fields = form.getFields();
    //console.log(
    //  "Available PDF fields:",
    //  fields.map((f) => f.getName())
    //);

    // Fill the form based on the form type
    if (data.formName === "JHA") {
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
