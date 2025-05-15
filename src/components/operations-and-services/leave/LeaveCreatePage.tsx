"use client";

import { useLeaveTypes } from "@/hooks/useLeaveManagement";
import { getCompanyId, getUserInfo } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/client";
import { leaveSchema } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { IoMdCalendar } from "react-icons/io";
import { z } from "zod";

const initialLeaveRecord = {
  type_id: 0,
  start_date: "",
  end_date: "",
  description: "",
  status: "Pending",
};

export type LeaveState = z.infer<typeof leaveSchema>;

export default function LeaveCreatePage() {
  const [leaveRecord, setLeaveRecord] =
    useState<LeaveState>(initialLeaveRecord);
  const [errors, setErrors] = useState<Partial<LeaveState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
  const [isValid, setIsValid] = useState(false);

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
      console.log("Error:", error);
      if (error) throw error;
      alert("Leave created successfully!");
      setLeaveRecord(initialLeaveRecord);
    } catch (error) {
      console.error("Error creating Leave:", error);
      alert("Error creating Leave. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const result = leaveSchema.safeParse(leaveRecord);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<LeaveState> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [leaveRecord]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto lg:mx-20">
      {/* Requisition Header */}
      <div>
        <h1 className="text-xl font-bold text-blue-600">Leave Balance</h1>
        {/* Leave Balance */}
        <div className="mt-4">
          <div className="flex space-x-4 mt-4">
            {[
              { count: "15", type: "Annual Leave" },
              { count: "09", type: "Casual Leave" },
              { count: "11", type: "Sick Leave" },
            ].map(({ count, type }) => (
              <div
                key={type}
                className="border rounded-lg px-6 py-4 text-center"
              >
                <div className="text-[#0E1F33] font-bold text-lg">
                  {count} Days
                </div>
                <div className="text-[#0E1F33] text-sm">{type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-blue-600">Leave Application</h2>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Category
          </label>
          <div className="relative">
            <select
              name="type_id"
              value={leaveRecord.type_id}
              onChange={handleChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select category</option>
              {leaveTypes.length > 0 &&
                leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-bold text-[#003366] mb-1">From</label>
            <div className="relative bg-white shadow px-4 py-2 rounded-md flex items-center gap-2">
              <IoMdCalendar className="text-gray-600" />
              <input
                name="start_date"
                onChange={handleChange}
                value={leaveRecord.start_date}
                type="date"
                className="outline-none w-full"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block font-bold text-[#003366] mb-1">To</label>
            <div className="relative bg-white shadow px-4 py-2 rounded-md flex items-center gap-2">
              <IoMdCalendar className="text-gray-600" />
              <input
                name="end_date"
                onChange={handleChange}
                value={leaveRecord.end_date}
                type="date"
                className="outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Description
          </label>
          <textarea
            rows={4}
            name="description"
            value={leaveRecord.description}
            onChange={handleChange}
            className="w-full bg-[#EAF4FF] px-4 py-2 rounded-md"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-[#001F4D] text-white px-6 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
