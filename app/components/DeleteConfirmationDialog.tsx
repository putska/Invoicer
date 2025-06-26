// components/DeleteConfirmationDialog.tsx

import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import { DeleteConfirmationData } from "../types"; // Adjust import path

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: DeleteConfirmationData | null;
  loading: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  data,
  loading,
}) => {
  if (!data) return null;

  const { type, name, impact } = data;
  const isCategory = type === "category";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" color="error">
          Confirm Delete {isCategory ? "Category" : "Activity"}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action cannot be undone!
        </Alert>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete the {type} "<strong>{name}</strong>"?
        </Typography>

        <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
            This will permanently delete:
          </Typography>

          {isCategory && (
            <Typography variant="body2" sx={{ ml: 2 }}>
              • {impact.categoryCount} category
            </Typography>
          )}

          <Typography variant="body2" sx={{ ml: 2 }}>
            • {impact.activityCount}{" "}
            {impact.activityCount === 1 ? "activity" : "activities"}
          </Typography>

          {impact.manpowerCount > 0 && (
            <Typography variant="body2" sx={{ ml: 2 }}>
              • {impact.manpowerCount} manpower{" "}
              {impact.manpowerCount === 1 ? "record" : "records"}
            </Typography>
          )}

          {impact.totalEstimatedHours !== undefined &&
            impact.totalEstimatedHours > 0 && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                • {impact.totalEstimatedHours} total estimated hours
              </Typography>
            )}
        </Box>

        {impact.manpowerCount > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            All associated manpower records will be automatically deleted.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
