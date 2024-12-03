// app/labor-data/[projectId]/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { COST_CODE_DESCRIPTIONS } from "../../../constants/costCodeDescriptions";

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

  const { data: costCodesData } = useSWR(
    projectId
      ? `/api/labor-data/project/${projectId}/hours-by-cost-code`
      : null,
    fetcher
  );

  const { data: laborDataResponse } = useSWR(
    selectedCostCode && projectId
      ? `/api/labor-data/project/${projectId}/cost-code/${selectedCostCode}`
      : null,
    fetcher
  );

  // Fetch the last labor date
  const { data: lastLaborDateResponse, error: lastLaborDateError } = useSWR(
    projectId ? `/api/labor-data/last-labor-date/${projectId}` : null,
    fetcher
  );

  const lastLaborDate = lastLaborDateResponse?.lastLaborDate;

  // Loading states for better UX
  const [loadingCostCodes, setLoadingCostCodes] = useState<boolean>(false);
  const [loadingLaborData, setLoadingLaborData] = useState<boolean>(false);

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
      {lastLaborDate ? (
        <p className="text-gray-600 mb-4">
          Last labor imported: {new Date(lastLaborDate).toLocaleDateString()}
        </p>
      ) : (
        <p className="text-gray-600 mb-4">
          No labor data found for this project.
        </p>
      )}
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
