"use client";

import { supabase } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { LeaveState } from "./LeaveCreatePage";
import { motion, AnimatePresence } from "framer-motion";
import { useEmployees } from "@/hooks/useEmployees";
import { useLeaveTypes } from "@/hooks/useConfigTypes";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { Calendar, User, FileText, Clock } from "lucide-react";
import { Card, CardHeader, CardContent, StatusBadge, InfoRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCompanyId, getEmployeeInfo } from "@/lib/utils/auth";

export default function LeaveHistoryPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypes();
  const { employees, fetchEmployees } = useEmployees();

  async function fetchComplaintRequests() {
    setLoading(true);

    const user = await getEmployeeInfo();
    const company_id = await getCompanyId();
    try {
      const { data, error } = await supabase
        .from("leave_records")
        .select("*")
        .eq("company_id", company_id)
        .eq("employee_id", user.id);

      if (error) {
        setError("Failed to fetch leave requests");
        throw error;
      }

      setLeaveRequests(data);
    } catch (error) {
      setError("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComplaintRequests();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  if (loading) {
    return (
      <LoadingSection 
          text="Loading leave history..."
          icon={Calendar}
          color="blue"
          />
    );
  }
  if (error) {
    return (
      <EmptyState 
        icon={<Calendar className="h-12 w-12" />}
        title="Error loading leave history"
        description={error}
      />
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Calendar size={24} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Leave History</h1>
      </div>

      {leaveRequests.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {leaveRequests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader 
                    title={leaveTypes.find((type) => type.id === req.type_id)?.name || "Unknown Leave Type"}
                    subtitle={`${req.start_date} - ${req.end_date}`}
                    icon={<Calendar size={20} />}
                    action={
                      <StatusBadge 
                        status={req.status || "pending"} 
                        variant={
                          req.status === "Accepted" ? "success" : 
                          req.status === "Rejected" ? "error" : "warning"
                        }
                      />
                    }
                  />
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoRow 
                        icon={<User size={16} />}
                        label="Requested by"
                        value={
                          employees.find(employee => employee.id === req.employee_id)?.name || "Unknown"
                        }
                      />
                      
                      <InfoRow 
                        icon={<Clock size={16} />}
                        label="Duration"
                        value={`${req.start_date} to ${req.end_date}`}
                      />
                    </div>
                    
                    {req.description && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-start gap-2">
                          <FileText size={16} className="text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm text-gray-700 mb-1">Description:</p>
                            <p className="text-sm text-gray-600">{req.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState 
          icon={<Calendar className="h-12 w-12" />}
          title="No leave history"
          description="You haven't submitted any leave requests yet"
        />
      )}
    </div>
  );
}
