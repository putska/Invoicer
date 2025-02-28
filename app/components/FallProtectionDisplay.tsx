// components/FallProtectionDisplay.tsx
import React from "react";

interface SafetyFormSubmission {
  id: number;
  formName: string;
  pdfName: string;
  userName: string;
  dateCreated: string;
  submissionDate: string;
  formData: FallProtectionFormData;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

interface InspectionItem {
  pass: boolean;
  fail: boolean;
  note?: string;
}

interface FallProtectionFormData {
  manufacturer: string;
  dateOfManufacture: string;
  serialNumber: string;
  modelNumber: string;
  inspectionDate: string;
  removeFromServiceDate?: string;
  authorizedPerson: string;
  competentPerson: string;

  labelsAndMarkings: {
    label: InspectionItem;
    markings: InspectionItem;
    dateOfFirstUse: InspectionItem;
    impactIndicator: InspectionItem;
  };

  hardware: {
    shoulderBuckles: InspectionItem;
    legWaistBuckles: InspectionItem;
    dRings: InspectionItem;
    corrosion: InspectionItem;
  };

  webbing: {
    shoulderStrap: InspectionItem;
    cutsBurns: InspectionItem;
    paintContamination: InspectionItem;
    excessiveWear: InspectionItem;
    heatDamage: InspectionItem;
  };

  stitching: {
    shouldersChest: InspectionItem;
    legsBackStraps: InspectionItem;
  };

