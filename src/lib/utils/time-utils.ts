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

