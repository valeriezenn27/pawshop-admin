"use client";

import { AlertTriangle, X } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function DeleteModal({
  isOpen,
  productName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="delete-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          data-testid="delete-modal-close"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 shrink-0">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <div>
            <h2 id="delete-modal-title" className="text-lg font-semibold text-gray-900">
              Delete Product
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-900">&ldquo;{productName}&rdquo;</span>?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="btn-secondary"
            disabled={isDeleting}
            data-testid="delete-modal-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger"
            disabled={isDeleting}
            data-testid="delete-modal-confirm"
          >
            {isDeleting ? "Deleting..." : "Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
