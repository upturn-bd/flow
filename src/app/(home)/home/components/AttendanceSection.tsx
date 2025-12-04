'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckSquare, MapPin, Navigation, AlertTriangle, AlertCircle, CheckCircle } from '@/lib/icons';
import { cn } from '@/components/ui/class';
import SectionHeader from './SectionHeader';
import LoadingSection from './LoadingSection';
import { formatTimeFromISO } from '@/lib/utils';
import { calculateDistanceFromCoords, formatDistance } from '@/lib/utils/location-utils';
import { isOnTime, getCurrentTime24HourFormat, checkLateStatus, checkEarlyCheckOut } from '@/lib/utils/time-utils';
import { Attendance } from '@/lib/types/schemas';
import { getEmployeeInfo } from '@/lib/utils/auth';
import { supabase } from '@/lib/supabase/client';
import ClickableStatusCell from '@/components/ops/attendance/ClickableStatusCell';

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
  attendanceLoading: boolean;
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
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [checkInCompleted, setCheckInCompleted] = useState(false)
  const [checkOutCompleted, setCheckOutCompleted] = useState(false)
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Get user's current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Automatically get location when site is selected
  useEffect(() => {
    if (attendanceRecord.site_id && !checkInCompleted) {
      getCurrentLocation();
    }
  }, [attendanceRecord.site_id, checkInCompleted]);

  // Calculate distance to selected site
  const getDistanceToSite = (): number | null => {
    if (!userLocation || !attendanceRecord.site_id) return null;

    const selectedSite = sites.find(site => site.id === attendanceRecord.site_id);
    if (!selectedSite) return null;

    return calculateDistanceFromCoords(
      userLocation.lat,
      userLocation.lng,
      selectedSite.latitude,
      selectedSite.longitude
    );
  };

  async function fetchAttendanceDataToday() {
    setAttendanceLoading(true);
    const user = await getEmployeeInfo();
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, check_in_time, check_out_time, site_id, attendance_date, tag, employee_id")
        .eq("employee_id", user.id)
        .eq("company_id", user.company_id)
        .eq("attendance_date", new Date().toLocaleDateString('sv-SE'))
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      setAttendanceData(data ?? []);

      if (data[0]) {
        if (data[0].check_in_time !== undefined && data[0].check_in_time !== null) {
          setCheckInCompleted(true)
        }

        if (data[0].check_out_time !== undefined && data[0].check_out_time !== null) {
          setCheckOutCompleted(true)
        }

      }

      setAttendanceLoading(false);

    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  }


  const handleCheckIn = async () => {
    if (isCheckingIn) return; // Prevent duplicate clicks
    
    setIsCheckingIn(true);
    try {
      await onCheckIn();
      await fetchAttendanceDataToday();
    } catch (error) {
      console.error("Error during check-in:", error);
    } finally {
      setIsCheckingIn(false);
    }
  }

  const handleCheckOut = async () => {
    if (isCheckingOut) return; // Prevent duplicate clicks
    
    setIsCheckingOut(true);
    try {
      await onCheckOut();
      await fetchAttendanceDataToday();
    } catch (error) {
      console.error("Error during check-out:", error);
    } finally {
      setIsCheckingOut(false);
    }
  }

  useEffect(() => {
    fetchAttendanceDataToday();
  }, []);

  return (
    <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary h-full flex flex-col overflow-hidden">
      <div className="p-5 shrink-0">
        <SectionHeader title="Attendance Today" icon={Calendar} />
      </div>
      <div className="px-5 pb-5 flex-1 overflow-y-auto min-h-0">
        {loading || attendanceLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSection text="Loading attendance status..." icon={Calendar} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Messages */}
            {checkOutCompleted && checkInCompleted && (
              <div className="flex items-center text-green-600 font-medium">
                <CheckCircle className="mr-2 h-5 w-5" />
                <span>Both check-in and check-out completed for today</span>
              </div>
            )}

            {!checkOutCompleted && checkInCompleted && (
              <div className="flex items-center text-green-600 font-medium">
                <CheckCircle className="mr-2 h-5 w-5" />
                <span>Check-in completed for today</span>
              </div>
            )}

            {/* Check-in Form */}
            {!checkInCompleted && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  {/* Site Selection */}
                  <div className="flex flex-col gap-2 flex-1 w-full sm:w-auto">
                    <label className="flex items-center text-foreground-primary font-medium text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-primary-600" />
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
                      className="border border-border-primary rounded-lg px-4 py-2.5 bg-surface-primary focus:ring-primary-500 focus:border-primary-500 w-full"
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

                  {/* Check-in Button */}
                  <motion.button
                    whileHover={{ scale: isCheckingIn ? 1 : 1.05 }}
                    whileTap={{ scale: isCheckingIn ? 1 : 0.95 }}
                    type="button"
                    onClick={handleCheckIn}
                    disabled={!attendanceRecord.site_id || !attendanceRecord.tag || isCheckingIn}
                    className={cn(
                      "bg-primary-600 text-white font-medium rounded-lg px-6 py-2.5 flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap",
                      (!attendanceRecord.site_id || !attendanceRecord.tag || isCheckingIn) &&
                      "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Clock size={18} className={isCheckingIn ? "animate-spin" : ""} />
                    {isCheckingIn ? "Checking in..." : "Check-in"}
                  </motion.button>
                </div>

                {/* Location Status */}
                {attendanceRecord.site_id && (
                  <div className="space-y-3">
                    {locationLoading && (
                      <div className="flex items-center gap-2 text-primary-600 text-sm">
                        <Navigation className="w-4 h-4 animate-spin" />
                        Getting your location...
                      </div>
                    )}

                    {locationError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {locationError}
                      </div>
                    )}

                    {userLocation && !locationLoading && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-primary-800">
                              Distance to Site:
                            </span>
                          </div>
                          <span className="text-sm font-bold text-primary-900">
                            {formatDistance(getDistanceToSite() || 0)}
                          </span>
                        </div>

                        {getDistanceToSite() && getDistanceToSite()! > 100 && (
                          <div className="flex items-center gap-2 mt-2 text-amber-700 text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            You are more than 100m away from the site
                          </div>
                        )}
                      </div>
                    )}

                    {/* Time Status */}
                    {(() => {
                      const selectedSite = sites.find(site => site.id === attendanceRecord.site_id);
                      const currentTime = getCurrentTime24HourFormat();
                      const isLate = selectedSite && !isOnTime({
                        checkInTime: selectedSite.check_in,
                        currentTime: currentTime
                      });

                      if (selectedSite) {
                        return (
                          <div className={`border rounded-lg p-3 ${isLate ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${isLate ? 'text-red-600' : 'text-green-600'}`} />
                                <span className={`text-sm font-medium ${isLate ? 'text-red-800' : 'text-green-800'}`}>
                                  Current Time: {currentTime}
                                </span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${isLate
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                                }`}>
                                {isLate ? 'Late' : 'On Time'}
                              </span>
                            </div>
                            <div className={`text-xs mt-1 ${isLate ? 'text-red-700' : 'text-green-700'}`}>
                              Expected check-in: {selectedSite.check_in}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Check-out Button */}
            {checkInCompleted && !checkOutCompleted && (
              <div className="flex justify-start">
                <motion.button
                  whileHover={{ scale: isCheckingOut ? 1 : 1.05 }}
                  whileTap={{ scale: isCheckingOut ? 1 : 0.95 }}
                  onClick={handleCheckOut}
                  type="button"
                  disabled={isCheckingOut}
                  className={cn(
                    "bg-yellow-500 text-white font-medium rounded-lg px-6 py-2.5 flex items-center gap-2 w-full sm:w-auto",
                    isCheckingOut && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <CheckSquare size={18} className={isCheckingOut ? "animate-spin" : ""} />
                  {isCheckingOut ? "Checking out..." : "Check-out"}
                </motion.button>
              </div>
            )}

        {/* TABLE - Simplified for widget view */}
        {attendanceData.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border-primary">
          <table className="min-w-full divide-y divide-border-primary">
            <thead>
              <tr className="bg-background-secondary">
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Site
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Check-In
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Check-Out
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-primary divide-y divide-border-primary">
              {attendanceData.slice(0, 3).map((entry, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-surface-hover transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-sm text-foreground-primary">
                    {sites.length > 0 &&
                      sites.filter((site) => site.id === entry.site_id)[0]
                        ?.name || "Unknown Site"}
                    {sites.length === 0 && (
                      <span className="inline-flex items-center animate-pulse text-foreground-tertiary">
                        Loading...
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-primary whitespace-nowrap">
                    {entry.check_in_time && (
                      <div className="space-y-1">
                        <div className='mb-2' >{formatTimeFromISO(entry.check_in_time)}</div>
                        {sites.length > 0 && (() => {
                          const site = sites.find(s => s.id === entry.site_id);
                          if (site) {
                            const lateStatus = checkLateStatus(
                              formatTimeFromISO(entry.check_in_time),
                              site.check_in
                            );
                            return (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${lateStatus === 'late'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                                }`}>
                                {lateStatus === 'late' ? 'Late' : 'On Time'}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-primary whitespace-nowrap">
                    {entry.check_out_time ? (
                      <div className="space-y-1">
                        <div className='mb-2'>{formatTimeFromISO(entry.check_out_time)}</div>
                        {sites.length > 0 && (() => {
                          const site = sites.find(s => s.id === entry.site_id);
                          if (site) {
                            const earlyStatus = checkEarlyCheckOut(
                              formatTimeFromISO(entry.check_out_time),
                              site.check_out
                            );
                            return (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${earlyStatus === 'early'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                                }`}>
                                {earlyStatus === 'early' ? 'Early' : 'On Time'}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      "N/A"
                    )}
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
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-background-secondary rounded-full p-4 mb-4">
              <Calendar className="w-12 h-12 text-foreground-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground-primary mb-2">
              No Attendance Record Today
            </h3>
            <p className="text-sm text-foreground-secondary text-center max-w-sm">
              You haven&apos;t checked in yet. Select a site location above and check in to start your attendance for today.
            </p>
          </div>
        )}
        </div>
        )}
      </div>
    </div>
  );
}
