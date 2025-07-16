"use client";

import React, { useState, useEffect } from "react";
import EstimationHeader from "../../components/estimating/EstimationHeader";
import EstimatesView from "../../components/estimating/EstimatesView";
import BidsView from "../../components/estimating/BidsView";
import ElevationsView from "../../components/estimating/ElevationsView";
import ErrorMessage from "../../components/estimating/ErrorMessage";
import LoadingSpinner from "../../components/estimating/LoadingSpinner";
import EstimateForm from "../../components/estimating/EstimateForm";
import BidForm from "../../components/estimating/BidForm";
import ElevationForm from "../../components/estimating/ElevationForm";
import OpeningForm from "../../components/estimating/OpeningForm";
import { createOpeningAPI, updateOpeningAPI } from "../../lib/api/openings";

import {
  CreateEstimateInput,
  CreateBidInput,
  CreateElevationInput,
  CreateOpeningInput,
  Estimate,
  Bid,
  ElevationWithOpenings,
  OpeningWithDetails,
} from "../../types";

const EstimationSystemPage: React.FC = () => {
  console.log("Component is rendering"); // Add this as the very first line
  // State management
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
    null
  );
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [elevations, setElevations] = useState<ElevationWithOpenings[]>([]);
  const [selectedElevation, setSelectedElevation] =
    useState<ElevationWithOpenings | null>(null);
  const [selectedOpening, setSelectedOpening] =
    useState<OpeningWithDetails | null>(null);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [editingElevation, setEditingElevation] =
    useState<ElevationWithOpenings | null>(null);
  const [editingOpening, setEditingOpening] =
    useState<OpeningWithDetails | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<"estimates" | "bids" | "elevations">(
    "estimates"
  );
  const [showEstimateForm, setShowEstimateForm] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [showElevationForm, setShowElevationForm] = useState(false);
  const [showOpeningForm, setShowOpeningForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Functions
  const fetchEstimates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/estimates");
      if (!response.ok) throw new Error("Failed to fetch estimates");

      const data = await response.json();
      setEstimates(data.estimates || []);
    } catch (err) {
      setError("Failed to load estimates");
      console.error("Error fetching estimates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBids = async (estimateId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bids?estimateId=${estimateId}`);
      if (!response.ok) throw new Error("Failed to fetch bids");

      const data = await response.json();
      setBids(data.bids || []);
    } catch (err) {
      setError("Failed to load bids");
      console.error("Error fetching bids:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchElevations = async (bidId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/elevations?bidId=${bidId}&includeDetails=true`
      );
      if (!response.ok) throw new Error("Failed to fetch elevations");

      const data = await response.json();
      console.log("API Response:", data); // Add this line
      console.log("Elevations with openings:", data.elevations); // Add this line
      setElevations(data.elevations || []);
    } catch (err) {
      setError("Failed to load elevations");
      console.error("Error fetching elevations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createEstimate = async (estimateData: CreateEstimateInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(estimateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create estimate");
      }

      const data = await response.json();
      setEstimates((prev) => [...prev, data.estimate]);
      setShowEstimateForm(false);
      setEditingEstimate(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create estimate"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEstimate = async (estimateData: Partial<CreateEstimateInput>) => {
    if (!editingEstimate) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/estimates/${editingEstimate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(estimateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update estimate");
      }

      const data = await response.json();
      setEstimates((prev) =>
        prev.map((est) => (est.id === editingEstimate.id ? data.estimate : est))
      );

      if (selectedEstimate?.id === editingEstimate.id) {
        setSelectedEstimate(data.estimate);
      }

      setShowEstimateForm(false);
      setEditingEstimate(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update estimate"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createBid = async (bidData: CreateBidInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/bids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bidData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create bid");
      }

      const data = await response.json();
      setBids((prev) => [...prev, data.bid]);
      setShowBidForm(false);
      setEditingBid(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bid");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBid = async (bidData: Partial<CreateBidInput>) => {
    if (!editingBid) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/bids/${editingBid.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bidData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bid");
      }

      const data = await response.json();
      setBids((prev) =>
        prev.map((bid) => (bid.id === editingBid.id ? data.bid : bid))
      );

      setShowBidForm(false);
      setEditingBid(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update bid");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createElevation = async (elevationData: CreateElevationInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/elevations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(elevationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create elevation");
      }

      const data = await response.json();
      setElevations((prev) => [...prev, data.elevation]);
      setShowElevationForm(false);
      setEditingElevation(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create elevation"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateElevation = async (
    elevationData: Partial<CreateElevationInput>
  ) => {
    if (!editingElevation) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/elevations/${editingElevation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(elevationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update elevation");
      }

      const data = await response.json();
      setElevations((prev) =>
        prev.map((elevation) =>
          elevation.id === editingElevation.id ? data.elevation : elevation
        )
      );

      if (selectedElevation?.id === editingElevation.id) {
        setSelectedElevation(data.elevation);
      }

      setShowElevationForm(false);
      setEditingElevation(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update elevation"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createOpening = async (openingData: CreateOpeningInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/openings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(openingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create opening");
      }

      const data = await response.json();

      // NEW: Auto-generate grid for the new opening
      try {
        await fetch(`/api/openings/${data.opening.id}/grid`, {
          method: "POST",
        });
        console.log(
          "Grid generated successfully for opening:",
          data.opening.id
        );
      } catch (gridError) {
        console.error("Failed to generate grid:", gridError);
        // Don't fail the whole operation if grid generation fails
      }

      // Update the elevation with the new opening
      setElevations((prev) =>
        prev.map((elevation) =>
          elevation.id === openingData.elevationId
            ? {
                ...elevation,
                openings: [...(elevation.openings || []), data.opening],
              }
            : elevation
        )
      );

      setShowOpeningForm(false);
      setEditingOpening(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create opening");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOpening = async (
    openingId: number,
    openingData: Partial<CreateOpeningInput>
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/openings/${openingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(openingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update opening");
      }

      const data = await response.json();

      // Update the opening in elevations
      setElevations((prev) =>
        prev.map((elevation) => ({
          ...elevation,
          openings: (elevation.openings || []).map((opening) =>
            opening.id === openingId ? data.opening : opening
          ),
        }))
      );

      if (selectedOpening?.id === openingId) {
        setSelectedOpening(data.opening);
      }

      setShowOpeningForm(false);
      setEditingOpening(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update opening");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOpening = async (openingId: number) => {
    if (!window.confirm("Are you sure you want to delete this opening?")) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/openings/${openingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete opening");
      }

      // Remove opening from elevations
      setElevations((prev) =>
        prev.map((elevation) => ({
          ...elevation,
          openings: (elevation.openings || []).filter(
            (opening) => opening.id !== openingId
          ),
        }))
      );

      if (selectedOpening?.id === openingId) {
        setSelectedOpening(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete opening");
    } finally {
      setIsLoading(false);
    }
  };

  // Load estimates on mount
  useEffect(() => {
    fetchEstimates();
  }, []);

  // Event handlers
  const handleEstimateSelect = async (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    await fetchBids(estimate.id);
    setViewMode("bids");
  };

  const handleBidSelect = async (bid: Bid) => {
    setSelectedBid(bid);
    await fetchElevations(bid.id);
    setViewMode("elevations");
  };

  const handleBack = () => {
    if (viewMode === "elevations") {
      setViewMode("bids");
      setSelectedBid(null);
      setElevations([]);
      setSelectedElevation(null);
      setSelectedOpening(null);
    } else if (viewMode === "bids") {
      setViewMode("estimates");
      setSelectedEstimate(null);
      setBids([]);
    }
  };

  const handleEstimateSubmit = async (
    data: CreateEstimateInput | Partial<CreateEstimateInput>
  ) => {
    if (editingEstimate) {
      await updateEstimate(data);
    } else {
      await createEstimate(data as CreateEstimateInput);
    }
  };

  const handleBidSubmit = async (
    data: CreateBidInput | Partial<CreateBidInput>
  ) => {
    if (editingBid) {
      await updateBid(data);
    } else {
      await createBid(data as CreateBidInput);
    }
  };

  const handleElevationSubmit = async (
    data: CreateElevationInput | Partial<CreateElevationInput>
  ) => {
    if (editingElevation) {
      await updateElevation(data);
    } else {
      await createElevation(data as CreateElevationInput);
    }
  };

  const handleOpeningSubmit = async (
    data: CreateOpeningInput | Partial<CreateOpeningInput>
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      if (editingOpening) {
        // Update existing opening
        const response = await fetch(`/api/openings/${editingOpening.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update opening");
        }

        const responseData = await response.json();

        // Update the opening in elevations
        setElevations((prev) =>
          prev.map((elevation) => ({
            ...elevation,
            openings: (elevation.openings || []).map((opening) =>
              opening.id === editingOpening.id ? responseData.opening : opening
            ),
          }))
        );

        if (selectedOpening?.id === editingOpening.id) {
          setSelectedOpening(responseData.opening);
        }
      } else {
        // Create new opening
        const response = await fetch("/api/openings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create opening");
        }

        const responseData = await response.json();

        // AUTO-GENERATE GRID for new opening
        try {
          await fetch(`/api/openings/${responseData.opening.id}/grid`, {
            method: "POST",
          });
          console.log(
            "Grid generated successfully for opening:",
            responseData.opening.id
          );
        } catch (gridError) {
          console.error("Failed to generate grid:", gridError);
        }

        // Update the elevation with the new opening
        setElevations((prev) =>
          prev.map((elevation) =>
            elevation.id === data.elevationId
              ? {
                  ...elevation,
                  openings: [
                    ...(elevation.openings || []),
                    responseData.opening,
                  ],
                }
              : elevation
          )
        );
      }

      setShowOpeningForm(false);
      setEditingOpening(null);
    } catch (error) {
      console.error("Error submitting opening:", error);
      setError(
        error instanceof Error ? error.message : "Failed to submit opening"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewEstimate = () => {
    setEditingEstimate(null);
    setShowEstimateForm(true);
  };

  const handleEditEstimate = (estimate: Estimate) => {
    setEditingEstimate(estimate);
    setShowEstimateForm(true);
  };

  const handleNewBid = () => {
    setEditingBid(null);
    setShowBidForm(true);
  };

  const handleEditBid = (bid: Bid) => {
    setEditingBid(bid);
    setShowBidForm(true);
  };

  const handleNewElevation = () => {
    setEditingElevation(null);
    setShowElevationForm(true);
  };

  const handleEditElevation = (elevation: ElevationWithOpenings) => {
    setEditingElevation(elevation);
    setShowElevationForm(true);
  };

  const handleNewOpening = () => {
    setEditingOpening(null);
    setShowOpeningForm(true);
  };

  const handleEditOpening = (opening: OpeningWithDetails) => {
    console.log("handleEditOpening called with:", opening);

    // Make sure the elevation is selected before opening the form
    const elevation = elevations.find(
      (elev) => elev.id === opening.elevationId
    );
    if (elevation) {
      setSelectedElevation(elevation);
    }

    setEditingOpening(opening);
    setShowOpeningForm(true);
    console.log(
      "About to set state - editingOpening and showOpeningForm to true"
    );
  };

  const handleOpeningSelect = (opening: OpeningWithDetails) => {
    // First, make sure the elevation containing this opening is selected
    const elevation = elevations.find(
      (elev) => elev.id === opening.elevationId
    );
    if (elevation && elevation.id !== selectedElevation?.id) {
      setSelectedElevation(elevation);
    }

    setSelectedOpening(opening);
  };

  const handleCancelForm = () => {
    setShowEstimateForm(false);
    setShowBidForm(false);
    setShowElevationForm(false);
    setShowOpeningForm(false);
    setEditingEstimate(null);
    setEditingBid(null);
    setEditingElevation(null);
    setEditingOpening(null);
  };

  // Show forms if in form mode
  if (showEstimateForm) {
    return (
      <EstimateForm
        estimate={editingEstimate}
        onSubmit={handleEstimateSubmit}
        onCancel={handleCancelForm}
        isLoading={isLoading}
      />
    );
  }

  if (showBidForm && selectedEstimate) {
    return (
      <BidForm
        estimateId={selectedEstimate.id}
        bid={editingBid}
        onSubmit={handleBidSubmit}
        onCancel={handleCancelForm}
        isLoading={isLoading}
      />
    );
  }

  if (showElevationForm && selectedBid) {
    // Transform editingElevation to match CreateElevationInput format
    const initialData = editingElevation
      ? {
          name: editingElevation.name,
          description: editingElevation.description || undefined,
          elevationType: editingElevation.elevationType,
          totalWidth: parseFloat(editingElevation.totalWidth),
          totalHeight: parseFloat(editingElevation.totalHeight),
          floorHeight: parseFloat(editingElevation.floorHeight),
          floorNumber: editingElevation.floorNumber,
          drawingNumber: editingElevation.drawingNumber || undefined,
          drawingRevision: editingElevation.drawingRevision || undefined,
          gridLine: editingElevation.gridLine || undefined,
          detailReference: editingElevation.detailReference || undefined,
          notes: editingElevation.notes || undefined,
          sortOrder: editingElevation.sortOrder,
        }
      : undefined;

    return (
      <ElevationForm
        bidId={selectedBid.id}
        initialData={initialData}
        isEditing={!!editingElevation}
        onSubmit={handleElevationSubmit}
        onCancel={handleCancelForm}
      />
    );
  }

  if (showOpeningForm && selectedElevation) {
    return (
      <OpeningForm
        elevationId={selectedElevation.id}
        opening={editingOpening}
        onSubmit={handleOpeningSubmit}
        onCancel={handleCancelForm}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <EstimationHeader
          viewMode={viewMode}
          selectedEstimate={selectedEstimate}
          selectedBid={selectedBid}
          selectedElevation={selectedElevation}
          onBack={handleBack}
          onNewEstimate={handleNewEstimate}
          onNewBid={handleNewBid}
          onNewElevation={handleNewElevation}
          onNewOpening={handleNewOpening}
        />

        <ErrorMessage error={error} onDismiss={() => setError(null)} />

        <LoadingSpinner isLoading={isLoading} />

        {/* Main Content Views */}
        {!isLoading && (
          <>
            {viewMode === "estimates" && (
              <EstimatesView
                estimates={estimates}
                onEstimateSelect={handleEstimateSelect}
                onEditEstimate={handleEditEstimate}
                onNewEstimate={handleNewEstimate}
              />
            )}

            {viewMode === "bids" && selectedEstimate && (
              <BidsView
                selectedEstimate={selectedEstimate}
                bids={bids}
                onBidSelect={handleBidSelect}
                onEditBid={handleEditBid}
                onNewBid={handleNewBid}
              />
            )}

            {viewMode === "elevations" && selectedBid && (
              <ElevationsView
                selectedBid={selectedBid}
                elevations={elevations}
                selectedElevation={selectedElevation}
                selectedOpening={selectedOpening}
                onElevationSelect={setSelectedElevation}
                onOpeningSelect={handleOpeningSelect}
                onEditElevation={handleEditElevation}
                onEditOpening={handleEditOpening}
                onDeleteOpening={deleteOpening}
                onNewElevation={handleNewElevation}
                onNewOpening={handleNewOpening}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EstimationSystemPage;
