import { supabase } from "@/lib/supabase/client";
import { getLocalNow } from "@/lib/utils";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { calculateDistance } from "@/lib/utils/location-utils";
import { getCurrentTime24HourFormat, getTodaysDate, isOnTime, checkEarlyCheckOut } from "@/lib/utils/time-utils";

export async function getCurrentCoordinates(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
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
        console.error('Geolocation error:', error);
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
): Promise<{ success: boolean; message?: string; status?: string; recordId?: number }> {
  const user = await getEmployeeInfo();
  const coordinates = await getCurrentCoordinates();
  
  if (!coordinates) {
    return { success: false, message: "Location access is required for check-in" };
  }

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
    
    const { data, error } = await supabase.from("attendance_records").insert({
      ...attendanceRecord,
      attendance_date: date, // Just the date part (YYYY-MM-DD)
      check_in_time: new Date().toISOString(), // Full ISO timestamp
      employee_id: user.id,
      company_id: user.company_id,
      supervisor_id: user.supervisor_id,
      check_in_coordinates: coordinates,
    }).select('id').single();

    if (error) {
      console.error("Check-in error:", error);
      return { success: false, message: "Failed to record check-in. Please try again." };
    } else {
      checkAttendanceStatus();
      return { 
        success: true, 
        message: "Your attendance has been recorded successfully!", 
        status: attendanceStatus,
        recordId: data?.id
      };
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}

export async function handleCheckOut(
  attendanceId: number,
): Promise<{ success: boolean; message?: string; isEarly?: boolean }> {
  const user = await getEmployeeInfo();
  const coordinates = await getCurrentCoordinates();
  
  if (!coordinates) {
    return { success: false, message: "Location access is required for check-out" };
  }

  // Get current timestamp in ISO format and 24-hour time format
  const now = new Date().toISOString();
  const currentTime = getCurrentTime24HourFormat();

  try {
    // First, get the attendance record to check the site's check-out time
    const { data: attendanceRecord, error: fetchError } = await supabase
      .from("attendance_records")
      .select("site_id")
      .eq("id", attendanceId)
      .eq("employee_id", user.id)
      .eq("company_id", user.company_id)
      .single();

    if (fetchError || !attendanceRecord) {
      console.error("Error fetching attendance record:", fetchError);
      return { success: false, message: "Failed to fetch attendance record." };
    }

    // Get the site's check-out time
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("check_out")
      .eq("id", attendanceRecord.site_id)
      .single();

    if (siteError || !site) {
      console.error("Error fetching site:", siteError);
      return { success: false, message: "Failed to fetch site information." };
    }

    // Check if checkout is early
    const checkoutStatus = checkEarlyCheckOut(currentTime, site.check_out);
    const isEarly = checkoutStatus === 'early';

    const { data, error } = await supabase
      .from("attendance_records")
      .update({
        check_out_time: now,
        check_out_coordinates: coordinates,
      })
      .eq("employee_id", user.id)
      .eq("company_id", user.company_id)
      .eq("id", attendanceId);

    if (error) {
      console.error("Check-out error:", error);
      return { success: false, message: "Failed to record check-out. Please try again." };
    } else {
      const message = isEarly 
        ? "You checked out early. Your check-out has been recorded."
        : "Your check-out has been recorded successfully!";
      
      return { success: true, message, isEarly };
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}
