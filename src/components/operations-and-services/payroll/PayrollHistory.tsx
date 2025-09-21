"use client";

import React, { useEffect } from "react";
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
  Plus
} from "lucide-react";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { formatDate } from "@/lib/utils";

// Define the structure for extended payroll with employee info
interface ExtendedPayroll {
  id: number;
  employee_id: string;
  grade_name: string;
  basic_salary: number;
  adjustments: Array<{type: string; amount: number}>;
  total_amount: number;
  generation_date: string;
  status: 'Paid' | 'Pending' | 'Adjusted';
  created_at: string;
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

export default function PayrollHistoryPage() {
  const { 
    payrolls, 
    loading, 
    error, 
    payrollStats,
    fetchPayrollHistory 
  } = usePayroll();

  useEffect(() => {
    fetchPayrollHistory();
  }, [fetchPayrollHistory]);

  // Calculate total adjustments for a payroll
  const calculateTotalAdjustments = (adjustments: Array<{type: string; amount: number}>) => {
    return adjustments.reduce((total, adj) => total + adj.amount, 0);
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
          {/* Stats Overview */}
          {payrolls.length > 0 && (
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
                    <p className="text-sm font-medium text-gray-600">Adjusted</p>
                    <p className="text-2xl font-semibold text-gray-900">{payrollStats.adjusted}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {payrolls.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <CreditCard className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No payroll history</h3>
              <p className="mt-1 text-gray-500">Your payroll records will appear here once generated</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {payrolls.map((payroll: ExtendedPayroll, index) => {
                const adjustmentTotal = calculateTotalAdjustments(payroll.adjustments || []);
                
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
                                {payroll.grade_name}
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
                            ৳{payroll.total_amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Base: ৳{payroll.basic_salary.toLocaleString()}
                          </div>
                          {adjustmentTotal !== 0 && (
                            <div className={`text-sm flex items-center justify-end mt-1 ${
                              adjustmentTotal > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {adjustmentTotal > 0 ? (
                                <Plus className="h-3 w-3 mr-1" />
                              ) : (
                                <Minus className="h-3 w-3 mr-1" />
                              )}
                              ৳{Math.abs(adjustmentTotal).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Adjustments Details */}
                      {payroll.adjustments && payroll.adjustments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Adjustments</h4>
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