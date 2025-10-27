"use client";

import { Attendance } from "@/hooks/useAttendance";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { FaChevronDown, FaCalendarAlt, FaSearch } from "react-icons/fa";
import { formatTimeFromISO, formatDateToDayMonth } from "@/lib/utils";
import { useSites } from "@/hooks/useAttendanceManagement";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { Clock } from "lucide-react";
import { getEmployeeInfo } from "@/lib/utils/auth";

export default function AttendanceRecordsPage() {
    const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(false);

    // filters
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [siteId, setSiteId] = useState("");

    const { sites, fetchSites } = useSites();

    async function fetchAttendanceData() {
        setLoading(true);
        const user = await getEmployeeInfo();

        try {
            let query = supabase
                .from("attendance_records")
                .select(
                    "id, check_in_time, check_out_time, site_id, attendance_date, tag, employee_id"
                )
                .eq("employee_id", user.id)
                .eq("company_id", user.company_id)
                .order("attendance_date", { ascending: false });

            // apply filters if provided
            if (fromDate) {
                query = query.gte("attendance_date", fromDate);
            }
            if (toDate) {
                query = query.lte("attendance_date", toDate);
            }
            if (siteId) {
                query = query.eq("site_id", siteId);
            }

            const { data, error } = await query;
            if (error) throw error;

            setAttendanceData(data ?? []);
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

    // Tag color styles
    const tagStyles: Record<string, string> = {
        Present: "bg-green-100 text-green-800",
        Absent: "bg-red-100 text-red-800",
        Late: "bg-yellow-100 text-yellow-800",
        On_Leave: "bg-blue-100 text-blue-800",
        Wrong_Location: "bg-purple-100 text-purple-800",
        Pending: "bg-yellow-100 text-yellow-800",
    };

    // summary counts for current month
    const currentMonthCounts = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const counts: Record<string, number> = {};

        attendanceData.forEach((entry) => {
            const entryDate = new Date(entry.attendance_date);
            if (
                entryDate.getMonth() === thisMonth &&
                entryDate.getFullYear() === thisYear
            ) {
                const tag = entry.tag || "Unknown";
                counts[tag] = (counts[tag] || 0) + 1;
            }
        });

        return counts;
    }, [attendanceData]);

    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 sm:p-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
                    {/* From Date */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaCalendarAlt className="text-gray-400" />
                        </div>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto min-w-[160px] text-sm"
                        />
                    </div>

                    {/* To Date */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaCalendarAlt className="text-gray-400" />
                        </div>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto min-w-[160px] text-sm"
                        />
                    </div>

                    {/* Site Select */}
                    <div className="relative w-full sm:w-auto min-w-[160px]">
                        <select
                            value={siteId}
                            onChange={(e) => setSiteId(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
                        >
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

                    {/* Search Button */}
                    <button
                        onClick={fetchAttendanceData}
                        className="bg-[#192D46] text-white rounded-lg px-4 py-2.5 font-medium hover:bg-[#0f1c2d] transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                        <FaSearch />
                        <span>Search</span>
                    </button>
                </div>

                {/* Summary Overview */}
                <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-700 mb-3">
                        Attendance Overview –{" "}
                        {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {Object.entries(currentMonthCounts).map(([tag, count]) => (
                            <div
                                key={tag}
                                className={`px-3 py-2 rounded-lg text-center text-sm font-semibold ${tagStyles[tag] || "bg-gray-100 text-gray-800"
                                    }`}
                            >
                                <div>{tag.replace(/_/g, " ")}</div>
                                <div className="text-lg">{count}</div>
                            </div>
                        ))}
                    </div>
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Site
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Check-In
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Check-Out
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
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
                                                {sites.find((site) => site.id === entry.site_id)?.name ||
                                                    "Unknown Site"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                {entry.check_in_time &&
                                                    formatTimeFromISO(entry.check_in_time)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                {entry.check_out_time
                                                    ? formatTimeFromISO(entry.check_out_time)
                                                    : "N/A"}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={`px-3 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full w-28 ${tagStyles[entry.tag] ||
                                                        "bg-gray-100 text-gray-800"
                                                        }`}
                                                >
                                                    {entry.tag.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-sm text-gray-500 text-center"
                                        >
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
