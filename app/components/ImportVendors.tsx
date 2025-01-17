"use client";

import { useState } from "react";
import { Vendor } from "../types"; // Adjust the import path based on your project structure

export default function ImportVendors() {
  const [status, setStatus] = useState("");

  // Mapping CSV headers to Vendor keys
  const headerToVendorKey: Record<string, keyof Vendor> = {
    vendorName: "vendorName",
    vendorAddress: "vendorAddress",
    vendorCity: "vendorCity",
    vendorState: "vendorState",
    vendorZip: "vendorZip",
    vendorPhone: "vendorPhone",
    vendorEmail: "vendorEmail",
    vendorContact: "vendorContact",
    internalVendorId: "internalVendorId",
    taxable: "taxable",
  };

  const handleFileUpload = async () => {
    try {
      const response = await fetch("/Sorted_Vendor_List.csv");
      if (!response.ok) {
        setStatus("Failed to fetch vendor list file");
        return;
      }

      const text = await response.text();
      const rows = text.split("\n");
      const headers = rows[0].split(",");

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(",");

        // Map the CSV data to the Vendor interface
        const vendor = headers.reduce((acc, header, index) => {
          const key = headerToVendorKey[header.trim()];
          if (key) {
            acc[key] = (
              key === "taxable" ? true : values[index]?.trim() || " "
            ) as Vendor[keyof Vendor];
          }
          return acc;
        }, {} as Partial<Record<keyof Vendor, Vendor[keyof Vendor]>>);

        // Send the vendor data to the API
        const res = await fetch("/api/vendor-import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vendor),
        });

        if (res.ok) {
          setStatus(`Vendor ${vendor.vendorName} imported successfully`);
        } else {
          const error = await res.json();
          setStatus(
            `Failed to import vendor ${vendor.vendorName}: ${error.message}`
          );
          break;
        }
      }
    } catch (error) {
      console.error(error);
      setStatus("An error occurred during the import process.");
    }
  };

  return (
    <div>
      <h1>Import Vendors</h1>
      <button onClick={handleFileUpload}>Start Import</button>
      <p>{status}</p>
    </div>
  );
}
