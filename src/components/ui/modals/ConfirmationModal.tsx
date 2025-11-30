"use client";

import { useState } from "react";
import BaseModal from "./BaseModal";
import { Button } from "../button";
import { ConfirmationModalProps } from "./types";

const variantStyles = {
  danger: {
    iconColor: "text-red-600",
    buttonVariant: "danger" as const,
  },
  warning: {
    iconColor: "text-yellow-600", 
    buttonVariant: "primary" as const,
  },
  info: {
    iconColor: "text-blue-600",
    buttonVariant: "primary" as const,
  },
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  isLoading = false,
}: ConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action error:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const styles = variantStyles[variant];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      preventBackdropClose={isConfirming || isLoading}
    >
      <div className="space-y-4">
        {/* Message */}
        <div className="text-foreground-primary dark:text-foreground-primary text-sm sm:text-base leading-relaxed">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isConfirming || isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          
          <Button
            type="button"
            variant={styles.buttonVariant}
            onClick={handleConfirm}
            disabled={isConfirming || isLoading}
            isLoading={isConfirming}
            className="w-full sm:w-auto"
          >
            {isConfirming ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
