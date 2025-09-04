'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, CheckSquare, MapPin } from 'lucide-react';
import { cn } from '@/components/ui/class';
import SectionHeader from './SectionHeader';
import LoadingSection from './LoadingSection';
import { formatDateToDayMonth, formatTimeFromISO } from '@/lib/utils';
import { Attendance } from '@/lib/types/schemas';
import { getEmployeeInfo } from '@/lib/utils/auth';
import { supabase } from '@/lib/supabase/client';
import ClickableStatusCell from '@/components/operations-and-services/attendance/ClickableStatusCell';

interface Site {
  id?: number;
  name: string;
  longitude: number;
  latitude: number;
  check_in: string;
  check_out: string;
  location: string;
  company_id?: number;
}

interface AttendanceRecord {
  tag: string;
  site_id: number | undefined;
}

interface AttendanceStatus {
  checkIn: boolean;
  checkOut: boolean;
}

interface AttendanceSectionProps {
  loading: boolean;
  attendanceStatus: AttendanceStatus;
  attendanceRecord: AttendanceRecord;
  sites: Site[];
  sitesLoading: boolean;
  onRecordChange: (record: AttendanceRecord) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export default function AttendanceSection({
  loading,
  attendanceStatus,
  attendanceRecord,
  sites,
  sitesLoading,
  onRecordChange,
  onCheckIn,
  onCheckOut,
}: AttendanceSectionProps) {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);

  async function fetchAttendanceDataToday() {
    const user = await getEmployeeInfo();
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, check_in_time, check_out_time, site_id, attendance_date, tag, employee_id")
        .eq("employee_id", user.id)
        .eq("company_id", user.company_id)
        .eq("attendance_date", new Date().toISOString().split('T')[0])
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      setAttendanceData(data ?? []);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  }

  useEffect(() => {
    fetchAttendanceDataToday();
  });

  return (
    <>
      <SectionHeader title="Attendance Today" icon={Calendar} />
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        {loading ? (
          <LoadingSection text="Loading attendance status..." icon={Calendar} />
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-4">

              {attendanceStatus.checkOut && attendanceStatus.checkIn && (
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  <span>Both check-in and check-out completed for today</span>
                </div>
              )}

              {!attendanceStatus.checkOut && attendanceStatus.checkIn && (
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  <span>Check-in completed for today</span>
                </div>
              )}

              {!attendanceStatus.checkIn && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center text-gray-700 font-medium">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                      Site Location
                    </label>
                    <select
                      value={attendanceRecord.site_id}
                      onChange={(e) =>
                        onRecordChange({
                          ...attendanceRecord,
                          site_id: Number(e.target.value),
                        })
                      }
                      className="border border-gray-300 rounded-lg px-4 py-2.5 bg-[#EAF4FF] focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                    >
                      <option value="">
                        {sitesLoading ? "Loading..." : "Select site"}
                      </option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="self-end md:self-center">
              {!attendanceStatus.checkIn && !attendanceStatus.checkOut && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={onCheckIn}
                  disabled={!attendanceRecord.site_id || !attendanceRecord.tag}
                  className={cn(
                    "bg-blue-600 text-white font-medium rounded-lg px-5 py-2.5 flex items-center gap-2",
                    (!attendanceRecord.site_id || !attendanceRecord.tag) &&
                    "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Clock size={18} />
                  Check-in
                </motion.button>
              )}

              {attendanceStatus.checkIn && !attendanceStatus.checkOut && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCheckOut}
                  type="button"
                  className="bg-yellow-500 text-white font-medium rounded-lg px-5 py-2.5 flex items-center gap-2"
                >
                  <CheckSquare size={18} />
                  Check-out
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 mt-10">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
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
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sites.length > 0 &&
                        sites.filter((site) => site.id === entry.site_id)[0]
                          ?.name || "Unknown Site"}
                      {sites.length === 0 && (
                        <span className="inline-flex items-center animate-pulse text-gray-400">
                          Loading...
                        </span>
                      )}
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
                      {entry.tag === "Present" ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Present
                        </span>
                      ) : (
                        <ClickableStatusCell
                          tag={entry.tag}
                          id={entry.id!}
                        />
                      )}
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
      </div>
    </>
  );
}
