"use client";

import { Attendance } from "@/hooks/useAttendance";
import { getUserInfo } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { formatTimeFromISO, formatDateToDayMonth } from "@/lib/utils";
import { useSites } from "@/hooks/useAttendanceManagement";

export default function AttendanceAbsentPage() {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const { sites, fetchSites } = useSites();

  async function fetchAttendanceData() {
    setLoading(true);
    const supabase = createClient();
    const user = await getUserInfo();
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("check_in_time, check_out_time, site_id, attendance_date")
        .eq("employee_id", user.id)
        .eq("company_id", user.company_id)
        .eq("tag", "Absent")
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      setAttendanceData(data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white flex">
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
        <div className="mt-6 overflow-x-auto">
          <table className="border border-gray-100 w-full text-sm text-left">
            <thead>
              <tr className="bg-[#ECF5FF] text-[#0E1F33] font-semibold">
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Site</th>
                <th className="py-2 px-4">Check-In</th>
                <th className="py-2 px-4">Check-Out</th>
                <th className="py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length > 0 &&
                attendanceData.map((entry, idx) => (
                  <tr
                    key={idx}
                    className="bg-white border-b py-2 border-gray-200 rounded-xl shadow-sm"
                  >
                    <td className="py-2 px-4">
                      {formatDateToDayMonth(entry.attendance_date)}
                    </td>
                    <td className="py-2 px-4">
                      {
                        sites.length > 0 && sites.filter((site) => site.id === entry.site_id)[0]
                          .name
                      }
                      {sites.length === 0 && "Loading..."}
                    </td>
                     <td className="py-2 px-4">
                      {entry.check_in_time && formatTimeFromISO(entry.check_in_time)}
                    </td>
                    <td className="py-2 px-4">
                      {entry.check_out_time? formatTimeFromISO(entry.check_out_time): "N/A"}
                    </td>
                    <td className="py-2 px-4">
                      <span>Absent</span>
                    </td>
                  </tr>
                ))}
              {attendanceData.length === 0 && (
                <tr className="bg-white border-b py-2 border-gray-200 rounded-xl shadow-sm">
                  <td colSpan={5} className="py-2 px-4 text-center">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
