"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Loader } from "@/lib/icons";

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(
  () => import("./GeolocationMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-background-secondary dark:bg-background-secondary rounded-lg flex items-center justify-center">
        <Loader className="animate-spin text-foreground-tertiary dark:text-foreground-tertiary" size={32} />
      </div>
    )
  }
);

export interface GeolocationValue {
  latitude: number;
  longitude: number;
}

interface GeolocationPickerProps {
  value: GeolocationValue | null;
  onChange: (value: GeolocationValue | null) => void;
  required?: boolean;
  error?: string;
  label?: string;
}

export default function GeolocationPicker({
  value,
  onChange,
  required = false,
  error,
  label = "Location",
}: GeolocationPickerProps) {
  const [manualInput, setManualInput] = useState({
    latitude: value?.latitude?.toString() || "",
    longitude: value?.longitude?.toString() || "",
  });

  useEffect(() => {
    if (value) {
      setManualInput({
        latitude: value.latitude.toString(),
        longitude: value.longitude.toString(),
      });
    }
  }, [value]);

  const handleManualInputChange = (field: "latitude" | "longitude", val: string) => {
    setManualInput((prev) => ({ ...prev, [field]: val }));

    // Try to parse and update if both values are valid numbers
    const lat = field === "latitude" ? parseFloat(val) : parseFloat(manualInput.latitude);
    const lng = field === "longitude" ? parseFloat(val) : parseFloat(manualInput.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      onChange({ latitude: lat, longitude: lng });
    }
  };

  const handleMapChange = (coords: GeolocationValue) => {
    onChange(coords);
    setManualInput({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
    });
  };

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          handleMapChange(coords);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your current location. Please enable location services.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground-primary dark:text-foreground-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          <MapPin size={14} />
          Use current location
        </button>
      </div>

      {/* Manual Input */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-foreground-secondary dark:text-foreground-secondary mb-1">Latitude</label>
          <input
            type="text"
            value={manualInput.latitude}
            onChange={(e) => handleManualInputChange("latitude", e.target.value)}
            placeholder="e.g., 23.8103"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-surface-primary dark:bg-surface-primary text-foreground-primary dark:text-foreground-primary ${
              error ? "border-red-500" : "border-border-primary dark:border-border-primary"
            }`}
          />
        </div>
        <div>
          <label className="block text-xs text-foreground-secondary dark:text-foreground-secondary mb-1">Longitude</label>
          <input
            type="text"
            value={manualInput.longitude}
            onChange={(e) => handleManualInputChange("longitude", e.target.value)}
            placeholder="e.g., 90.4125"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-surface-primary dark:bg-surface-primary text-foreground-primary dark:text-foreground-primary ${
              error ? "border-red-500" : "border-border-primary dark:border-border-primary"
            }`}
          />
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <MapComponent value={value} onChange={handleMapChange} />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {value && (
        <p className="text-xs text-foreground-tertiary dark:text-foreground-tertiary">
          Click on the map to update the location, or enter coordinates manually above.
        </p>
      )}
    </div>
  );
}