  additionalNotes?: string;
}

interface FallProtectionDisplayProps {
  submission: SafetyFormSubmission;
}

const FallProtectionDisplay: React.FC<FallProtectionDisplayProps> = ({
  submission,
}) => {
  // Destructure main fields
  const { formName, pdfName, userName, dateCreated, submissionDate, formData } =
    submission;

  // Destructure form data
  const {
    manufacturer,
    dateOfManufacture,
    serialNumber,
    modelNumber,
    inspectionDate,
    removeFromServiceDate,
    authorizedPerson,
    competentPerson,
    labelsAndMarkings,
    hardware,
    webbing,
    stitching,
    additionalNotes,
  } = formData;

  // Helper function to render inspection item
  const renderInspectionItem = (item: InspectionItem) => {
    let status = "Not Inspected";
    let statusClass = "bg-gray-100 text-gray-500";

    if (item.pass) {
      status = "PASS";
      statusClass = "bg-green-100 text-green-700";
    } else if (item.fail) {
      status = "FAIL";
      statusClass = "bg-red-100 text-red-700";
    }

    return (
      <div
        className={`px-3 py-1 rounded-md inline-block font-medium ${statusClass}`}
      >
        {status}
      </div>
    );
  };

  return (
    <div className="safety-form bg-white p-6 rounded-lg shadow-md">
      <header className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{formName}</h1>
        <p className="text-sm text-gray-500">
          Submitted by {userName} on{" "}
          {new Date(submissionDate).toLocaleDateString()}
        </p>
      </header>

      {/* Harness Information */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">
          Harness Information
        </h2>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
          <div>
            <p className="font-medium">Manufacturer:</p>
            <p>{manufacturer}</p>
          </div>
          <div>
            <p className="font-medium">Date of Manufacture:</p>
            <p>{new Date(dateOfManufacture).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-medium">Serial #:</p>
            <p>{serialNumber}</p>
          </div>
          <div>
            <p className="font-medium">Model #:</p>
            <p>{modelNumber}</p>
          </div>
        </div>
      </section>

      {/* Inspection Information */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">
          Inspection Information
        </h2>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
          <div>
            <p className="font-medium">Inspection Date:</p>
            <p>{new Date(inspectionDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-medium">Remove from Service Date:</p>
            <p>
              {removeFromServiceDate
                ? new Date(removeFromServiceDate).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="font-medium">Authorized Person:</p>
            <p>{authorizedPerson}</p>
          </div>
          <div>
            <p className="font-medium">Competent Person:</p>
            <p>{competentPerson}</p>
          </div>
        </div>
      </section>

      {/* Labels & Markings Section */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">
          LABELS & MARKINGS
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="w-1/3 py-2 px-4 border-b text-left">Item</th>
                <th className="w-1/6 py-2 px-4 border-b text-center">Status</th>
                <th className="w-1/2 py-2 px-4 border-b text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4">Label (legible/in tact)</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(labelsAndMarkings.label)}
                </td>
                <td className="py-2 px-4">
                  {labelsAndMarkings.label.note || "-"}
                </td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 px-4">Appropriate (ANSI/OSHA) Markings</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(labelsAndMarkings.markings)}
                </td>
                <td className="py-2 px-4">
                  {labelsAndMarkings.markings.note || "-"}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">Date of First Use</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(labelsAndMarkings.dateOfFirstUse)}
                </td>
                <td className="py-2 px-4">
                  {labelsAndMarkings.dateOfFirstUse.note || "-"}
                </td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 px-4">
                  Impact Indicator (signs of deployment)
                </td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(labelsAndMarkings.impactIndicator)}
                </td>
                <td className="py-2 px-4">
                  {labelsAndMarkings.impactIndicator.note || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Hardware Section */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">
          HARDWARE (BUCKLES & RINGS)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="w-1/3 py-2 px-4 border-b text-left">Item</th>
                <th className="w-1/6 py-2 px-4 border-b text-center">Status</th>
                <th className="w-1/2 py-2 px-4 border-b text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4">Shoulder Adjustment Buckles</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(hardware.shoulderBuckles)}
                </td>
                <td className="py-2 px-4">
                  {hardware.shoulderBuckles.note || "-"}
                </td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 px-4">
                  Leg & Waist Buckles / Other Hardware
                </td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(hardware.legWaistBuckles)}
                </td>
                <td className="py-2 px-4">
                  {hardware.legWaistBuckles.note || "-"}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">
                  D-Rings (Dorsal, Side, Shoulder or Sternal)
                </td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(hardware.dRings)}
                </td>
                <td className="py-2 px-4">{hardware.dRings.note || "-"}</td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 px-4">Corrosion / Pitting / Nicks</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(hardware.corrosion)}
                </td>
                <td className="py-2 px-4">{hardware.corrosion.note || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Webbing Section */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">WEBBING</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="w-1/3 py-2 px-4 border-b text-left">Item</th>
                <th className="w-1/6 py-2 px-4 border-b text-center">Status</th>
                <th className="w-1/2 py-2 px-4 border-b text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4">
                  Shoulder / Chest / Leg / Back Strap
                </td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(webbing.shoulderStrap)}
                </td>
                <td className="py-2 px-4">
                  {webbing.shoulderStrap.note || "-"}
                </td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 px-4">Cuts / Burns / Holes</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(webbing.cutsBurns)}
                </td>
                <td className="py-2 px-4">{webbing.cutsBurns.note || "-"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">Paint Contamination</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(webbing.paintContamination)}
                </td>
                <td className="py-2 px-4">
                  {webbing.paintContamination.note || "-"}
                </td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 px-4">Excessive Wear</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(webbing.excessiveWear)}
                </td>
                <td className="py-2 px-4">
                  {webbing.excessiveWear.note || "-"}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">Heat / UV Damage</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(webbing.heatDamage)}
                </td>
                <td className="py-2 px-4">{webbing.heatDamage.note || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Stitching Section */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">STITCHING</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="w-1/3 py-2 px-4 border-b text-left">Item</th>
                <th className="w-1/6 py-2 px-4 border-b text-center">Status</th>
                <th className="w-1/2 py-2 px-4 border-b text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4">Shoulders / Chest</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(stitching.shouldersChest)}
                </td>
                <td className="py-2 px-4">
                  {stitching.shouldersChest.note || "-"}
                </td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 px-4">Legs / Back Straps</td>
                <td className="py-2 px-4 text-center">
                  {renderInspectionItem(stitching.legsBackStraps)}
                </td>
                <td className="py-2 px-4">
                  {stitching.legsBackStraps.note || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Additional Notes Section */}
      {additionalNotes && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            ADDITIONAL NOTES
          </h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="whitespace-pre-line">{additionalNotes}</p>
          </div>
        </section>
      )}

      {/* Final Status */}
      <section className="mt-8 border-t pt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">
              Inspection performed on{" "}
              {new Date(inspectionDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            {removeFromServiceDate && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md">
                <p className="font-medium">Remove from Service by:</p>
                <p>{new Date(removeFromServiceDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FallProtectionDisplay;
