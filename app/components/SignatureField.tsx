"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";

interface SignatureFieldProps {
  fieldName: string;
  dateFieldName: string;
  label: string;
  dateLabel?: string;
  required?: boolean;
  error?: string;
  dateError?: string;
}

const SignatureField: React.FC<SignatureFieldProps> = ({
  fieldName,
  dateFieldName,
  label,
  dateLabel = "Date",
  required = false,
  error,
  dateError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const { register, setValue, watch } = useFormContext();

  // Watch the current value of the signature field
  const currentSignatureValue = watch(fieldName);

  // Set today's date as default when component mounts
  useEffect(() => {
    if (!watch(dateFieldName)) {
      setValue(dateFieldName, format(new Date(), "yyyy-MM-dd"));
    }
  }, [setValue, dateFieldName, watch]);

  // Initialize canvas when modal opens
  useEffect(() => {
    if (showModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas dimensions
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Set line style
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000";

        // If there's an existing signature, load it
        if (currentSignatureValue) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            setIsEmpty(false);
          };
          img.src = currentSignatureValue;
        }
      }
    }
  }, [showModal, currentSignatureValue]);

  // Drawing functions
  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDrawing(true);
    setIsEmpty(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x =
      e instanceof TouchEvent || "touches" in e
        ? (e as React.TouchEvent).touches[0].clientX - rect.left
        : (e as React.MouseEvent).clientX - rect.left;
    const y =
      e instanceof TouchEvent || "touches" in e
        ? (e as React.TouchEvent).touches[0].clientY - rect.top
        : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x =
      e instanceof TouchEvent || "touches" in e
        ? (e as React.TouchEvent).touches[0].clientX - rect.left
        : (e as React.MouseEvent).clientX - rect.left;
    const y =
      e instanceof TouchEvent || "touches" in e
        ? (e as React.TouchEvent).touches[0].clientY - rect.top
        : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL("image/png");
    setValue(fieldName, signatureDataUrl);
    setShowModal(false);

    // Also update the date automatically to today
    setValue(dateFieldName, format(new Date(), "yyyy-MM-dd"));
  };

  const openSignatureModal = () => {
    setShowModal(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="mb-4">
        <label className="block text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="relative">
          <input {...register(fieldName)} type="hidden" />

          <div
            onClick={openSignatureModal}
            className="w-full px-4 py-2 border border-gray-300 rounded-md cursor-pointer min-h-[60px] flex items-center justify-center bg-white"
          >
            {currentSignatureValue ? (
              <img
                src={currentSignatureValue}
                alt="Signature"
                className="max-h-[56px]"
              />
            ) : (
              <span className="text-gray-500">Click to sign</span>
            )}
          </div>

          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1">
          {dateLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <input
          type="date"
          {...register(dateFieldName)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
        />

        {dateError && <span className="text-red-500 text-sm">{dateError}</span>}
      </div>

      {/* Signature Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-medium text-gray-900 mb-4">
              Sign Here
            </h3>

            <div className="border border-gray-300 rounded-md overflow-hidden mb-4">
              <canvas
                ref={canvasRef}
                className="w-full touch-none"
                style={{ height: "200px", background: "#fff" }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={clearCanvas}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Clear
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveSignature}
                  disabled={isEmpty}
                  className={`px-4 py-2 rounded ${
                    isEmpty
                      ? "bg-indigo-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureField;
