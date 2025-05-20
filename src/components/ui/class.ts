import { ClassValue } from "clsx";

import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Define cn function since it's not exported from @/lib/utils
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }