// app/(dashboard)/onboarding/page.tsx
"use client";

import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { useEffect, useState } from "react";

interface PendingEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department: string;
  designation: string;
  job_status: string;
  hire_date: string;
  supervisor_id: string;
}

const Button = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`text-white rounded-md px-4 py-2 text-sm font-semibold ${className}`}
    {...props}
  >
    {children}
  </button>
);
const Textarea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={`w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

export default function OnboardingApprovalPage() {
  const [requests, setRequests] = useState<PendingEmployee[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    fetch("/api/onboarding/pending")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) setRequests(data.data);
      })
      .finally(() => setLoading(false));
    const fetchEmployees = async () => {
      try {
        const response = await getEmployeesInfo();
        setEmployees(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchEmployees();
  }, []);

  const handleInputChange = (id: string, value: string) => {
    setRejectionReasons((prev) => ({ ...prev, [id]: value }));
  };

  const handleAction = async (id: string, action: "ACCEPTED" | "REJECTED") => {
    const reason = rejectionReasons[id] || null;

    const res = await fetch("/api/onboarding/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reason }),
    });

    const result = await res.json();

    if (res.ok) {
      setToast({
        type: "success",
        message: `User ${action.toLowerCase()} successfully`,
      });
      setRequests((prev) => prev.filter((emp) => emp.id !== id));
    } else {
      setToast({
        type: "error",
        message: result.error || "Something went wrong",
      });
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (requests.length === 0)
    return <p className="text-center mt-10">No pending requests</p>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-md shadow-md text-white transition-all duration-300 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <h2 className="text-2xl font-bold text-blue-700">New User Requests</h2>

      {requests.map((emp) => (
        <div
          key={emp.id}
          className="bg-gray-100 rounded-lg p-4 shadow-sm space-y-3"
        >
          <div className="font-semibold text-sm">
            {emp.first_name} {emp.last_name}
            <span className="text-gray-500 font-normal">{emp.designation}</span>
          </div>
          <div className="text-sm space-y-1">
            <p>
              <strong>Department:</strong> {emp.department}
            </p>
            <p>
              <strong>Phone Number:</strong> {emp.phone_number}
            </p>
            <p>
              <strong>E-mail:</strong> {emp.email}
            </p>
            <p>
              <strong>Job Status:</strong> {emp.job_status}
            </p>
            <p>
              <strong>Joining Date:</strong> {emp.hire_date}
            </p>
            <p>
              <strong>Supervisor:</strong>
              {employees.length > 0 && employees.filter((e) => e.id === emp.supervisor_id)[0]?.name}
            </p>
          </div>

          <Textarea
            placeholder="Reason for rejection (If applicable)"
            value={rejectionReasons[emp.id] || ""}
            onChange={(e) => handleInputChange(emp.id, e.target.value)}
          />

          <div className="flex gap-4 mt-2">
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleAction(emp.id, "REJECTED")}
            >
              Reject
            </Button>
            <Button
              className="bg-blue-900 hover:bg-blue-950"
              onClick={() => handleAction(emp.id, "ACCEPTED")}
            >
              Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
