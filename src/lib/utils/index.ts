/**
 * Utilities Index
 * Core utility functions for the application
 */

// Re-export utility functions from ./validation and ./path-utils
export * from './validation';
export * from './path-utils';

// ====================================================================
// Helper Functions
// ====================================================================

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

export function extractFileNameFromStoragePath(filePath: string) {
  const parts = filePath.split("/");
  if (parts.length < 2) return filePath;
  else return parts.slice(1).join("/");
}



export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const year = d.getFullYear();
  const month = d.getMonth(); // 0-based index
  const day = d.getDate();

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

  const monthName = months[month];

  return `${day} ${monthName}, ${year}`;
}


export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  // For older dates, show the formatted date
  return formatDate(dateStr.split('T')[0]);
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

export function convertISOToLocalTimestamps(isoString: string): string {
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function getLocalNow(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

function randomSuffix(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function slugify(title: string) {
  let slugifiedTitle = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/--+/g, '-'); // replace multiple - with single -

  slugifiedTitle = slugifiedTitle + '-' + randomSuffix();

  return slugifiedTitle;
}

// Helper: generate random 6-character alphanumeric string
