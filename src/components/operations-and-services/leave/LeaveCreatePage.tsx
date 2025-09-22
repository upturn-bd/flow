"use client";

import { createClient } from "@/lib/supabase/client";
import { useLeaveTypes } from "@/hooks/useConfigTypes";
import { Leave } from "@/lib/types";
import { validateLeave, validationErrorsToObject } from "@/lib/utils/validation";
import React, { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, Info } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { useLeaveRequests } from "@/hooks/useLeaveManagement";

const initialLeaveRecord = {
  type_id: undefined,
  start_date: "",
  end_date: "",
  description: "",
  status: "Pending",
};

export type LeaveState = Leave;

const leaveBalanceData = [
  { count: "15", type: "Annual Leave", color: "bg-green-100 border-green-300 text-green-800" },
  { count: "09", type: "Casual Leave", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { count: "11", type: "Sick Leave", color: "bg-purple-100 border-purple-300 text-purple-800" },
];

export default function LeaveCreatePage({setActiveTab}: {setActiveTab: (key: string) => void}) {
  const [leaveRecord, setLeaveRecord] = useState<LeaveState>(initialLeaveRecord);
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveState, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LeaveState, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [daysCount, setDaysCount] = useState(0);

  const { leaveTypes, fetchLeaveTypes, loading: isLoading } = useLeaveTypes();
  const { createLeaveRequest } = useLeaveRequests();

  // Fetch leave types
  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  // Calculate days between start and end
  useEffect(() => {
    if (leaveRecord.start_date && leaveRecord.end_date) {
      const startDate = new Date(leaveRecord.start_date);
      const endDate = new Date(leaveRecord.end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDaysCount(diffDays);
    } else {
      setDaysCount(0);
    }
  }, [leaveRecord.start_date, leaveRecord.end_date]);

  // Validate leave
  useEffect(() => {
    const result = validateLeave(leaveRecord);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
    }
  }, [leaveRecord]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setLeaveRecord((prev: any) => ({
      ...prev,
      [name]: name === "type_id" ? (value === "" ? undefined : Number(value)) : value,
    }));

    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ type_id: true, start_date: true, end_date: true, description: true });

    if (!isValid) return;

    const client = createClient();
    const user = await getEmployeeInfo();
    setIsSubmitting(true);

    try {
      const formattedLeave = {
        ...leaveRecord,
        employee_id: user.id,
        company_id: user.company_id,
        requested_to: user.supervisor_id,
      };

      const { error } = await createLeaveRequest(formattedLeave);
      if (error) throw error;

      toast.success("Leave application submitted successfully!");
      setLeaveRecord(initialLeaveRecord);
      setTouched({});
      setActiveTab('history')
    } catch (error) {
      console.error("Error creating Leave:", error);
      toast.error("Failed to submit leave application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Leave Balance */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-600" /> Leave Balance
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {leaveBalanceData.map(({ count, type, color }) => (
            <div key={type} className={`border rounded-lg px-4 py-5 text-center ${color} border transition-all hover:shadow-md`}>
              <div className="font-bold text-lg mb-1">{count} Days</div>
              <div className="text-sm">{type}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Leave Form */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-blue-600" /> Leave Application
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">Leave Type *</label>
            <div className="relative">
              <select
                name="type_id"
                value={leaveRecord.type_id ?? ""}
                onChange={handleChange}
                className={`w-full bg-gray-50 border ${touched.type_id && errors.type_id ? "border-red-300" : "border-gray-300"} rounded-lg p-3 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition`}
              >
                <option value="">Select leave type</option>
                {isLoading ? (
                  <option disabled>Loading leave types...</option>
                ) : (
                  leaveTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)
                )}
              </select>
            </div>
            {touched.type_id && errors.type_id && (
              <p className="text-red-500 text-sm mt-1">{errors.type_id}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">From *</label>
              <div className="relative bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <input
                  name="start_date"
                  type="date"
                  value={leaveRecord.start_date}
                  onChange={handleChange}
                  className="w-full py-3 pl-10 pr-3 outline-none bg-transparent"
                />
              </div>
              {touched.start_date && errors.start_date && (
                <p className="text-red-500 text-sm">{errors.start_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">To *</label>
              <div className="relative bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <input
                  name="end_date"
                  type="date"
                  value={leaveRecord.end_date}
                  onChange={handleChange}
                  min={leaveRecord.start_date}
                  className="w-full py-3 pl-10 pr-3 outline-none bg-transparent"
                />
              </div>
              {touched.end_date && errors.end_date && (
                <p className="text-red-500 text-sm">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Days count */}
          {daysCount > 0 && (
            <div className="flex items-center p-3 bg-blue-50 rounded-md border border-blue-100">
              <Info className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 text-sm">
                You are requesting <strong>{daysCount} day{daysCount !== 1 ? "s" : ""}</strong> of leave
              </span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">Reason for Leave</label>
            <textarea
              name="description"
              rows={4}
              value={leaveRecord.description}
              onChange={handleChange}
              placeholder="Please provide details about your leave request..."
              className={`w-full bg-gray-50 border ${touched.description && errors.description ? "border-red-300" : "border-gray-300"} rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition`}
            />
            {touched.description && errors.description && (
              <p className="text-red-500 text-sm">{errors.description}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500 mb-3 sm:mb-0 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-gray-400" /> All fields with an asterisk (*) are required
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !isValid || leaveRecord.type_id === undefined}
              className={`flex items-center justify-center w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${isSubmitting ? "opacity-80" : ""}`}
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
