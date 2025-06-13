// components/engineering/PrintButton.tsx
"use client";

import { useState } from "react";
import { Printer, FileText } from "lucide-react";

interface PrintButtonProps {
  onPrint: () => void;
  disabled?: boolean;
}

export function PrintButton({ onPrint, disabled = false }: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await onPrint();
      // Small delay to let the print styles apply
      setTimeout(() => {
        window.print();
      }, 100);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={disabled || isPrinting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
    >
      <Printer className="h-4 w-4" />
      {isPrinting ? "Preparing..." : "Print Schedule"}
    </button>
  );
}

// Alternative dropdown version with multiple print options
export function PrintDropdown({
  onPrint,
  disabled = false,
}: PrintButtonProps & {
  onPrint: (type: "full" | "engineers-only" | "projects-only") => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async (
    type: "full" | "engineers-only" | "projects-only"
  ) => {
    setIsPrinting(true);
    setIsOpen(false);
    try {
      await onPrint(type);
      setTimeout(() => {
        window.print();
      }, 100);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isPrinting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        <Printer className="h-4 w-4" />
        {isPrinting ? "Preparing..." : "Print Options"}
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
          <div className="py-1">
            <button
              onClick={() => handlePrint("full")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Full Schedule
            </button>
            <button
              onClick={() => handlePrint("engineers-only")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Engineers Only
            </button>
            <button
              onClick={() => handlePrint("projects-only")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Projects Only
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
