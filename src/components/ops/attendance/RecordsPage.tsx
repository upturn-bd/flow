"use client";

import { Attendance } from "@/hooks/useAttendance";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { CaretDown, Calendar } from "@/lib/icons";
import { formatTimeFromISO, formatDateToDayMonth } from "@/lib/utils";
import LoadingSection from "@/app/(home)/home/components/LoadingSection";
import { Clock } from "@/lib/icons";
import { getEmployeeInfo } from "@/lib/utils/auth";

export default function AttendanceRecordsPage() {
   const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
   const [loading, setLoading] = useState(false);

   // Filters
   const currentDate = new Date();
   const defaultMonth = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
   ).padStart(2, "0")}`;
   const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
   const [selectedStatus, setSelectedStatus] = useState("");

   async function fetchAttendanceData() {
      setLoading(true);
      const user = await getEmployeeInfo();

      try {
         // Calculate start and end of selected month
         const [year, month] = selectedMonth.split("-");
         const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
         const monthEnd = new Date(parseInt(year), parseInt(month), 0);

         let query = supabase
            .from("attendance_records")
            .select(
               "id, check_in_time, check_out_time, site_id, attendance_date, tag, employee_id"
            )
            .eq("employee_id", user.id)
            .eq("company_id", user.company_id)
            .gte("attendance_date", monthStart.toISOString().split("T")[0])
            .lte("attendance_date", monthEnd.toISOString().split("T")[0])
            .order("attendance_date", { ascending: false });

         // Apply tag filter if selected
         if (selectedStatus) {
            query = query.eq("tag", selectedStatus);
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
   }, [selectedMonth, selectedStatus]);

   // Tag color styles
   const tagStyles: Record<string, string> = {
      Present: "bg-green-100 text-green-800",
      Absent: "bg-red-100 text-red-800",
      Late: "bg-yellow-100 text-yellow-800",
      On_Leave: "bg-blue-100 text-blue-800",
      Wrong_Location: "bg-purple-100 text-purple-800",
      Pending: "bg-yellow-100 text-yellow-800",
   };

   // Summary counts for selected month
   const currentMonthCounts = useMemo(() => {
      const [year, month] = selectedMonth.split("-");
      const counts: Record<string, number> = {};

      attendanceData.forEach((entry) => {
         const entryDate = new Date(entry.attendance_date);
         if (
            entryDate.getMonth() + 1 === parseInt(month) &&
            entryDate.getFullYear() === parseInt(year)
         ) {
            const tag = entry.tag || "Unknown";
            counts[tag] = (counts[tag] || 0) + 1;
         }
      });

      return counts;
   }, [attendanceData, selectedMonth]);

   return (
      <div className="bg-surface-primary rounded-lg shadow-sm">
         <div className="p-4 sm:p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
               {/* Choose Month */}
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Calendar className="text-foreground-tertiary" />
                  </div>
                  <input
                     type="month"
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(e.target.value)}
                     className="pl-10 pr-4 py-2.5 border border-border-secondary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-auto min-w-[160px] text-sm"
                  />
               </div>

               {/* Status Select */}
               <div className="relative w-full sm:w-auto min-w-[160px]">
                  <select
                     value={selectedStatus}
                     onChange={(e) => setSelectedStatus(e.target.value)}
                     className="appearance-none pl-4 pr-10 py-2.5 border border-border-secondary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full text-sm"
                  >
                     <option value="">All Statuses</option>
                     <option value="Present">Present</option>
                     <option value="Absent">Absent</option>
                     <option value="Late">Late</option>
                     <option value="Wrong_Location">Wrong Location</option>
                     <option value="Pending">Pending</option>
                     <option value="On_Leave">On Leave</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                     <CaretDown className="text-foreground-tertiary text-xs" />
                  </div>
               </div>
            </div>

            {/* Summary Overview */}
            <div className="mb-6">
               <h3 className="text-base font-semibold text-foreground-secondary mb-3">
                  Attendance Overview –{" "}
                  {new Date(selectedMonth + "-01").toLocaleString("default", {
                     month: "long",
                     year: "numeric",
                  })}
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(currentMonthCounts).map(([tag, count]) => (
                     <div
                        key={tag}
                        className={`px-3 py-2 rounded-lg text-center text-sm font-semibold ${tagStyles[tag] || "bg-background-tertiary dark:bg-surface-secondary text-foreground-primary"
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
               <div className="overflow-x-auto rounded-lg border border-border-primary">
                  <table className="min-w-full divide-y divide-border-primary">
                     <thead>
                        <tr className="bg-background-secondary dark:bg-background-tertiary">
                           <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider">
                              Date
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider">
                              Check-In
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider">
                              Check-Out
                           </th>
                           <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider">
                              Status
                           </th>
                        </tr>
                     </thead>
                     <tbody className="bg-background-primary divide-y divide-border-primary">
                        {attendanceData.length > 0 ? (
                           attendanceData.map((entry, idx) => (
                              <tr
                                 key={idx}
                                 className="hover:bg-background-secondary dark:bg-background-tertiary transition-colors duration-150"
                              >
                                 <td className="px-4 py-3 text-sm text-foreground-primary whitespace-nowrap">
                                    {formatDateToDayMonth(entry.attendance_date)}
                                 </td>
                                 <td className="px-4 py-3 text-sm text-foreground-primary whitespace-nowrap">
                                    {entry.check_in_time
                                       ? formatTimeFromISO(entry.check_in_time)
                                       : "N/A"}
                                 </td>
                                 <td className="px-4 py-3 text-sm text-foreground-primary whitespace-nowrap">
                                    {entry.check_out_time
                                       ? formatTimeFromISO(entry.check_out_time)
                                       : "N/A"}
                                 </td>
                                 <td className="px-4 py-3 text-sm">
                                    <span
                                       className={`px-3 py-1 inline-flex justify-center text-xs leading-5 font-semibold rounded-full w-28 ${tagStyles[entry.tag] ||
                                          "bg-background-tertiary dark:bg-surface-secondary text-foreground-primary"
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
                                 colSpan={4}
                                 className="px-4 py-8 text-sm text-foreground-tertiary text-center"
                              >
                                 No attendance records found for this month.
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
