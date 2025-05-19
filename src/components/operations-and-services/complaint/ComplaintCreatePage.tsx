"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { PiToggleLeftFill, PiToggleRightFill } from "react-icons/pi";
import { IoMdCalendar } from "react-icons/io";
import { any, z } from "zod";
import { complaintRecordSchema } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCompanyId, getUserInfo } from "@/lib/api/company-info/employees"
import { uploadManyFiles } from "@/lib/api/operations-and-services/requisition";
import { useComplaintTypes } from "@/hooks/useComplaints";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";

const initialComplaintRecord = {
  complaint_type_id: 0,
  complainer_id: "",
  requested_to: "",
  description: "",
  status: "Submitted",
  anonymous: false,
  against_whom: "",
  attachments: [],
};

export type ComplaintState = z.infer<typeof complaintRecordSchema>;

export default function ComplaintCreatePage() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [complaintState, setComplaintState] = useState(initialComplaintRecord);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { complaintTypes, fetchComplaintTypes } = useComplaintTypes();
  const [errors, setErrors] = useState<Partial<ComplaintState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name === "complaint_type_id") {
      setComplaintState((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setComplaintState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeFile = (name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = createClient();
    const company_id = await getCompanyId();
    const user = await getUserInfo();
    setIsSubmitting(true);
    try {
      const { uploadedFilePaths, error: uploadError } = await uploadManyFiles(
        attachments,
        "complaints"
      );

      if (uploadError) throw uploadError;

      const formattedSettlementState = {
        ...complaintState,
        attachments: uploadedFilePaths,
        anonymous: isAnonymous,
        complainer_id: isAnonymous ? null : user.id,
        company_id,
        requested_to: user.supervisor_id,
      };
      const { data, error } = await client
        .from("complaint_records")
        .insert(formattedSettlementState);
      console.log("Error:", error);
      if (error) throw error;
      alert("Complaint created successfully!");
      setComplaintState(initialComplaintRecord);
      setAttachments([]);
    } catch (error) {
      console.error("Error creating Complaint:", error);
      alert("Error creating Complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setComplaintState((prev) => ({
      ...prev,
      anonymous: isAnonymous,
    }));
  }, [isAnonymous]);

  useEffect(() => {
    const result = complaintRecordSchema.safeParse(complaintState);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<ComplaintState> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [complaintState]);

  useEffect(() => {
    fetchComplaintTypes();
  }, [fetchComplaintTypes]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getEmployeesInfo();
        setEmployees(response.data);
      } catch (error) {
        setEmployees([]);
        console.error("Error fetching asset owners:", error);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto lg:mx-20">
      <div>
        <h1 className="text-xl font-bold text-blue-600">Complaints</h1>
        <div
          className="flex items-center cursor-pointer gap-2"
          onClick={() => setIsAnonymous(!isAnonymous)}
        >
          {isAnonymous ? (
            <PiToggleRightFill size={36} className="text-blue-500" />
          ) : (
            <PiToggleLeftFill size={36} className="text-gray-400" />
          )}
          <span className="text-sm text-blue-600">Anonymous</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Category
          </label>
          <div className="relative">
            <select
              name="complaint_type_id"
              value={complaintState.complaint_type_id}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select category</option>
              {complaintTypes.length > 0 &&
                complaintTypes.map((type) => (
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
          {errors.complaint_type_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.complaint_type_id}
            </p>
          )}
        </div>
        <div>
          <label className="block text-lg font-bold text-blue-700">
            Complaint Against
          </label>
          <div className="relative">
            <select
              name="against_whom"
              value={complaintState.against_whom}
              onChange={handleInputChange}
              className="w-full bg-blue-100 rounded p-3 appearance-none"
            >
              <option value={""}>Select a person</option>
              {employees.length > 0 &&
                employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="fill-yellow-400" width="10" height="10">
                <polygon points="0,0 10,0 5,6" />
              </svg>
            </div>
          </div>
          {errors.against_whom && (
            <p className="text-red-500 text-sm mt-1">{errors.against_whom}</p>
          )}
        </div>
        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={complaintState.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full bg-[#EAF4FF] px-4 py-2 rounded-md"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block font-bold text-[#003366] mb-1">
            Attachment
          </label>
          <div className="bg-gray-100 rounded-md border border-gray-300 p-6 text-center text-sm text-gray-500">
            <FiUploadCloud className="mx-auto mb-4 text-2xl" />
            <label
              htmlFor="file_upload"
              className="px-4 py-2 bg-white border border-gray-400 text-sm rounded-md cursor-pointer hover:bg-gray-200 transition"
            >
              Browse File
            </label>
            <input
              type="file"
              id="file_upload"
              name="attachments"
              className="hidden"
              accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAttachments((prev) => [
                  ...prev,
                  ...files.filter(
                    (file) => !prev.some((f) => f.name === file.name)
                  ),
                ]);
              }}
            />
            <div className="flex gap-3 mt-8 text-gray-600">
              {attachments.length > 0
                ? attachments.map((file, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-blue-100 text-sm rounded-sm"
                    >
                      <span>{file.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-red-500 text-xl"
                        onClick={() => removeFile(file.name)}
                      >
                        &times;
                      </button>
                    </div>
                  ))
                : "No files selected"}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-[#001F4D] text-white px-6 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
