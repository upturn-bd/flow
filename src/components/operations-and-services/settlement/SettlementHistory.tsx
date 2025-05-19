"use client";

import { getCompanyId, getUserInfo } from "@/lib/api/company-info/employees"
import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import { SettlementState } from "./SettlementCreatePage";
import { extractFilenameFromUrl } from "@/lib/utils";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { useClaimTypes } from "@/hooks/useClaimAndSettlement";

export default function SettlementHistoryPage() {
  const [settlementRequests, setSettlementRequests] = useState<
    SettlementState[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { claimTypes, fetchClaimTypes } = useClaimTypes();
  const [comment, setComment] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);

  async function fetchSettlementRequests() {
    setLoading(true);
    const supabase = createClient();
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("settlement_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("requested_to", user.id)
        .neq("status", "Pending");

      if (error) {
        setError("Failed to fetch settlement requests");
        throw error;
      }

      setSettlementRequests(data);
    } catch (error) {
      setError("Failed to fetch settlement requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettlementRequests();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getEmployeesInfo();
        setEmployees(response.data);
      } catch (error) {
        setEmployees([]);
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchClaimTypes();
  }, [fetchClaimTypes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">{error}</div>
    );
  }
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[#003366]">Settlement Requests</h1>

      {settlementRequests.length > 0 &&
        settlementRequests.map((req) => (
          <div
            key={req.id}
            className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1 space-y-2 text-sm text-gray-800">
                <p>
                  <span className="font-bold">Category:</span>{" "}
                  {
                    claimTypes.find(
                      (type) => type.id === req.settlement_type_id
                    ).settlement_item
                  }
                </p>
                <p>
                  <span className="font-bold">Amount:</span> {req.amount}
                </p>
                {req.date && (
                  <p>
                    <span className="font-bold">Date:</span> {req.event_date}
                  </p>
                )}
                <p>
                  <span className="font-bold">Requested by:</span>{" "}
                  {
                    employees.find(
                      (employee) => employee.id === req.claimant_id
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Description:</span>{" "}
                  {req.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      {settlementRequests.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No settlement requests available.
        </div>
      )}
    </div>
  );
}
