"use client";

import { createClient } from '@/lib/supabase/client';
import { useLeaveTypes } from "@/hooks/useConfigTypes";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import { leaveSchema } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { motion } from "framer-motion";
import { getSupervisor } from "@/lib/api/operations-and-services/attendance/leave";

const initialLeaveRecord = {
  type_id: 0,
  start_date: "",
  end_date: "",
  description: "",
  status: "Pending",
};

export type LeaveState = z.infer<typeof leaveSchema>;

const leaveBalanceData = [
  { count: "15", type: "Annual Leave", color: "bg-green-100 border-green-300 text-green-800" },
  { count: "09", type: "Casual Leave", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { count: "11", type: "Sick Leave", color: "bg-purple-100 border-purple-300 text-purple-800" },
];

export default function LeaveCreatePage() {
  const [leaveRecord, setLeaveRecord] = useState<LeaveState>(initialLeaveRecord);
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { leaveTypes, fetchLeaveTypes, loading:isLoading } = useLeaveTypes();
  const [isValid, setIsValid] = useState(false);
  const [daysCount, setDaysCount] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "type_id") {
      setLeaveRecord((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setLeaveRecord((prev) => ({ ...prev, [name]: value }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = createClient();
    const company_id = await getCompanyId();
    const user = await getUserInfo();
    setIsSubmitting(true);
    
    try {
      const formattedSettlementState = {
        ...leaveRecord,
        employee_id: user.id,
        company_id,
        requested_to: user.supervisor_id,
      };
      
      const { data, error } = await client
        .from("leave_records")
        .insert(formattedSettlementState);
      
      if (error) throw error;
      
      toast.success("Leave application submitted successfully!");
      setLeaveRecord(initialLeaveRecord);
    } catch (error) {
      console.error("Error creating Leave:", error);
      toast.error("Failed to submit leave application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate days between start and end date
  useEffect(() => {
    if (leaveRecord.start_date && leaveRecord.end_date) {
      const startDate = new Date(leaveRecord.start_date);
      const endDate = new Date(leaveRecord.end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      setDaysCount(diffDays);
    } else {
      setDaysCount(0);
    }
  }, [leaveRecord.start_date, leaveRecord.end_date]);

  useEffect(() => {
    const result = leaveSchema.safeParse(leaveRecord);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<Record<keyof LeaveState, string>> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0] as keyof LeaveState] = err.message as string;
      });
      setErrors(newErrors);
    }
  }, [leaveRecord]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };
  
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="p-6 space-y-8 max-w-4xl mx-auto"
    >
      {/* Leave Balance Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-600" />
          Leave Balance
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {leaveBalanceData.map(({ count, type, color }) => (
            <div
              key={type}
              className={`border rounded-lg px-4 py-5 text-center ${color} border transition-all hover:shadow-md`}
            >
              <div className="font-bold text-lg mb-1">{count} Days</div>
              <div className="text-sm">{type}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Leave Application Form */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-blue-600" />
          Leave Application
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">
              Leave Type
            </label>
            <div className="relative">
              <select
                name="type_id"
                value={leaveRecord.type_id}
                onChange={handleChange}
                className={`w-full bg-gray-50 border ${errors.type_id ? 'border-red-300' : 'border-gray-300'} rounded-lg p-3 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition`}
              >
                <option value="">Select leave type</option>
                {isLoading ? (
                  <option disabled>Loading leave types...</option>
                ) : (
                  leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="fill-gray-400" width="12" height="8">
                  <polygon points="0,0 12,0 6,8" />
                </svg>
              </div>
            </div>
            {errors.type_id && (
              <p className="text-red-500 text-sm mt-1">{errors.type_id}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">From</label>
              <div className="relative bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <input
                  name="start_date"
                  onChange={handleChange}
                  value={leaveRecord.start_date}
                  type="date"
                  className="w-full py-3 pl-10 pr-3 outline-none bg-transparent"
                />
              </div>
              {errors.start_date && (
                <p className="text-red-500 text-sm">{errors.start_date}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">To</label>
              <div className="relative bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <input
                  name="end_date"
                  onChange={handleChange}
                  value={leaveRecord.end_date}
                  type="date"
                  className="w-full py-3 pl-10 pr-3 outline-none bg-transparent"
                  min={leaveRecord.start_date}
                />
              </div>
              {errors.end_date && (
                <p className="text-red-500 text-sm">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Days count indicator */}
          {daysCount > 0 && (
            <div className="flex items-center p-3 bg-blue-50 rounded-md border border-blue-100">
              <Info className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 text-sm">
                You are requesting <strong>{daysCount} day{daysCount !== 1 ? 's' : ''}</strong> of leave
              </span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">
              Reason for Leave
            </label>
            <textarea
              rows={4}
              name="description"
              value={leaveRecord.description}
              onChange={handleChange}
              placeholder="Please provide details about your leave request..."
              className={`w-full bg-gray-50 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500 mb-3 sm:mb-0 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-gray-400" />
              All fields with an asterisk (*) are required
            </div>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`flex items-center justify-center w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${isSubmitting ? 'opacity-80' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </section>
    </motion.div>
  );
}
