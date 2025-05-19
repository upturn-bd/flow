"use client";

import { useRequisitionInventories } from "@/hooks/useInventory";
import { useRequisitionTypes } from "@/hooks/useRequisitionTypes";
import { getCompanyId, getUserInfo } from "@/lib/api/company-info/employees"
import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { RequisitionState } from "./RequisitionCreatePage";
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";

export default function RequisitionHistoryPage() {
  const [requisitionRequests, setRequisitionRequests] = useState<
    RequisitionState[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requisitionTypes, fetchRequisitionTypes } = useRequisitionTypes();
  const { requisitionInventories, fetchRequisitionInventories } =
    useRequisitionInventories();
  const [comment, setComment] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);

  async function fetchRequisitionRequests() {
    setLoading(true);
    const supabase = createClient();
    const user = await getUserInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("requisition_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("asset_owner", user.id)
        .neq("status", "Pending");

      if (error) {
        setError("Failed to fetch requisition requests");
        throw error;
      }

      setRequisitionRequests(data);
    } catch (error) {
      setError("Failed to fetch requisition requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequisitionRequests();
  }, []);

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

  useEffect(() => {
    fetchRequisitionTypes();
    fetchRequisitionInventories();
  }, [fetchRequisitionTypes, fetchRequisitionInventories]);
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
      <h1 className="text-xl font-bold text-[#003366]">Requisition History</h1>

      {requisitionRequests.length > 0 &&
        requisitionRequests.map((req) => (
          <div
            key={req.id}
            className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1 space-y-2 text-sm text-gray-800">
                <p>
                  <span className="font-bold">Category:</span>{" "}
                  {
                    requisitionTypes.find(
                      (type) => type.id === req.requisition_category_id
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Item:</span>{" "}
                  {
                    requisitionInventories.find(
                      (item) => item.id === req.item_id
                    )?.name
                  }
                </p>
                <p>
                  <span className="font-bold">Quantity:</span> {req.quantity}
                </p>
                {req.date && (
                  <p>
                    <span className="font-bold">Date:</span> {req.date}
                  </p>
                )}
                {req.from_time && (
                  <p>
                    <span className="font-bold">From:</span> {req.from_time}
                  </p>
                )}
                {req.to_time && (
                  <p>
                    <span className="font-bold">To:</span> {req.to_time}
                  </p>
                )}
                <p>
                  <span className="font-bold">Requested by:</span>{" "}
                  {
                    employees.find(
                      (employee) => employee.id === req.employee_id
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
      {requisitionRequests.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          No requisition requests available.
        </div>
      )}
    </div>
  );
}
