"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X } from "@/lib/icons";
import { ReactNode } from "react";

interface FormLayoutProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  children: ReactNode;
  isLoading?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  className?: string;
  showBackButton?: boolean;
  showSaveButton?: boolean;
  showCancelButton?: boolean;
}

export function FormLayout({
  title,
  subtitle,
  onBack,
  onSave,
  onCancel,
  children,
  isLoading = false,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  className = "",
  showBackButton = true,
  showSaveButton = true,
  showCancelButton = true,
}: FormLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`max-w-4xl mx-auto ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {showBackButton && onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {showCancelButton && onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X size={16} />
              {cancelLabel}
            </Button>
          )}
          {showSaveButton && onSave && (
            <Button
              variant="primary"
              onClick={onSave}
              isLoading={isLoading}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {saveLabel}
            </Button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {children}
      </div>
    </motion.div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ 
  title, 
  description, 
  children, 
  className = "" 
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export function FormGrid({ 
  children, 
  columns = 2, 
  className = "" 
}: { 
  children: ReactNode; 
  columns?: 1 | 2 | 3; 
  className?: string;
}) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}
