"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { fadeIn, fadeInUp } from "../animations";
import { BaseModalProps } from "./types";

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-xl", 
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  icon,
  size = "md",
  showCloseButton = true,
  preventBackdropClose = false,
  className = "",
}: BaseModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventBackdropClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-4 sm:py-8 backdrop-blur-sm"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleBackdropClick}
        >
          <motion.div
            className={`w-full ${sizeClasses[size]} mx-auto px-4 sm:px-0`}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div
              className={`bg-white rounded-xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl ${className}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {icon && <div className="text-gray-600">{icon}</div>}
                  <h2 className="text-xl sm:text-2xl font-bold text-[#192D46]">
                    {title}
                  </h2>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label="Close modal"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
