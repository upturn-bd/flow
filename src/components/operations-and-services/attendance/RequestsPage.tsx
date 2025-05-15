"use client";

import { Attendance } from "@/hooks/useAttendance";
import { getUserInfo } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/client";
import { use, useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import {
  formatTimeFromISO,
  formatDateToDayMonth,
  getLatitude,
  getLongitude,
} from "@/lib/utils";
import { useSites } from "@/hooks/useAttendanceManagement";
import { useEmployees } from "@/hooks/useEmployees";

export default function AttendanceRequestsPage() {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const { sites, fetchSites } = useSites();
  const { employees, fetchEmployees } = useEmployees();
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [updateTag, setUpdateTag] = useState<string>("");

  async function fetchAttendanceData() {
    setLoading(true);
    const supabase = createClient();
    const user = await getUserInfo();
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select(
          "id, check_in_time, check_out_time, site_id, attendance_date, employee_id, check_out_coordinates, check_in_coordinates"
        )
        .eq("supervisor_id", user.id)
        .eq("company_id", user.company_id)
        .eq("tag", "Pending")
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      setAttendanceData(data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const user = await getUserInfo();
    try {
      const { error } = await supabase
        .from("attendance_records")
        .update({ tag: updateTag })
        .eq("company_id", user.company_id)
        .eq("id", selectedRecord?.id);

      if (error) throw error;
      alert("Attendance request updated successfully");
      fetchAttendanceData();
      setSelectedRecord(null);
      setUpdateTag("");
    } catch (error) {
      console.error("Error updating attendance data:", error);
    }
  }

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white flex">
      {!selectedRecord && (
        <main className="flex-1 p-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            <input
              type="text"
              placeholder="From"
              className="border rounded-xl px-4 py-2 w-[150px]"
            />
            <input
              type="text"
              placeholder="To"
              className="border rounded-xl px-4 py-2 w-[150px]"
            />
            <div className="relative w-[150px]">
              <select className="appearance-none border rounded-xl px-4 py-2 w-full">
                <option>Site</option>
              </select>
              <FaChevronDown className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400" />
            </div>
            <button className="bg-[#0E1F33] text-white rounded-lg px-6 py-2 font-semibold">
              Search
            </button>
          </div>
          {/* Table */}
          <div className="mt-6 overflow-x-auto space-y-6">
            {attendanceData.length > 0 &&
              attendanceData.map((entry, idx) => (
                <div
                  key={idx}
                  className="bg-gray-100 rounded-xl p-6 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1 space-y-2 text-sm text-gray-800">
                      <p>
                        <span className="font-bold">Attendance Date:</span>{" "}
                        {formatDateToDayMonth(entry.attendance_date)}
                      </p>
                      <p>
                        <span className="font-bold">Check-in:</span>{" "}
                        {formatTimeFromISO(entry.check_in_time)}
                      </p>
                      <p>
                        <span className="font-bold">Check-out:</span>{" "}
                        {entry.check_out_time
                          ? formatTimeFromISO(entry.check_out_time)
                          : "N/A"}
                      </p>
                      <p>
                        <span className="font-bold">Check-in Location:</span>{" "}
                        <a
                          className="text-blue-500 underlined"
                          target="_blank"
                          href={`https://www.openstreetmap.org/?mlat=${getLatitude(
                            entry.check_in_coordinates
                          )}&mlon=${getLongitude(entry.check_in_coordinates)}`}
                        >
                          URL
                        </a>
                      </p>
                      <p>
                        <span className="font-bold">Check-out Location:</span>{" "}
                        {entry.check_out_coordinates ? (
                          <a
                            className="text-blue-500 underlined"
                            target="_blank"
                            href={`https://www.openstreetmap.org/?mlat=${getLatitude(
                              entry.check_out_coordinates
                            )}&mlon=${getLongitude(
                              entry.check_out_coordinates
                            )}`}
                          >
                            URL
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </p>
                      <p>
                        <span className="font-bold">Site:</span>{" "}
                        {sites.length > 0 &&
                          sites.filter((site) => site.id === entry.site_id)[0]
                            .name}
                        {sites.length === 0 && "Loading..."}
                      </p>
                      <p>
                        <span className="font-bold">Employee:</span>{" "}
                        {
                          employees.find(
                            (employee) => employee.id === entry.employee_id
                          )?.name
                        }
                      </p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(entry)}
                          className="bg-[#0E1F33] text-white rounded-lg px-6 py-2 font-semibold"
                        >
                          Review request
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {attendanceData.length === 0 && (
              <div className="bg-white border-b py-2 border-gray-200 rounded-xl shadow-sm">
                <div className="py-2 px-4 text-center">
                  No attendance records found.
                </div>
              </div>
            )}
          </div>
        </main>
      )}
      {/* Comment Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
          <form
            onSubmit={handleRequest}
            className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold">Add Comment</h2>
            <div>
              <label className="block text-lg font-bold text-blue-700">
                Status
              </label>
              <div className="relative">
                <select
                  onChange={(e) => setUpdateTag(e.target.value)}
                  value={updateTag}
                  className="w-full bg-blue-100 rounded p-3 appearance-none"
                >
                  <option value={0}>Select Status</option>
                  {["Present", "Absent", "Late", "Wrong_Location"].map(
                    (status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    )
                  )}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="fill-yellow-400" width="10" height="10">
                    <polygon points="0,0 10,0 5,6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setSelectedRecord(null)}
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!updateTag}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
