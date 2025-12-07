"use client";

import { WarningCircle, CheckCircle, Info } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface ValidationFeedbackProps {
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  className?: string;
}

export default function ValidationFeedback({ isDirty, isValid, errors, className = "" }: ValidationFeedbackProps) {
  const errorCount = Object.values(errors).filter(Boolean).length;
  
  if (!isDirty) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`rounded-lg border p-3 ${className} ${
          isValid 
            ? 'bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40 text-success' 
            : 'bg-error/10 dark:bg-error/20 border-error/30 dark:border-error/40 text-error'
        }`}
      >
        <div className="flex items-start">
          {isValid ? (
            <CheckCircle className="h-5 w-5 mt-0.5 mr-3 shrink-0 text-success" />
          ) : (
            <WarningCircle className="h-5 w-5 mt-0.5 mr-3 shrink-0 text-error" />
          )}
          <div className="flex-1">
            {isValid ? (
              <p className="text-sm font-medium">All fields are valid</p>
            ) : (
              <div>
                <p className="text-sm font-medium mb-2">
                  {errorCount} {errorCount === 1 ? 'field needs' : 'fields need'} attention:
                </p>
                <ul className="text-sm space-y-1">
                  {Object.entries(errors).map(([field, error]) => 
                    error ? (
                      <li key={field} className="flex items-start">
                        <span className="w-2 h-2 bg-current rounded-full mt-2 mr-2 shrink-0"></span>
                        <span className="capitalize">{field.replace(/_/g, ' ')}: {error}</span>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
