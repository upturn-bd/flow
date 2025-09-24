import { supabase } from "@/lib/supabase/client";
import { getLocalNow } from "@/lib/utils";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { calculateDistance } from "@/lib/utils/location-utils";
import { getCurrentTime24HourFormat, getTodaysDate, isOnTime } from "@/lib/utils/time-utils";

export async function getCurrentCoordinates(): Promise<string | null> {
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

export async function handleCheckIn(
  attendanceRecord: AttendanceRecord,
  sites: Site[],
  checkAttendanceStatus: () => void
) {
  const user = await getEmployeeInfo();
  const coordinates = await getCurrentCoordinates();
  if (!coordinates) return; // Exit if permission denied

  // Get current timestamp in 24-hour format
  const now = getCurrentTime24HourFormat();
  try {
    // Calculate tag based on site and location data
    const selectedSite = sites.find(site => site.id === attendanceRecord.site_id);

    const onTime = isOnTime({checkInTime: selectedSite?.check_in!, currentTime: now});
    const isWithin100m = calculateDistance(coordinates, `(${selectedSite?.longitude},${selectedSite?.latitude})`) <= 100;
    
    // Determine attendance status
    let attendanceStatus = 'Absent';
    if (onTime && isWithin100m) {
      attendanceStatus = 'Present';
    } else if (!onTime && isWithin100m) {
      attendanceStatus = 'Late';
    } else if (!isWithin100m) {
      attendanceStatus = 'Wrong_Location';
    }
    attendanceRecord.tag = attendanceStatus;
    const date = getTodaysDate()
    
    const { error } = await supabase.from("attendance_records").insert({
      ...attendanceRecord,
      attendance_date: date, // Just the date part (YYYY-MM-DD)
      check_in_time: new Date().toISOString(), // Full ISO timestamp
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
}

export async function handleCheckOut(
  attendanceId: number,
) {
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
      .eq("id", attendanceId)

    if (error) {
      console.error("Check-out error:", error);
      alert("Failed to record check-out");
    } else {
      alert("Check-out recorded successfully!");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    alert("An unexpected error occurred");
  }
}
