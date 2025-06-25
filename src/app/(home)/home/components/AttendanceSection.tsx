'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, CheckSquare, MapPin } from 'lucide-react';
import { cn } from '@/components/ui/class';
import SectionHeader from './SectionHeader';
import LoadingSection from './LoadingSection';

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
  return (
    <>
      <SectionHeader title="Attendance" icon={Calendar} />
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        {loading ? (
          <LoadingSection text="Loading attendance status..." icon={Calendar} />
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              {!attendanceStatus.checkOut && !attendanceStatus.checkIn && (
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  <span>Check-in and check-out completed for today</span>
                </div>
              )}
              
              {attendanceStatus.checkIn && (
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
                      <option value="">{sitesLoading ? "Loading..." : "Select site"}</option>
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
            
            <div className="self-end md:self-center">
              {attendanceStatus.checkIn && attendanceStatus.checkOut && (
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

              {!attendanceStatus.checkIn && attendanceStatus.checkOut && (
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
      </div>
    </>
  );
}
