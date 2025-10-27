"use client";

import React, { useEffect, useState } from "react";
import { usePayroll } from "@/hooks/usePayroll";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock,
  XCircle,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Minus,
  Plus,
  Edit3,
  Save,
  X
} from "lucide-react";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { formatDate } from "@/lib/utils";
import { PayrollAdjustment } from "@/lib/types/schemas";

// Define the structure for extended payroll with employee info
interface ExtendedPayroll {
  id?: number;
  employee_id: string;
  basic_salary: number;
  adjustments: Array<{type: string; amount: number}>;
  total_amount: number;
  generation_date: string;
  status: 'Paid' | 'Pending' | 'Published';
  supervisor_id?: string;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
  employee?: {
    first_name: string;
    last_name: string;
    email: string;
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
    case 'Published': // Updated from 'Adjusted'
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
    case 'Published': // Updated from 'Adjusted'
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Pending':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

interface PayrollHistoryProps {
  statusFilter?: 'Paid' | 'Pending' | 'Published';
}

export default function PayrollHistoryPage({ statusFilter }: PayrollHistoryProps) {
  const { 
    payrolls, 
    loading, 
    error, 
    payrollStats,
    fetchPayrollHistory,
    updatePayrollStatus 
  } = usePayroll();

  const [editingPayroll, setEditingPayroll] = useState<number | null>(null);
  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
  const [processingUpdate, setProcessingUpdate] = useState(false);

  useEffect(() => {
    fetchPayrollHistory();
  }, [fetchPayrollHistory]);

  // Filter payrolls based on status
  const filteredPayrolls = statusFilter 
    ? payrolls.filter(payroll => payroll.status === statusFilter)
    : payrolls;

  // Calculate total adjustments for a payroll
  const calculateTotalAdjustments = (adjustments: Array<{type: string; amount: number}>) => {
    return adjustments.reduce((total, adj) => total + adj.amount, 0);
  };

  // Handle status update
  const handleStatusUpdate = async (payrollId: number, newStatus: 'Paid' | 'Pending' | 'Published') => {
    try {
      await updatePayrollStatus(payrollId, newStatus);
      // Refresh the payroll data
      fetchPayrollHistory();
    } catch (error) {
      console.error('Failed to update payroll status:', error);
    }
  };

  // Adjustment handling functions
  const handleEditPayroll = (payroll: ExtendedPayroll) => {
    if (payroll.id) {
      setEditingPayroll(payroll.id);
      setAdjustments(payroll.adjustments || []);
    }
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
      
      const status = 'Published'; // Save adjustments and publish
      await updatePayrollStatus(editingPayroll, status, validAdjustments);
      
      setEditingPayroll(null);
      setAdjustments([]);
      // Refresh the payroll data
      fetchPayrollHistory();
    } catch (err) {
      console.error('Failed to update payroll:', err);
    } finally {
      setProcessingUpdate(false);
    }
  };

  // Calculate new total with current adjustments
  const calculateNewTotal = (basicSalary: number) => {
    const adjustmentTotal = adjustments.reduce((total, adj) => total + adj.amount, 0);
    return basicSalary + adjustmentTotal;
  };

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <LoadingSection 
          text="Loading payroll history..."
          icon={CreditCard}
          color="blue"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Payroll</h3>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={() => fetchPayrollHistory()}
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
          {/* Stats Overview - only show if no filter is applied */}
          {!statusFilter && payrolls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CreditCard className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-semibold text-gray-900">{payrollStats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Paid</p>
                    <p className="text-2xl font-semibold text-gray-900">{payrollStats.paid}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{payrollStats.pending}</p>
                  </div>
                </div>
              </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-8 w-8 text-amber-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Published</p>
                        <p className="text-2xl font-semibold text-gray-900">{payrollStats.published}</p>
                      </div>
                    </div>
                  </div>
            </motion.div>
          )}

          {/* Show filtered count for specific tabs */}
          {statusFilter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {statusFilter === 'Paid' && <CheckCircle className="h-8 w-8 text-green-600" />}
                    {statusFilter === 'Pending' && <Clock className="h-8 w-8 text-blue-600" />}
                    {statusFilter === 'Published' && <AlertTriangle className="h-8 w-8 text-amber-600" />}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{statusFilter} Payrolls</p>
                    <p className="text-2xl font-semibold text-gray-900">{filteredPayrolls.length}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {filteredPayrolls.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <CreditCard className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {statusFilter ? `No ${statusFilter.toLowerCase()} payrolls` : 'No payroll history'}
              </h3>
              <p className="mt-1 text-gray-500">
                {statusFilter 
                  ? `${statusFilter} payroll records will appear here`
                  : 'Your payroll records will appear here once generated'
                }
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredPayrolls.map((payroll: ExtendedPayroll, index) => {
                const adjustmentTotal = calculateTotalAdjustments(payroll.adjustments || []);
                const isEditing = editingPayroll === payroll.id;
                
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
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-indigo-600" />
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
                              {payroll.employee && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <User className="h-4 w-4 mr-2" />
                                  {payroll.employee.first_name} {payroll.employee.last_name}
                                </div>
                              )}
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
                          {(adjustmentTotal !== 0 || isEditing) && (
                            <div className={`text-sm flex items-center justify-end mt-1 ${
                              (isEditing ? adjustments.reduce((sum, adj) => sum + adj.amount, 0) : adjustmentTotal) > 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(isEditing ? adjustments.reduce((sum, adj) => sum + adj.amount, 0) : adjustmentTotal) > 0 ? (
                                <Plus className="h-3 w-3 mr-1" />
                              ) : (
                                <Minus className="h-3 w-3 mr-1" />
                              )}
                              ৳{Math.abs(isEditing ? adjustments.reduce((sum, adj) => sum + adj.amount, 0) : adjustmentTotal).toLocaleString()}
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
                                  Publishing...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save & Publish
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
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-end space-x-3">
                              {payroll.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleEditPayroll(payroll)}
                                    disabled={processingUpdate}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                  >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Add Adjustments
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(payroll.id!, 'Published')}
                                    disabled={processingUpdate}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
                                  >
                                    {processingUpdate ? (
                                      <>
                                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Publishing...
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Publish As-Is
                                      </>
                                    )}
                                  </button>
                                </>
                              )}
                              {payroll.status === 'Published' && (
                                <button
                                  onClick={() => handleStatusUpdate(payroll.id!, 'Paid')}
                                  disabled={processingUpdate}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                                >
                                  {processingUpdate ? (
                                    <>
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Paid
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
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