"use client";

import { useAttendanceStatus } from "@/hooks/useAttendance";
import { useSites } from "@/hooks/useAttendanceManagement";
import { useNotices } from "@/hooks/useNotice";
import { useTasks } from "@/hooks/useTasks";
import { createClient } from "@/lib/supabase/client";
import { formatDateToDayMonth } from "@/lib/utils";
import { useContext, useEffect, useState } from "react";
import { FiRefreshCcw, FiAlertCircle, FiChevronDown } from "react-icons/fi";
import { AuthContext } from "@/lib/auth/auth-provider";

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
  const { sites, fetchSites } = useSites();
  const { notices, fetchNotices } = useNotices();
  const { tasks, fetchTasks } = useTasks();

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
    const supabase = createClient();
    const { employee } = useContext(AuthContext)!;
    const coordinates = await getCurrentCoordinates();
    if (!coordinates) return; // Exit if permission denied

    // Get current timestamp in ISO format
    const now = new Date().toISOString();

    try {
      const { data, error } = await supabase.from("attendance_records").insert({
        ...attendanceRecord,
        attendance_date: now.split("T")[0], // Just the date part (YYYY-MM-DD)
        check_in_time: now, // Full ISO timestamp
        employee_id: employee!.id,
        company_id: employee!.company_id,
        supervisor_id: employee!.supervisor_id,
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
    const supabase = createClient();
    const { employee } = useContext(AuthContext)!;
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
        .eq("employee_id", employee!.id)
        .eq("company_id", employee!.company_id)
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

  return (
    <div className="min-h-screen bg-white p-6 max-w-4xl mx-auto lg:mx-20">
      {/* News & Reminder */}
      <section className="mb-6">
        <h2 className="text-blue-600 font-bold text-xl mb-2">
          News & Reminder
        </h2>
        <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-md relative">
          <div className="flex items-center space-x-4 text-sm mb-2">
            <span className="font-semibold">All</span>
            <span className="border-l border-gray-300 pl-4"> Unread</span>
            <span className="border-l border-gray-300 pl-4"> Urgent</span>
            <span className="border-l border-gray-300 pl-4"> Trash</span>
            <div className="bg-gray-200 rounded-full p-2">
              <FiRefreshCcw
                className="ml-auto text-gray-600 cursor-pointer"
                size={16}
              />
            </div>
          </div>
          <ul className="space-y-4 mt-8">
            {notices.map((item, i) => (
              <li key={i} className="flex justify-between items-center pb-2">
                <span className="text-sm text-gray-800">{item.title}</span>
                <div className="flex items-center space-x-2">
                  {item.urgency === "High" && (
                    <FiAlertCircle className="text-red-600" size={16} />
                  )}
                  {/* <FiTrash2
                    className="text-gray-600 cursor-pointer"
                    size={16}
                  /> */}
                </div>
              </li>
            ))}
            {notices.length === 0 && (
              <div className="flex items-center justify-center">
                Sorry, no notices available.
              </div>
            )}
          </ul>
        </div>
      </section>

      {/* Attendance */}
      <section className="mb-6">
        <h2 className="text-blue-600 font-bold text-xl mb-1">Attendance</h2>
        <div className="bg-white border border-gray-300 shadow-md rounded-xl p-4 flex flex-row justify-between">
          <div className="space-y-4">
            {!statusLoading &&
              !attendanceStatus.checkOut &&
              !attendanceStatus.checkIn && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-800">
                    Check-in and check-out completed
                  </span>
                </div>
              )}
            {/* {!statusLoading &&
              (attendanceStatus.checkIn || attendanceStatus.checkOut) && (
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-gray-700">
                    Site Name
                  </label>
                  <select
                    value={attendanceRecord.site_id}
                    onChange={(e) =>
                      setAttendanceRecord({
                        ...attendanceRecord,
                        site_id: Number(e.target.value),
                      })
                    }
                    className="border rounded-md px-3 py-1 bg-blue-50"
                  >
                    <option value="">Select site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
              )} */}
            {!statusLoading && attendanceStatus.checkIn && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-gray-700">
                    Site Name
                  </label>
                  <select
                    value={attendanceRecord.site_id}
                    onChange={(e) =>
                      setAttendanceRecord({
                        ...attendanceRecord,
                        site_id: Number(e.target.value),
                      })
                    }
                    className="border rounded-md px-3 py-1 bg-blue-50"
                  >
                    <option value="">Select site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-gray-700">Status</label>
                  <select
                    value={attendanceRecord.tag}
                    onChange={(e) =>
                      setAttendanceRecord({
                        ...attendanceRecord,
                        tag: e.target.value,
                      })
                    }
                    className="border rounded-md px-3 py-1 bg-blue-50"
                  >
                    <option value="">Select status</option>
                    {["Present", "Absent", "Late", "Wrong_Location"].map(
                      (status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>
          {statusLoading && <div>Loading...</div>}
          {!statusLoading &&
            attendanceStatus.checkIn &&
            attendanceStatus.checkOut && (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={!attendanceRecord.site_id || !attendanceRecord.tag}
                className="ml-auto bg-yellow-400 text-black text-sm rounded-full px-4 py-1 h-10 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check-in <FiChevronDown size={14} className="ml-1" />
              </button>
            )}

          {!statusLoading &&
            !attendanceStatus.checkIn &&
            attendanceStatus.checkOut && (
              <button
                onClick={handleCheckOut}
                type="button"
                className="ml-auto bg-yellow-400 text-black text-sm rounded-full px-4 py-1 h-10 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check-out <FiChevronDown size={14} className="ml-1" />
              </button>
            )}
        </div>
      </section>

      {/* Task List */}
      <section className="mb-6">
        <h2 className="text-blue-600 font-bold text-xl mb-1">Task List</h2>
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <div
              key={i}
              className={`
                flex items-center justify-between px-4 py-2 bg-gray-100 rounded-md text-sm font-medium
                
              `}
            >
              <div className="flex items-center space-x-2">
                <span>{task.task_title}</span>
              </div>
              <span className="whitespace-nowrap">
                {formatDateToDayMonth(task.end_date)}
              </span>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center">
              Sorry, no tasks available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
