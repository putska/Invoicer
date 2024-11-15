// app/labor-data/[projectId]/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";

// Define fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CostCode {
  costCodeNumber: string;
  totalHours: number;
  description?: string;
}

interface LaborEntry {
  id: number;
  date: string;
  firstName: string;
  lastName: string;
  hours: number;
}

const LaborDataPage = () => {
  const params = useParams();
  const projectId = params.projectId;
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [selectedCostCode, setSelectedCostCode] = useState<string | null>(null);
  const [laborData, setLaborData] = useState<LaborEntry[]>([]);

  const { data: costCodesData, error: costCodesError } = useSWR(
    projectId
      ? `/api/labor-data/project/${projectId}/hours-by-cost-code`
      : null,
    fetcher
  );

  const { data: laborDataResponse, error: laborDataError } = useSWR(
    selectedCostCode && projectId
      ? `/api/labor-data/project/${projectId}/cost-code/${selectedCostCode}`
      : null,
    fetcher
  );

  // Loading states for better UX
  const [loadingCostCodes, setLoadingCostCodes] = useState<boolean>(false);
  const [loadingLaborData, setLoadingLaborData] = useState<boolean>(false);

  // Define the cost code descriptions
  const COST_CODE_DESCRIPTIONS: { [key: string]: string } = {
    "11-08": "Install Mockups",
    "11-09": "Measure and Layout",
    "11-10": "Unload & Distribute",
    "11-11": "Welding",
    "11-12": "Install Membrane",
    "11-13": "Install Panels",
    "11-14": "Install Terracotta Subgirts",
    "11-15": "Install Terracotta Tile",
    "11-16": "Install Supports / Furring",
    "11-17": "Install Surrounds",
    "11-18": "Install Sunshades / Screens",
    "11-19": "Install Unitized CW Starter Sill",
    "11-20": "Install Unitized CW",
    "11-21": "Install CW Metal",
    "11-22": "Install WW / SF Metal",
    "11-23": "Glaze CW",
    "11-24": "Glaze WW / SF",
    "11-25": "Install Doors",
    "11-26": "Caulking",
    "11-27": "Install Louvers",
    "11-28": "Install Handrail Metal",
    "11-29": "Install Handrail Glass",
    "11-30": "Install Material Protection",
    "11-31": "Install Interior Panels",
    "11-32": "Install Interior WW",
    "11-33": "Install Interior Glass",
    "11-34": "Water Tests",
    "11-35": "Punch List",
    "11-36": "Clean Up / Composite Crew",
    "11-37": "Supervision",
    "11-38": "Expenses",
    "11-39": "Zone Pay",
    "11-40": "Travel",
    "11-41": "Install DC 123",
    "11-42": "Mechanical Handling Equipment",
    // Add more cost codes and descriptions as needed
  };

  useEffect(() => {
    if (costCodesData) {
      const COST_CODE_ORDER: string[] = Object.keys(COST_CODE_DESCRIPTIONS);

      const mappedCostCodes: CostCode[] = costCodesData.hoursByCostCode.map(
        (cc: any) => ({
          costCodeNumber: cc.costCodeNumber,
          totalHours: cc.totalHours,
          description:
            COST_CODE_DESCRIPTIONS[cc.costCodeNumber] || "No Description",
        })
      );

      // Sort the mappedCostCodes based on COST_CODE_ORDER
      mappedCostCodes.sort((a, b) => {
        const indexA = COST_CODE_ORDER.indexOf(a.costCodeNumber);
        const indexB = COST_CODE_ORDER.indexOf(b.costCodeNumber);

        if (indexA === -1 && indexB === -1) {
          // Both not found, sort alphabetically
          return a.costCodeNumber.localeCompare(b.costCodeNumber);
        }
        if (indexA === -1) return 1; // a not found, place after b
        if (indexB === -1) return -1; // b not found, place before a
        return indexA - indexB; // Sort based on the order in COST_CODE_ORDER
      });

      setCostCodes(mappedCostCodes);
    }
  }, [costCodesData]);

  useEffect(() => {
    if (laborDataResponse) {
      setLaborData(laborDataResponse.laborData);
    }
  }, [laborDataResponse]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Labor Data for Project {projectId}
      </h1>
      {selectedCostCode ? (
        <div>
          <button
            onClick={() => setSelectedCostCode(null)}
            className="bg-gray-500 text-white px-3 py-1 rounded mb-4 hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          <h2 className="text-xl font-semibold mb-2">
            Details for Cost Code: {selectedCostCode} -{" "}
            {COST_CODE_DESCRIPTIONS[selectedCostCode] || "No Description"}
          </h2>
          {loadingLaborData ? (
            <p>Loading labor data...</p>
          ) : laborData.length > 0 ? (
            <ul className="list-disc pl-5">
              {laborData.map((entry) => (
                <li key={entry.id}>
                  {entry.date} {entry.firstName} {entry.lastName} -{" "}
                  {entry.hours} hours
                </li>
              ))}
            </ul>
          ) : (
            <p>No labor entries found for this cost code.</p>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Total Hours by Cost Code
          </h2>
          {loadingCostCodes ? (
            <p>Loading cost codes...</p>
          ) : costCodes.length > 0 ? (
            <ul className="list-disc pl-5">
              {costCodes.map((code) => (
                <li key={code.costCodeNumber} className="mb-1">
                  <button
                    onClick={() => setSelectedCostCode(code.costCodeNumber)}
                    className="w-full text-left hover:bg-gray-200 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label={`View details for cost code ${code.costCodeNumber}`}
                  >
                    <span className="font-medium">
                      {code.costCodeNumber || "N/A"}
                    </span>{" "}
                    - {code.totalHours} hours - {code.description}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No cost codes found for this project.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LaborDataPage;
