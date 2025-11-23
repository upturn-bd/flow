"use client";

import { Save, X } from "@/lib/icons";
import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";

interface SubmitActionsProps {
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  onCancel: () => void;
  submitText?: string;
  cancelText?: string;
  className?: string;
  disabled?: boolean;
}

export default function SubmitActions({
  isSubmitting,
  isDirty,
  isValid,
  onCancel,
  submitText = "Save Changes",
  cancelText = "Cancel",
  className = "",
  disabled = false,
}: SubmitActionsProps) {
  console.log(isSubmitting, isDirty, isValid);

  const canSubmit = isDirty && isValid && !isSubmitting && !disabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex justify-end gap-3 ${className}`}
    >
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
      >
        <X className="h-4 w-4 inline mr-2" />
        {cancelText}
      </button>

      <div className="relative">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-4 py-2 rounded-md text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center transition-all duration-200 ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          }`}
          title={
            !isDirty
              ? "No changes to save"
              : !isValid
              ? "Please fix validation errors"
              : disabled
              ? "Action disabled"
              : isSubmitting
              ? "Saving..."
              : "Save your changes"
          }
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner className="h-4 w-4 mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {submitText}
            </>
          )}
        </button>

        {/* Tooltip for disabled state */}
        {!canSubmit && !isSubmitting && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {!isDirty
              ? "No changes to save"
              : !isValid
              ? "Please fix validation errors"
              : disabled
              ? "Action disabled"
              : ""}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
