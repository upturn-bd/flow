"use client";

import { Attendance } from "@/hooks/useAttendance";
import { getUserInfo } from "@/lib/auth/getUser";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { FaChevronDown, FaCalendarAlt, FaSearch, FaMapMarkerAlt, FaUser, FaBuilding, FaClock, FaCalendarDay } from "react-icons/fa";
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
    
    const user = await getUserInfo();
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select(
          "id, check_in_time, check_out_time, site_id, attendance_date, employee_id, check_out_coordinates, check_in_coordinates, tag"
        )
        // .eq("supervisor_id", user.id)
        .eq("company_id", user.company_id)
        .eq("tag", "Pending")
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      setAttendanceData(data ?? []);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    
    const user = await getUserInfo();
    try {
      const { error } = await supabase
        .from("attendance_records")
        .update({ tag: updateTag })
        .eq("company_id", user.company_id)
        .eq("id", selectedRecord?.id);

      if (error) throw error;
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up';
      notification.innerHTML = 'Attendance request updated successfully';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('animate-fade-out');
        setTimeout(() => document.body.removeChild(notification), 500);
      }, 3000);
      
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

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {!selectedRecord ? (
        <div className="p-4 sm:p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <input
                type="date"
                placeholder="From Date"
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto min-w-[160px] text-sm"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <input
                type="date"
                placeholder="To Date"
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto min-w-[160px] text-sm"
              />
            </div>
            
            <div className="relative w-full sm:w-auto min-w-[160px]">
              <select className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm">
                <option value="">Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaChevronDown className="text-gray-400 text-xs" />
              </div>
            </div>
            
            <button className="bg-[#192D46] text-white rounded-lg px-4 py-2.5 font-medium hover:bg-[#0f1c2d] transition-colors duration-200 flex items-center justify-center gap-2 text-sm">
              <FaSearch />
              <span>Search</span>
            </button>
          </div>
          
          {/* Requests List */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mb-4"></div>
                <p className="text-gray-500 text-sm">Loading attendance requests...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceData.length > 0 ? (
                attendanceData.map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-5 space-y-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <FaCalendarDay className="text-blue-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Attendance Date</p>
                            <p className="text-sm font-medium">{formatDateToDayMonth(entry.attendance_date)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <FaUser className="text-blue-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Employee</p>
                            <p className="text-sm font-medium">
                              {employees.find((employee) => employee.id === entry.employee_id)?.name || "Unknown Employee"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <FaBuilding className="text-blue-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Site</p>
                            <p className="text-sm font-medium">
                              {sites.length > 0 && sites.filter((site) => site.id === entry.site_id)[0]?.name || "Unknown Site"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <FaClock className="text-blue-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Check-in / Check-out</p>
                            <p className="text-sm font-medium">
                              {entry.check_in_time ? formatTimeFromISO(entry.check_in_time) : "N/A"} - 
                              {entry.check_out_time ? formatTimeFromISO(entry.check_out_time) : "N/A"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <FaMapMarkerAlt className="text-blue-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Check-in Location</p>
                            {entry.check_in_coordinates ? (
                              <a
                                className="text-sm text-blue-600 hover:underline"
                                target="_blank"
                                href={`https://www.openstreetmap.org/?mlat=${getLatitude(
                                  entry.check_in_coordinates as unknown as string
                                )}&mlon=${getLongitude(entry.check_in_coordinates as unknown as string)}`}
                              >
                                View on Map
                              </a>
                            ) : (
                              <p className="text-sm text-gray-500">Not available</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <FaMapMarkerAlt className="text-blue-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Check-out Location</p>
                            {entry.check_out_coordinates ? (
                              <a
                                className="text-sm text-blue-600 hover:underline"
                                target="_blank"
                                href={`https://www.openstreetmap.org/?mlat=${getLatitude(
                                  entry.check_out_coordinates as unknown as string
                                )}&mlon=${getLongitude(entry.check_out_coordinates as unknown as string)}`}
                              >
                                View on Map
                              </a>
                            ) : (
                              <p className="text-sm text-gray-500">Not available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(entry)}
                        className="bg-[#192D46] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#0f1c2d] transition-colors duration-200 flex items-center gap-2"
                      >
                        Review Request
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <p className="text-gray-500">No attendance requests found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b">Review Attendance Request</h2>
              
              <form onSubmit={handleRequest} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update Status
                  </label>
                  <div className="relative">
                    <select
                      onChange={(e) => setUpdateTag(e.target.value)}
                      value={updateTag}
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm"
                    >
                      <option value="">Select Status</option>
                      {["Present", "Absent", "Late", "Wrong_Location"].map(
                        (status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        )
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaChevronDown className="text-gray-400 text-xs" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium text-sm"
                    onClick={() => setSelectedRecord(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#192D46] text-white rounded-lg hover:bg-[#0f1c2d] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    disabled={!updateTag}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
