"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: number;
  tableName: string;
  onAttachmentUpdate: (recordId: number, newAttachmentCount: number) => void;
}

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string; // Dropbox file path or URL
}

const AttachmentModal = ({
  isOpen,
  onClose,
  recordId,
  tableName,
  onAttachmentUpdate,
}: AttachmentModalProps) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // New state for upload progress
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const { register, handleSubmit, reset } = useForm<{ notes: string }>();
  const [sharedLinks, setSharedLinks] = useState<{ [key: number]: string }>({});

  // Fetch attachments when the modal is opened
  useEffect(() => {
    if (isOpen) {
      fetchAttachments();
    }
  }, [isOpen]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/attachments/${recordId}?tableName=${tableName}`
      );
      if (!response.ok) throw new Error("Error fetching attachments");
      const data = await response.json();
      setAttachments(data.attachments);
      console.log("Attachments fetched:", data.attachments);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleFormSubmit = async (data: { notes: string }) => {
    if (selectedFiles) {
      setIsUploading(true); // Start the spinner
      try {
        // Process each file separately
        for (const file of selectedFiles) {
          const fileFormData = new FormData();
          fileFormData.append("recordId", recordId.toString());
          fileFormData.append("tableName", tableName);
          fileFormData.append("notes", data.notes);
          fileFormData.append("file", file);

          const response = await fetch("/api/attachments/", {
            method: "POST",
            body: fileFormData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "File upload failed");
          }

          const fileData = await response.json(); // Renamed to avoid conflict
          console.log(
            "Upload successful for:",
            file.name,
            fileData.uploadResult
          );

          // Optionally, you can refresh attachments after each upload
          await fetchAttachments();
        }
        reset();
        setSelectedFiles(null);
      } catch (err) {
        console.error("Error uploading files:", err);
        setError((err as Error).message);
      } finally {
        setIsUploading(false); // Stop the spinner
      }
    }
  };

  const handleDeleteAttachment = async (
    attachmentId: number,
    tableName: string
  ) => {
    try {
      const response = await fetch(
        `/api/attachments/${attachmentId}?tableName=${encodeURIComponent(
          tableName
        )}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error deleting attachment");
      }

      // Refresh the list of attachments after deletion
      await fetchAttachments();
    } catch (err) {
      console.error("Error deleting attachment:", err);
    }
  };

  // New: Wrap the onClose to call onAttachmentUpdate before closing.
  const handleModalClose = () => {
    // Use the current attachments state to update the parent.
    onAttachmentUpdate(recordId, attachments.length);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isOpen ? "block" : "hidden"
      } bg-gray-900 bg-opacity-50`}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl w-full">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Manage Attachments
        </h2>

        {/* Optionally show an upload indicator */}
        {isUploading && (
          <div className="flex items-center justify-center mb-4">
            <svg
              className="animate-spin h-5 w-5 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span className="ml-2 text-gray-600">Uploading files...</span>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Upload Files</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              multiple
              disabled={isUploading} // Optionally disable if uploading
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Notes</label>
            <textarea
              {...register("notes")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              rows={3}
              disabled={isUploading}
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleModalClose} // Use our new close handler
              className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              disabled={isUploading} // Prevent closing mid-upload if desired
            >
              Close
            </button>
            <button
              type="submit"
              className={`bg-indigo-600 text-white py-2 px-4 rounded-md ${
                !selectedFiles || isUploading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-indigo-700"
              }`}
              disabled={!selectedFiles || isUploading}
            >
              Upload
            </button>
          </div>
        </form>

        {/* Uploaded Files */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Uploaded Files
          </h3>
          {loading ? (
            <div className="flex justify-center">
              <svg
                className="animate-spin h-5 w-5 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : attachments.length > 0 ? (
            <ul className="space-y-4">
              {attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="bg-gray-100 p-4 rounded-md shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      {attachment.sharedLink ? (
                        <a
                          href={attachment.sharedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-medium underline"
                        >
                          {attachment.fileName ||
                            attachment.fileUrl.split("/").pop()}{" "}
                        </a>
                      ) : (
                        <span className="text-gray-800 font-medium">
                          {attachment.fileName ||
                            attachment.fileUrl.split("/").pop()}{" "}
                        </span>
                      )}
                      <p className="text-gray-600 text-sm">
                        {attachment.fileSize} bytes • {attachment.notes} •{" "}
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleDeleteAttachment(attachment.id, tableName)
                      }
                      className="text-red-600 hover:underline text-sm"
                      disabled={isUploading}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No attachments uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentModal;
