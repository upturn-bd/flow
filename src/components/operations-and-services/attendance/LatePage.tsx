"use client";

import { Attendance } from "@/hooks/useAttendance";
import { getEmployeeInfo } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaCalendarAlt, FaSearch, FaEllipsisV } from "react-icons/fa";
import { formatTimeFromISO, formatDateToDayMonth } from "@/lib/utils";
import { useSites } from "@/hooks/useAttendanceManagement";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { Clock } from "lucide-react";

const ClickableStatusCell = ({
  tag,
  handleRequest,
}: {
  tag: string;
  handleRequest: () => void;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center justify-between w-full">
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
        tag === "Late" ? "bg-yellow-100 text-yellow-800" : "bg-orange-100 text-orange-800"
      }`}>
        {tag === "Late" ? "Late" : "Wrong Location"}
      </span>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle menu"
        >
          <FaEllipsisV className="text-sm" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-1 bg-white border shadow-lg rounded-md py-1 w-40 z-10">
            <button
              onClick={() => {
                handleRequest();
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              Send to Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AttendanceLatePage() {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const { sites, fetchSites } = useSites();

  async function fetchAttendanceData() {
    setLoading(true);
    
    const user = await getEmployeeInfo();
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, check_in_time, check_out_time, site_id, attendance_date, tag, employee_id")
        .eq("employee_id", user.id)
        .eq("company_id", user.company_id)
        .or("tag.eq.Late, tag.eq.Wrong_Location")
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      setAttendanceData(data ?? []);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(id: number) {
    
    const user = await getEmployeeInfo();
    try {
      const { error } = await supabase
        .from("attendance_records")
        .update({ tag: "Pending" })
        .eq("employee_id", user.id)
        .eq("company_id", user.company_id)
        .eq("id", id);

      if (error) throw error;
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up';
      notification.innerHTML = 'Request sent successfully';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('animate-fade-out');
        setTimeout(() => document.body.removeChild(notification), 500);
      }, 3000);
      
      fetchAttendanceData();
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

  return (
    <div className="bg-white rounded-lg shadow-sm">
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
        
        {/* Table */}
        {loading ? (
          <LoadingSection 
          text="Loading attendance records..."
          icon={Clock}
          color="blue"
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.length > 0 ? (
                  attendanceData.map((entry, idx) => (
                    <tr 
                      key={idx}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDateToDayMonth(entry.attendance_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {sites.length > 0 && sites.filter((site) => site.id === entry.site_id)[0]?.name || "Unknown Site"}
                        {sites.length === 0 && (
                          <span className="inline-flex items-center animate-pulse text-gray-400">
                            Loading...
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {entry.check_in_time && formatTimeFromISO(entry.check_in_time)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {entry.check_out_time ? formatTimeFromISO(entry.check_out_time) : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ClickableStatusCell
                          tag={entry.tag}
                          handleRequest={() => handleRequest(entry.id!)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-sm text-gray-500 text-center">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
