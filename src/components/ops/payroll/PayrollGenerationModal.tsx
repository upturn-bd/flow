"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Warning, CheckCircle, XCircle, Users, CurrencyDollar } from "@phosphor-icons/react";
import InlineSpinner from '@/components/ui/InlineSpinner';
import { usePayroll } from '@/hooks/usePayroll';
import { formatDate } from '@/lib/utils';
import { DateField } from '@/components/forms';

interface PayrollGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PayrollGenerationModal({ isOpen, onClose, onSuccess }: PayrollGenerationModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [results, setResults] = useState<{
    success: boolean;
    data?: any;
    failedOperations?: string[];
    error?: string;
  } | null>(null);

  const { generatePayrollWithRetry, checkPendingPayrolls } = usePayroll();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleInitiateGeneration = async () => {
    // First check for pending payrolls
    const pendingPayroll = await checkPendingPayrolls();
    if (pendingPayroll) {
      setResults({
        success: false,
        error: `Cannot generate payroll. There is a pending payroll from ${formatDate(pendingPayroll.generation_date)}`
      });
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmGeneration = async () => {
    setIsGenerating(true);
    setShowConfirmation(false);
    
    try {
      const result = await generatePayrollWithRetry(selectedDate);
      setResults({
        success: true,
        data: result?.data,
        failedOperations: result?.failedOperations || undefined
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate payroll'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setResults(null);
      setShowConfirmation(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-surface-primary rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-foreground-primary">Generate Payroll</h2>
          </div>

          {/* Date Selection */}
          {!results && !showConfirmation && !isGenerating && (
            <div className="space-y-4">
              <DateField
                name="generationDate"
                label="Generation Date"
                value={selectedDate}
                onChange={handleDateChange}
              />

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex">
                  <Warning className="h-5 w-5 text-amber-400 mr-2" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">Before generating payroll:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Ensure all employee salaries are up to date</li>
                      <li>Verify there are no pending payrolls</li>
                      <li>This will create payroll records for all eligible employees</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-foreground-secondary bg-background-secondary dark:bg-background-tertiary border border-border-secondary rounded-md hover:bg-background-tertiary dark:hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitiateGeneration}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Generate Payroll
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          <AnimatePresence>
            {showConfirmation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                    <Warning className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground-primary mb-2">
                    Confirm Payroll Generation
                  </h3>
                  <p className="text-sm text-foreground-tertiary mb-4">
                    This will generate payroll records for all employees with basic salary &gt; 0 on {formatDate(selectedDate)}. 
                    The payrolls will be automatically published and synced with the accounts system.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-foreground-secondary bg-background-secondary dark:bg-background-tertiary border border-border-secondary rounded-md hover:bg-background-tertiary dark:hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmGeneration}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Confirm Generate
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30">
                <InlineSpinner size="md" color="primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground-primary mb-2">
                  Generating Payroll...
                </h3>
                <p className="text-sm text-foreground-tertiary">
                  Creating payroll records for eligible employees and syncing with accounts system.
                  This may take a few moments depending on the number of employees.
                </p>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {results && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                  results.success ? 'bg-success/10 dark:bg-success/20' : 'bg-error/10 dark:bg-error/20'
                }`}>
                  {results.success ? (
                    <CheckCircle className="h-6 w-6 text-success" />
                  ) : (
                    <XCircle className="h-6 w-6 text-error" />
                  )}
                </div>
                <h3 className={`text-lg font-medium mb-2 ${
                  results.success ? 'text-success' : 'text-error'
                }`}>
                  {results.success ? 'Payroll Generated Successfully!' : 'Payroll Generation Failed'}
                </h3>
                
                {results.success ? (
                  <div className="space-y-2">
                    <p className="text-sm text-foreground-secondary">
                      Payroll records have been generated as <span className="font-medium text-primary-600 dark:text-primary-400">Pending</span> for {formatDate(selectedDate)}. 
                      You can review and publish them in the Pending tab.
                    </p>
                    
                    {/* Show generation statistics */}
                    {results.data && (
                      <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-md p-3 mt-3">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm font-medium text-primary-800 dark:text-primary-300">{results.data.generated || 0}</p>
                            <p className="text-xs text-primary-600 dark:text-primary-400">Generated</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary-800 dark:text-primary-300">{results.data.status || 'Pending'}</p>
                            <p className="text-xs text-primary-600 dark:text-primary-400">Status</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary-800 dark:text-primary-300">{results.data.employees || 0}</p>
                            <p className="text-xs text-primary-600 dark:text-primary-400">Eligible Employees</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {results.failedOperations && results.failedOperations.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                        <p className="text-sm font-medium text-amber-800 mb-1">Partial Success:</p>
                        <ul className="text-xs text-amber-700 space-y-1">
                          {results.failedOperations.map((op, index) => (
                            <li key={index}>• {op}</li>
                          ))}
                        </ul>
                        <p className="text-xs text-amber-700 mt-2">
                          Please check the admin panel for manual intervention.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-error">{results.error}</p>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Close
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}