// Compare two times in the format of "24:00"
export function isOnTime({checkInTime, currentTime}: {checkInTime: string, currentTime: string}): boolean {
  const [checkInHours, checkInMinutes] = checkInTime.split(':').map(Number);
  const [currentHours, currentMinutes] = currentTime.split(':').map(Number);

  if(checkInHours < currentHours) {
    return false;
  } else if(checkInHours === currentHours && checkInMinutes <= currentMinutes) {
    return false;
  } else {
    return true;
  }
}

export function getTodaysDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function getCurrentTime24HourFormat(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Check if check-in is late
export function checkLateStatus(
  checkInTime: string | null,
  siteCheckInTime: string
): 'on-time' | 'late' | 'no-record' {
  if (!checkInTime) return 'no-record';
  
  const checkInDate = new Date(`1970-01-01T${checkInTime}`);
  const siteTime = new Date(`1970-01-01T${siteCheckInTime}`);
  
  return checkInDate > siteTime ? 'late' : 'on-time';
}

// Check if check-out is early
export function checkEarlyCheckOut(
  checkOutTime: string | null,
  siteCheckOutTime: string
): 'on-time' | 'early' | 'no-record' {
  if (!checkOutTime) return 'no-record';
  
  const checkOutDate = new Date(`1970-01-01T${checkOutTime}`);
  const siteTime = new Date(`1970-01-01T${siteCheckOutTime}`);
  
  return checkOutDate < siteTime ? 'early' : 'on-time';
}

