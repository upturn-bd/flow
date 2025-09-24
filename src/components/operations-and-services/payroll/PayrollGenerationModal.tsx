"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, AlertTriangle, CheckCircle, XCircle, Loader2, Users, DollarSign } from 'lucide-react';
import { usePayroll } from '@/hooks/usePayroll';
import { formatDate } from '@/lib/utils';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Generate Payroll</h2>
          </div>

          {/* Date Selection */}
          {!results && !showConfirmation && !isGenerating && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generation Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mr-2" />
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
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitiateGeneration}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Confirm Payroll Generation
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    This will generate payroll records for all employees with basic salary &gt; 0 on {formatDate(selectedDate)}. 
                    The payrolls will be automatically published and synced with the accounts system.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmGeneration}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Generating Payroll...
                </h3>
                <p className="text-sm text-gray-500">
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
                  results.success ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {results.success ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <h3 className={`text-lg font-medium mb-2 ${
                  results.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {results.success ? 'Payroll Generated Successfully!' : 'Payroll Generation Failed'}
                </h3>
                
                {results.success ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Payroll records have been generated as <span className="font-medium text-blue-600">Pending</span> for {formatDate(selectedDate)}. 
                      You can review and publish them in the Pending tab.
                    </p>
                    
                    {/* Show generation statistics */}
                    {results.data && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm font-medium text-blue-800">{results.data.generated || 0}</p>
                            <p className="text-xs text-blue-600">Generated</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-800">{results.data.status || 'Pending'}</p>
                            <p className="text-xs text-blue-600">Status</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-800">{results.data.employees || 0}</p>
                            <p className="text-xs text-blue-600">Eligible Employees</p>
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
                  <p className="text-sm text-red-600">{results.error}</p>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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