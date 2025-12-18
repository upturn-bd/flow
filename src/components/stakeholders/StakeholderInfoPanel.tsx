"use client";

import { Stakeholder } from "@/lib/types/schemas";
import { 
  FileText, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  User, 
  WarningCircle,
  Envelope,
  Phone,
  Database
} from "@phosphor-icons/react";

interface StakeholderInfoPanelProps {
  stakeholder: Stakeholder;
  showAdditionalData?: boolean;
}

// Helper to convert programming values to human-readable labels
const toHumanReadable = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle camelCase
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

// Helper to detect if a value looks like coordinates
const isCoordinates = (value: any): { lat: number; lng: number } | null => {
  // Handle object with lat/lng or latitude/longitude
  if (typeof value === "object" && value !== null) {
    const lat = value.lat ?? value.latitude ?? value.Lat ?? value.Latitude;
    const lng = value.lng ?? value.lon ?? value.longitude ?? value.Lng ?? value.Lon ?? value.Longitude;
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

// Helper to format values for display
const formatDisplayValue = (value: any): string => {
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
    // Skip file objects
    if ('path' in value) return "[File]";
    
    // Check for coordinates
    const coords = isCoordinates(value);
    if (coords) {
      return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    }
    
    // Try to extract meaningful info from object
    if ('name' in value) return String(value.name);
    if ('label' in value) return String(value.label);
    if ('title' in value) return String(value.title);
    // Return a summary of keys
    const keys = Object.keys(value);
    if (keys.length === 0) return "—";
    return keys.map(k => `${toHumanReadable(k)}: ${formatDisplayValue(value[k])}`).join(", ");
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

// Component to render value with optional maps link
const ValueWithMapsLink = ({ value, fieldKey }: { value: any; fieldKey?: string }) => {
  const coords = isCoordinates(value);
  
  if (coords) {
    const mapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
    return (
      <span className="inline-flex items-center gap-2 flex-wrap">
        <span>{formatDisplayValue(value)}</span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
        >
          <MapPin size={12} />
          Open in Maps
        </a>
      </span>
    );
  }
  
  return <span>{formatDisplayValue(value)}</span>;
};

export default function StakeholderInfoPanel({ 
  stakeholder, 
  showAdditionalData = false 
}: StakeholderInfoPanelProps) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-surface-primary rounded-lg border border-border-primary p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground-primary">Information</h2>

        {stakeholder.stakeholder_type && (
          <div className="flex items-start gap-3">
            <FileText className="text-foreground-tertiary mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Type</p>
              <p className="text-sm text-foreground-secondary mt-0.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                  {stakeholder.stakeholder_type.name}
                </span>
              </p>
              {stakeholder.stakeholder_type.description && (
                <p className="text-xs text-foreground-tertiary mt-1">
                  {stakeholder.stakeholder_type.description}
                </p>
              )}
            </div>
          </div>
        )}

        {stakeholder.address && (
          <div className="flex items-start gap-3">
            <MapPin className="text-foreground-tertiary mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Address</p>
              <p className="text-sm text-foreground-secondary mt-0.5">{stakeholder.address}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Calendar className="text-foreground-tertiary mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium text-foreground-secondary">Created</p>
            <p className="text-sm text-foreground-secondary mt-0.5">
              {stakeholder.created_at
                ? new Date(stakeholder.created_at).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {stakeholder.completed_at && (
          <div className="flex items-start gap-3">
            <CheckCircle className="text-success mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Completed</p>
              <p className="text-sm text-foreground-secondary mt-0.5">
                {new Date(stakeholder.completed_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Rejection Information */}
        {stakeholder.status === "Rejected" && (
          <>
            {stakeholder.rejected_at && (
              <div className="flex items-start gap-3">
                <WarningCircle className="text-error mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">Rejected On</p>
                  <p className="text-sm text-foreground-secondary mt-0.5">
                    {new Date(stakeholder.rejected_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {stakeholder.rejected_by && (
              <div className="flex items-start gap-3">
                <User className="text-error/70 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">Rejected By</p>
                  <p className="text-sm text-foreground-secondary mt-0.5">
                    {stakeholder.rejected_by.name}
                  </p>
                </div>
              </div>
            )}
            {stakeholder.rejection_reason && (
              <div className="flex items-start gap-3">
                <FileText className="text-error/70 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">Rejection Reason</p>
                  <p className="text-sm text-foreground-secondary mt-0.5">
                    {stakeholder.rejection_reason}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* KAM Information */}
        {stakeholder.kam && (
          <div className="flex items-start gap-3">
            <User className="text-foreground-tertiary mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-foreground-secondary">KAM</p>
              <p className="text-sm text-foreground-secondary mt-0.5">{stakeholder.kam.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Contact Persons */}
      <div className="bg-surface-primary rounded-lg border border-border-primary p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground-primary">Contact Persons</h2>

        {stakeholder.contact_persons && stakeholder.contact_persons.length > 0 ? (
          <div className="space-y-4">
            {stakeholder.contact_persons.map((contact, index) => (
              <div key={index} className="border-t border-border-primary pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-start gap-3 mb-2">
                  <User className="text-foreground-tertiary mt-0.5" size={18} />
                  <p className="text-sm font-medium text-foreground-primary">{contact.name}</p>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-3 ml-9 mb-1">
                    <Envelope className="text-foreground-tertiary" size={16} />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm text-primary-600 hover:underline dark:text-primary-400"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-3 ml-9">
                    <Phone className="text-foreground-tertiary" size={16} />
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm text-primary-600 hover:underline dark:text-primary-400"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-tertiary">No contact persons added</p>
        )}
      </div>

      {/* Additional Data - Only show if requested and for Permanent stakeholders */}
      {showAdditionalData && stakeholder.status === "Permanent" && (
        <div className="bg-surface-primary rounded-lg border border-border-primary p-4 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground-primary">Additional Data</h2>

          {stakeholder.additional_data && Object.keys(stakeholder.additional_data).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stakeholder.additional_data).map(([sectionKey, sectionValue]) => {
                // Check if this is a nested object (step-grouped data)
                if (typeof sectionValue === "object" && sectionValue !== null && !Array.isArray(sectionValue)) {
                  return (
                    <div key={sectionKey} className="border border-border-secondary rounded-lg overflow-hidden">
                      {/* Section Header */}
                      <div className="px-3 py-2 bg-background-secondary border-b border-border-secondary">
                        <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                          {toHumanReadable(sectionKey)}
                        </span>
                      </div>
                      {/* Section Fields */}
                      <div className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(sectionValue as Record<string, any>).map(([fieldKey, fieldValue]) => (
                            <div key={fieldKey} className="flex items-start gap-2">
                              <Database className="text-foreground-tertiary mt-0.5 shrink-0" size={16} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-foreground-secondary">
                                  {toHumanReadable(fieldKey)}
                                </p>
                                <p className="text-xs sm:text-sm text-foreground-primary mt-0.5 wrap-break-word">
                                  <ValueWithMapsLink value={fieldValue} fieldKey={fieldKey} />
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Handle flat data (legacy format or simple values)
                return (
                  <div key={sectionKey} className="flex items-start gap-3">
                    <Database className="text-foreground-tertiary mt-0.5 shrink-0" size={18} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground-secondary wrap-break-word">
                        {toHumanReadable(sectionKey)}
                      </p>
                      <p className="text-xs sm:text-sm text-foreground-primary mt-0.5 wrap-break-word">
                        <ValueWithMapsLink value={sectionValue} fieldKey={sectionKey} />
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-foreground-tertiary">
              No additional data available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
