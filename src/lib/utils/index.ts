export function dirtyValuesChecker<T extends object>(
  initial: T,
  current: T
): boolean {
  for (const key in current) {
    if (!Object.prototype.hasOwnProperty.call(initial, key)) continue;

    const initialVal = (initial as any)[key];
    const currentVal = (current as any)[key];

    if (typeof initialVal === "object" && typeof currentVal === "object") {
      if (dirtyValuesChecker(initialVal, currentVal)) return true;
    } else if (String(initialVal) !== String(currentVal)) {
      return true;
    }
  }
  return false;
}

export function generateRandomId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomId = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomId += chars[randomIndex];
  }

  return randomId;
}

export function extractFilenameFromUrl(url: string) {
  const lastSlashIndex = url.lastIndexOf("/");
  let name = url.substring(lastSlashIndex + 1);
  name = name.replaceAll("%20", " ");
  name = name.replaceAll("%28", "(");
  name = name.replaceAll("%29", ")");
  name = name.replaceAll("%2C", ",");
  name = name.replaceAll("%2E", ".");
  name = name.replaceAll("%2F", "/");
  name = name.replaceAll("%3A", ":");
  name = name.replaceAll("%3B", ";");
  name = name.replaceAll("%3D", "=");
  name = name.replaceAll("%5B", "[");
  name = name.replaceAll("%5D", "]");
  name = name.replaceAll("%5F", "_");
  name = name.replaceAll("%7B", "{");
  name = name.replaceAll("%7D", "}");

  name = name.split("-")[1];
  return name;
}

export function formatDate(dateStr: string): string {
  const [year, month, dayStr] = dateStr.split("-");
  const day = parseInt(dayStr, 10);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = months[parseInt(month, 10) - 1];

  return `${day} ${monthName}, ${year}`;
}

export function formatTimeFromISO(isoString: string): string {
  const date = new Date(isoString);

  // Get hours and minutes, pad with leading zeros if needed
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function formatDateToDayMonth(dateStr: string): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const date = new Date(dateStr);
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const monthAbbr = months[monthIndex];

  return `${day}-${monthAbbr}`;
}

export function getLongitude(pointString: string | null): number | null {
  if (!pointString) return null;

  try {
    // Remove parentheses and split by comma
    const cleaned = pointString.replace(/[()]/g, "");
    const [longitude] = cleaned.split(",");
    return parseFloat(longitude);
  } catch (error) {
    console.error("Failed to parse longitude from point:", pointString);
    return null;
  }
}

export function getLatitude(pointString: string | null): number | null {
  if (!pointString) return null;

  try {
    // Remove parentheses and split by comma
    const cleaned = pointString.replace(/[()]/g, "");
    const [, latitude] = cleaned.split(",");
    return parseFloat(latitude);
  } catch (error) {
    console.error("Failed to parse latitude from point:", pointString);
    return null;
  }
}
