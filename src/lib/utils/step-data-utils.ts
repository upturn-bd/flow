/**
 * Utility functions for formatting and displaying stakeholder step data
 * in a user-friendly way across the application.
 */

import { FieldDefinition, FieldDefinitionsSchema, StakeholderProcessStep } from "@/lib/types/schemas";

/**
 * Convert snake_case or camelCase to human-readable labels
 */
export const toHumanReadable = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle camelCase
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

/**
 * Check if a value looks like coordinates
 */
export const isCoordinates = (value: unknown): { lat: number; lng: number } | null => {
  // Handle object with lat/lng or latitude/longitude
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const lat = obj.lat ?? obj.latitude ?? obj.Lat ?? obj.Latitude;
    const lng = obj.lng ?? obj.lon ?? obj.longitude ?? obj.Lng ?? obj.Lon ?? obj.Longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
    }
  }
  
  // Handle string like "23.8103, 90.4125" or "23.8103,90.4125"
  if (typeof value === "string") {
    const match = value.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }
  
  return null;
};

/**
 * Check if field key suggests it's a location field
 */
export const isLocationField = (key: string): boolean => {
  const locationKeywords = ['location', 'coordinates', 'lat', 'lng', 'latitude', 'longitude', 'geo', 'position', 'coords'];
  const lowerKey = key.toLowerCase();
  return locationKeywords.some(keyword => lowerKey.includes(keyword));
};

/**
 * Format any value for user-friendly display
 */
export const formatDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (value instanceof Date) return value.toLocaleDateString();
  
  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map(item => formatDisplayValue(item)).join(", ");
  }
  
  // Handle objects (not file objects)
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    
    // Skip file objects
    if ('path' in obj) return "[File]";
    
    // Check for coordinates
    const coords = isCoordinates(value);
    if (coords) {
      return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    }
    
    // Try to extract meaningful info from object
    if ('name' in obj) return String(obj.name);
    if ('label' in obj) return String(obj.label);
    if ('title' in obj) return String(obj.title);
    if ('value' in obj) return formatDisplayValue(obj.value);
    
    // Return a summary of keys
    const keys = Object.keys(obj);
    if (keys.length === 0) return "—";
    return keys.map(k => `${toHumanReadable(k)}: ${formatDisplayValue(obj[k])}`).join(", ");
  }
  
  // Handle string values
  if (typeof value === "string") {
    // Check if it's coordinates string
    const coords = isCoordinates(value);
    if (coords) {
      return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    }
    
    // Check if it looks like a date string
    if (!isNaN(Date.parse(value)) && value.includes("-") && value.length >= 10) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    
    // Check if it's a snake_case status-like value (e.g., in_progress, not_started)
    if (/^[a-z]+(_[a-z]+)+$/.test(value)) {
      return toHumanReadable(value);
    }
    
    // Check if it's a camelCase value
    if (/^[a-z]+([A-Z][a-z]+)+$/.test(value)) {
      return toHumanReadable(value);
    }
  }
  
  return String(value);
};

/**
 * Get the label for a field from field definitions
 */
export const getFieldLabel = (
  fieldKey: string,
  fieldDefinitions?: FieldDefinitionsSchema
): string => {
  if (fieldDefinitions?.fields) {
    const fieldDef = fieldDefinitions.fields.find(f => f.key === fieldKey);
    if (fieldDef?.label) {
      return fieldDef.label;
    }
  }
  return toHumanReadable(fieldKey);
};

/**
 * Interface for a processed step data field
 */
export interface StepDataField {
  key: string;
  label: string;
  value: unknown;
  formattedValue: string;
}

/**
 * Interface for grouped step data by step
 */
export interface StepDataGroup {
  stepId: number;
  stepName: string;
  stepOrder: number;
  isCompleted: boolean;
  fields: StepDataField[];
}

/**
 * Process step data into user-friendly format
 */
export const processStepData = (
  stepData: { id: number; data: Record<string, unknown>; step?: StakeholderProcessStep } | null | undefined,
  step?: StakeholderProcessStep
): StepDataField[] => {
  if (!stepData?.data) return [];
  
  const fieldDefinitions = step?.field_definitions || stepData.step?.field_definitions;
  
  return Object.entries(stepData.data)
    .filter(([, value]) => {
      // Skip file fields
      if (typeof value === 'object' && value !== null && 'path' in (value as Record<string, unknown>)) {
        return false;
      }
      return true;
    })
    .map(([key, value]) => ({
      key,
      label: getFieldLabel(key, fieldDefinitions),
      value,
      formattedValue: formatDisplayValue(value),
    }));
};

/**
 * Format step data for brief display (e.g., in a card or list item)
 * Returns a comma-separated string of key field labels and values
 */
export const formatStepDataBrief = (
  data: Record<string, unknown>,
  fieldDefinitions?: FieldDefinitionsSchema,
  maxFields: number = 3
): string => {
  if (!data || Object.keys(data).length === 0) return "No data";
  
  const fields = Object.entries(data)
    .filter(([, value]) => {
      // Skip file fields and empty values
      if (typeof value === 'object' && value !== null && 'path' in (value as Record<string, unknown>)) {
        return false;
      }
      if (value === null || value === undefined || value === '') return false;
      return true;
    })
    .slice(0, maxFields)
    .map(([key, value]) => {
      const label = getFieldLabel(key, fieldDefinitions);
      const formatted = formatDisplayValue(value);
      // Truncate long values
      const truncated = formatted.length > 30 ? formatted.slice(0, 27) + '...' : formatted;
      return `${label}: ${truncated}`;
    });
  
  if (fields.length === 0) return "No data";
  
  const totalFields = Object.keys(data).length;
  const remaining = totalFields - maxFields;
  
  if (remaining > 0) {
    return `${fields.join(', ')} (+${remaining} more)`;
  }
  
  return fields.join(', ');
};

/**
 * Get a formatted summary of linked step data for display
 */
export const getLinkedStepDataSummary = (
  linkedStepData: Array<{
    id: number;
    stepName?: string;
    stepOrder?: number;
    isCompleted?: boolean;
    data?: Record<string, unknown>;
    step?: StakeholderProcessStep;
  }>,
  maxItems: number = 2
): string => {
  if (!linkedStepData || linkedStepData.length === 0) {
    return "No linked step data";
  }
  
  const summaries = linkedStepData.slice(0, maxItems).map(item => {
    const stepName = item.stepName || item.step?.name || `Step ${item.step?.step_order || '?'}`;
    return stepName;
  });
  
  const remaining = linkedStepData.length - maxItems;
  
  if (remaining > 0) {
    return `${summaries.join(', ')} (+${remaining} more)`;
  }
  
  return summaries.join(', ');
};
