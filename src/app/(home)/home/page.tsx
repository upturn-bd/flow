"use client";

import { useAttendanceStatus } from "@/hooks/useAttendance";
import { useSites } from "@/hooks/useAttendanceManagement";
import { useNotices } from "@/hooks/useNotice";
import { useTasks } from "@/hooks/useTasks";
import { getEmployeeInfo } from "@/lib/api/employee";
import { supabase } from "@/lib/supabase/client";
import { formatDateToDayMonth } from "@/lib/utils";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { cn } from "@/components/ui/class";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";
import { 
  Bell, 
  RefreshCw, 
  AlertCircle, 
  ChevronDown, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  XCircle,
  MapPin,
  Tag 
} from "lucide-react";
import { calculateDistance } from "@/lib/utils/location-utils";

const initialAttendanceRecord = {
  tag: "Present",
  site_id: 0,
};

export default function HomePage() {
  const [attendanceRecord, setAttendanceRecord] = useState(
    initialAttendanceRecord
  );
  const {
    attendanceStatus,
    loading: statusLoading,
    attendanceDetails,
    checkAttendanceStatus,
  } = useAttendanceStatus();
  const { sites, loading: sitesLoading, fetchSites } = useSites();
  const { notices, loading: noticesLoading, fetchNotices } = useNotices();
  const { tasks, loading: tasksLoading, fetchTasks } = useTasks();

  async function getCurrentCoordinates(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Format as PostgreSQL point string "(longitude,latitude)"
          const point = `(${position.coords.longitude},${position.coords.latitude})`;
          resolve(point);
        },
        (error) => {
          let errorMessage = "Permission denied - location access is required";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "You need to allow location access to continue";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Your location could not be determined";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get your location timed out";
              break;
            default:
              errorMessage = "An unknown error occurred while getting location";
          }

          alert(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  }
  
  const handleCheckIn = async () => {
    
    const user = await getEmployeeInfo();
    const coordinates = await getCurrentCoordinates();
    if (!coordinates) return; // Exit if permission denied

    // Get current timestamp in ISO format
    const now = new Date().toISOString();

    try {
      // Calculate tag based on site and location data
      const selectedSite = sites.find(site => site.id === attendanceRecord.site_id);
      // Present if on time and within 100m of the site
      const isOnTime = new Date(now) < new Date(selectedSite?.check_in!);
      const isWithin100m = calculateDistance(coordinates, selectedSite?.location) <= 100;
      
      // Determine attendance status
      let attendanceStatus = 'Absent';
      if (isOnTime && isWithin100m) {
        attendanceStatus = 'Present';
      } else if (!isOnTime && isWithin100m) {
        attendanceStatus = 'Late';
      } else if (!isWithin100m) {
        attendanceStatus = 'Wrong_Location';
      }
      attendanceRecord.tag = attendanceStatus;
      const { data, error } = await supabase.from("attendance_records").insert({
        ...attendanceRecord,
        attendance_date: now.split("T")[0], // Just the date part (YYYY-MM-DD)
        check_in_time: now, // Full ISO timestamp
        employee_id: user.id,
        company_id: user.company_id,
        supervisor_id: user.supervisor_id,
        check_in_coordinates: coordinates,
      });

      if (error) {
        console.error("Check-in error:", error);
        alert("Failed to record check-in");
      } else {
        alert("Check-in recorded successfully!");
        checkAttendanceStatus();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred");
    }
  };

  const handleCheckOut = async () => {
    
    const user = await getEmployeeInfo();
    const coordinates = await getCurrentCoordinates();
    if (!coordinates) return; // Exit if permission denied

    // Get current timestamp in ISO format
    const now = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .update({
          check_out_time: now,
          check_out_coordinates: coordinates,
        })
        .eq("employee_id", user.id)
        .eq("company_id", user.company_id)
        .eq("id", attendanceDetails?.id)
        .eq("attendance_date", now.split("T")[0]);

      if (error) {
        console.error("Check-out error:", error);
        alert("Failed to record check-out");
      } else {
        alert("Check-out recorded successfully!");
        checkAttendanceStatus();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred");
    }
  };

  useEffect(() => {
    fetchSites();
    fetchNotices();
    fetchTasks();
  }, [fetchSites, fetchNotices, fetchTasks]);

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5, 
        when: "beforeChildren", 
        staggerChildren: 0.2 
      } 
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 150, 
        damping: 20 
      } 
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-4xl mx-auto"
    >
      {/* News & Reminder */}
      <motion.section 
        variants={sectionVariants}
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Bell className="mr-2 h-5 w-5 text-blue-600" />
          News & Reminder
        </h2>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium mb-4">
            <button className="text-blue-600 relative px-1">
              All
              <motion.span 
                layoutId="news-tab-indicator"
                className="absolute left-0 right-0 -bottom-1 h-0.5 bg-blue-600 rounded-full" 
              />
            </button>
            <button className="text-gray-500 hover:text-gray-700">Unread</button>
            <button className="text-gray-500 hover:text-gray-700">Urgent</button>
            <button className="text-gray-500 hover:text-gray-700">Trash</button>
            
            <motion.button 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="ml-auto rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={16} className="text-gray-600" />
            </motion.button>
          </div>
          
          {noticesLoading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner text="Loading notices..." color="blue" icon={Bell} />
            </div>
          ) : (
            <motion.ul 
              variants={staggerContainer}
              className="space-y-3 mt-6"
            >
              {notices.length > 0 ? (
                notices.map((item, i) => (
                  <motion.li 
                    key={i} 
                    variants={fadeInUp}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-800 font-medium">{item.title}</span>
                    <div className="flex items-center space-x-2">
                      {item.urgency === "High" && (
                        <div className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          Urgent
                        </div>
                      )}
                    </div>
                  </motion.li>
                ))
              ) : (
                <motion.div 
                  variants={fadeIn}
                  className="flex flex-col items-center justify-center py-10 text-gray-500"
                >
                  <Bell size={40} className="text-gray-300 mb-3" />
                  <p>No notices available at this time</p>
                </motion.div>
              )}
            </motion.ul>
          )}
        </div>
      </motion.section>

      {/* Attendance */}
      <motion.section 
        variants={sectionVariants}
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-blue-600" />
          Attendance
        </h2>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          {statusLoading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner text="Loading attendance status..." color="blue" icon={Calendar} />
            </div>
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
                          setAttendanceRecord({
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
                    
                    {/* <div className="flex flex-col gap-2">
                      <label className="flex items-center text-gray-700 font-medium">
                        <Tag className="w-4 h-4 mr-2 text-blue-600" />
                        Attendance Status
                      </label>
                      <select
                        value={attendanceRecord.tag}
                        onChange={(e) =>
                          setAttendanceRecord({
                            ...attendanceRecord,
                            tag: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded-lg px-4 py-2.5 bg-[#EAF4FF] focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                      >
                        <option value="">Select status</option>
                        {["Present", "Absent", "Late", "Wrong_Location"].map(
                          (status) => (
                            <option key={status} value={status}>
                              {status.replace('_', ' ')}
                            </option>
                          )
                        )}
                      </select>
                    </div> */}
                  </div>
                )}
              </div>
              
              <div className="self-end md:self-center">
                {attendanceStatus.checkIn && attendanceStatus.checkOut && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCheckIn}
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
                    onClick={handleCheckOut}
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
      </motion.section>

      {/* Task List */}
      <motion.section 
        variants={sectionVariants}
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <CheckSquare className="mr-2 h-5 w-5 text-blue-600" />
          Task List
        </h2>
        
        {tasksLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner text="Loading tasks..." color="blue" icon={CheckSquare} />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer} 
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        new Date(task.end_date) < new Date() ? "bg-red-500" : "bg-green-500"
                      )}></div>
                      <span>{task.task_title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="whitespace-nowrap text-gray-600">
                        {formatDateToDayMonth(task.end_date)}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  variants={fadeIn}
                  className="flex flex-col items-center justify-center py-10 text-gray-500"
                >
                  <CheckSquare size={40} className="text-gray-300 mb-3" />
                  <p>No tasks available at this time</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  );
}
