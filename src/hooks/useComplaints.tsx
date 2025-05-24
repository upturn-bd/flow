"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { ComplaintState } from "@/components/operations-and-services/complaint/ComplaintCreatePage";
import { z } from "zod";

const complaintTypeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  company_id: z.number().optional(),
});

export type ComplaintType = z.infer<typeof complaintTypeSchema>;

export function useComplaintTypes() {
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaintTypes = useCallback(async () => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();
      const { data, error } = await supabase
        .from("complaint_types")
        .select("*")
        .eq("company_id", company_id);

      if (error) throw error;
      setComplaintTypes(data || []);
      return data;
    } catch (error) {
      setError("Failed to fetch complaint types");
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createComplaintType = useCallback(async (values: ComplaintType) => {
    try {
      const company_id = await getCompanyId();
      const { data, error } = await supabase.from("complaint_types").insert({
        ...values,
        company_id,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  return {
    complaintTypes,
    loading,
    error,
    fetchComplaintTypes,
    createComplaintType,
  };
}

export function useComplaints() {
  const [complaints, setComplaints] = useState<ComplaintState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchComplaints = useCallback(async (status: string = "Pending") => {
    setLoading(true);

    try {
      const user = await getEmployeeInfo();
      const company_id = await getCompanyId();

      const validField =
        status === "Pending" ? "requested_to" : "complainer_id";

      const { data, error } = await supabase
        .from("complaint_records")
        .select("*")
        .eq("company_id", company_id)
        .eq(validField, user.id)
        .eq("status", status);

      if (error) {
        setError("Failed to fetch complaint requests");
        throw error;
      }

      setComplaints(data || []);
      return data;
    } catch (error) {
      setError("Failed to fetch complaint requests");
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComplaintHistory = useCallback(async () => {
    return fetchComplaints("Pending");
  }, [fetchComplaints]);

  const updateComplaint = useCallback(
    async (action: string, id: number, comment: string) => {
      setProcessingId(id);

      try {
        const user = await getEmployeeInfo();
        const company_id = await getCompanyId();

        const { data, error } = await supabase
          .from("complaint_records")
          .update({
            status: action,
            approved_by_id: user.id,
            comment: comment,
          })
          .eq("company_id", company_id)
          .eq("id", id);

        if (error) {
          setError("Failed to update complaint request");
          throw error;
        }

        // Refresh the requests
        await fetchComplaints();
        return true;
      } catch (error) {
        setError("Failed to update complaint request");
        console.error(error);
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchComplaints]
  );

  return {
    complaints,
    loading,
    error,
    processingId,
    fetchComplaints,
    fetchComplaintHistory,
    updateComplaint,
  };
}
