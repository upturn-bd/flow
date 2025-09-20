"use client";

import React, { useEffect, useState } from "react";
import { usePayroll } from "@/hooks/usePayroll";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardCheck, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock,
  XCircle,
  DollarSign,
  AlertTriangle,
  Edit3,
  Save,
  X,
  Plus,
  Minus
} from "lucide-react";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { formatDate } from "@/lib/utils";
import { PayrollAdjustment } from "@/lib/types/schemas";

// Define the structure for extended payroll with employee info
interface ExtendedPayroll {
  id: number;
  employee_id: string;
  grade_name: string;
  basic_salary: number;
  adjustments: PayrollAdjustment[];
  total_amount: number;
  generation_date: string;
  status: 'Paid' | 'Pending' | 'Adjusted';
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    email: string;
    department_id?: number;
  };
  supervisor?: {
    first_name: string;
    last_name: string;
  };
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Paid':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'Adjusted':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'Pending':
    default:
      return <Clock className="h-5 w-5 text-blue-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'Adjusted':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Pending':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

export default function PayrollRequestsPage() {
  const { 
    payrolls, 
    loading, 
    error, 
    fetchSupervisedPayrolls,
    updatePayrollStatus 
  } = usePayroll();

  const [editingPayroll, setEditingPayroll] = useState<number | null>(null);
  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
  const [processingUpdate, setProcessingUpdate] = useState(false);

  useEffect(() => {
    // For now, fetch all supervised payrolls - this would normally use the current user's ID
    fetchSupervisedPayrolls();
  }, [fetchSupervisedPayrolls]);

  const handleEditPayroll = (payroll: ExtendedPayroll) => {
    setEditingPayroll(payroll.id);
    setAdjustments(payroll.adjustments || []);
  };

  const handleCancelEdit = () => {
    setEditingPayroll(null);
    setAdjustments([]);
  };

  const handleAddAdjustment = () => {
    setAdjustments([...adjustments, { type: "", amount: 0 }]);
  };

  const handleRemoveAdjustment = (index: number) => {
    setAdjustments(adjustments.filter((_, i) => i !== index));
  };

  const handleAdjustmentChange = (index: number, field: 'type' | 'amount', value: string | number) => {
    const newAdjustments = [...adjustments];
    if (field === 'amount') {
      newAdjustments[index][field] = Number(value);
    } else {
      newAdjustments[index][field] = value as string;
    }
    setAdjustments(newAdjustments);
  };

  const handleSaveAdjustments = async () => {
    if (!editingPayroll) return;
    
    setProcessingUpdate(true);
    try {
      // Filter out empty adjustments
      const validAdjustments = adjustments.filter(adj => adj.type.trim() && adj.amount !== 0);
      
      const status = validAdjustments.length > 0 ? 'Adjusted' : 'Paid';
      await updatePayrollStatus(editingPayroll, status, validAdjustments);
      
      setEditingPayroll(null);
      setAdjustments([]);
    } catch (err) {
      console.error('Failed to update payroll:', err);
    } finally {
      setProcessingUpdate(false);
    }
  };

  const handleMarkAsPaid = async (payrollId: number) => {
    setProcessingUpdate(true);
    try {
      await updatePayrollStatus(payrollId, 'Paid');
    } catch (err) {
      console.error('Failed to mark payroll as paid:', err);
    } finally {
      setProcessingUpdate(false);
    }
  };

  // Calculate total adjustments for a payroll
  const calculateTotalAdjustments = (payrollAdjustments: PayrollAdjustment[]) => {
    return payrollAdjustments.reduce((total, adj) => total + adj.amount, 0);
  };

  // Calculate new total with current adjustments
  const calculateNewTotal = (basicSalary: number) => {
    const adjustmentTotal = calculateTotalAdjustments(adjustments);
    return basicSalary + adjustmentTotal;
  };

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <LoadingSection 
          text="Loading payroll requests..."
          icon={ClipboardCheck}
          color="amber"
        />
      )}
      
      {error && !loading && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <XCircle className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Payroll Requests</h3>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={() => fetchSupervisedPayrolls()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      )}

      {!loading && !error && (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-6"
        >
          {payrolls.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <ClipboardCheck className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No payroll requests</h3>
              <p className="mt-1 text-gray-500">Payroll requests for your team will appear here</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {payrolls.map((payroll: ExtendedPayroll, index) => {
                const isEditing = editingPayroll === payroll.id;
                const currentAdjustmentTotal = calculateTotalAdjustments(payroll.adjustments || []);
                
                return (
                  <motion.div
                    key={payroll.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                              <ClipboardCheck className="h-6 w-6 text-amber-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {payroll.employee?.first_name} {payroll.employee?.last_name}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payroll.status)}`}>
                                {getStatusIcon(payroll.status)}
                                <span className="ml-1">{payroll.status}</span>
                              </span>
                            </div>
                            
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(payroll.generation_date)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <User className="h-4 w-4 mr-2" />
                                {payroll.grade_name}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {isEditing ? (
                              <span className="text-blue-600">
                                ৳{calculateNewTotal(payroll.basic_salary).toLocaleString()}
                              </span>
                            ) : (
                              <span>৳{payroll.total_amount.toLocaleString()}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Base: ৳{payroll.basic_salary.toLocaleString()}
                          </div>
                          {(currentAdjustmentTotal !== 0 || isEditing) && (
                            <div className={`text-sm flex items-center justify-end mt-1 ${
                              (isEditing ? calculateTotalAdjustments(adjustments) : currentAdjustmentTotal) > 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(isEditing ? calculateTotalAdjustments(adjustments) : currentAdjustmentTotal) > 0 ? (
                                <Plus className="h-3 w-3 mr-1" />
                              ) : (
                                <Minus className="h-3 w-3 mr-1" />
                              )}
                              ৳{Math.abs(isEditing ? calculateTotalAdjustments(adjustments) : currentAdjustmentTotal).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Adjustments Section */}
                      {isEditing ? (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-900">Adjustments</h4>
                            <button
                              onClick={handleAddAdjustment}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded hover:bg-blue-50"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </button>
                          </div>
                          <div className="space-y-2">
                            {adjustments.map((adjustment, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder="Adjustment type (e.g., Bonus, Deduction)"
                                  value={adjustment.type}
                                  onChange={(e) => handleAdjustmentChange(idx, 'type', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={adjustment.amount}
                                  onChange={(e) => handleAdjustmentChange(idx, 'amount', e.target.value)}
                                  className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                  onClick={() => handleRemoveAdjustment(idx)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {adjustments.length === 0 && (
                              <p className="text-sm text-gray-500 italic">No adjustments added</p>
                            )}
                          </div>
                          <div className="flex items-center justify-end space-x-2 mt-4">
                            <button
                              onClick={handleCancelEdit}
                              disabled={processingUpdate}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveAdjustments}
                              disabled={processingUpdate}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                              {processingUpdate ? (
                                <>
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Current Adjustments Display */}
                          {payroll.adjustments && payroll.adjustments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Current Adjustments</h4>
                              <div className="space-y-1">
                                {payroll.adjustments.map((adjustment, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">{adjustment.type}</span>
                                    <span className={`font-medium flex items-center ${
                                      adjustment.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {adjustment.amount >= 0 ? (
                                        <Plus className="h-3 w-3 mr-1" />
                                      ) : (
                                        <Minus className="h-3 w-3 mr-1" />
                                      )}
                                      ৳{Math.abs(adjustment.amount).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          {payroll.status === 'Pending' && (
                            <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => handleEditPayroll(payroll)}
                                disabled={processingUpdate}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Adjust
                              </button>
                              <button
                                onClick={() => handleMarkAsPaid(payroll.id)}
                                disabled={processingUpdate}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                              >
                                {processingUpdate ? (
                                  <>
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Mark as Paid
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}