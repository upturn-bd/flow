"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { siteSchema } from "@/lib/types";
import { z } from "zod";
import { Site } from "@/hooks/useAttendanceManagement";
import { dirtyValuesChecker } from "@/lib/utils";

type FormValues = z.infer<typeof siteSchema>;

interface AttendanceCreateModalProps {
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

interface AttendanceUpdateModalProps {
  initialData: Site;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

const DEFAULT_POSITION = { lat: 51.505, lng: -0.09 };

type Coordinates = {
  lat: number;
  lng: number;
};

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  distance?: number;
};

function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapUpdater = ({ coordinates }: { coordinates: Coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates) {
      map.flyTo([coordinates.lat, coordinates.lng], map.getZoom());
    }
  }, [coordinates, map]);
  return null;
};

const LocationMarker = ({
  onSelect,
}: {
  onSelect: (coords: Coordinates) => void;
}) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });

  return null;
};

export default function AttendanceCreateModal({
  onSubmit,
  onClose,
}: AttendanceCreateModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: 0,
    name: "",
    check_in: "",
    check_out: "",
    longitude: 23.8041,
    latitude: 90.4074,
    company_id: 0,
    location: "https://www.openstreetmap.org/?mlat=23.80411&mlon=90.4074",
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = siteSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<FormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = siteSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<FormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
    setIsSubmitting(false);
  };

  // Map related state and effects
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch location suggestions
  const fetchSuggestions = debounce(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=10`
      );
      let data: Suggestion[] = await res.json();

      if (userLocation) {
        data = data
          .map((s) => ({
            ...s,
            distance: Math.sqrt(
              Math.pow(parseFloat(s.lat) - userLocation.lat, 2) +
                Math.pow(parseFloat(s.lon) - userLocation.lng, 2)
            ),
          }))
          .sort((a, b) => a.distance! - b.distance!);
      }

      setSuggestions(data.slice(0, 5));
    } catch (error) {
      console.error("Suggestion error:", error);
    } finally {
      setLoading(false);
    }
  }, 2500);

  // Trigger fetchSuggestions on search change
  useEffect(() => {
    fetchSuggestions(search);
  }, [search]);

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setCoordinates(coords);
      },
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (s: Suggestion) => {
    const newCoords = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setCoordinates(newCoords);
    setSearch(s.display_name);
    setSuggestions([]);
  };
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (coordinates && map) {
      map.setView(coordinates, map.getZoom());
    }

    if (coordinates) {
      setFormValues((prev) => ({
        ...prev,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        location: `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}`,
      }));
    }
  }, [coordinates, map]);

  useEffect(() => {
    console.log("Form Values:", formValues);
  }, [formValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Configure Attendance Site</h2>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">Name</label>
          <input
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Check In
          </label>
          <input
            name="check_in"
            type="time"
            value={formValues.check_in}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.check_in && (
            <p className="text-red-500 text-sm">{errors.check_in}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Check Out
          </label>
          <input
            name="check_out"
            type="time"
            value={formValues.check_out}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.check_out && (
            <p className="text-red-500 text-sm">{errors.check_out}</p>
          )}
        </div>

        <div className="max-w-xl mx-auto p-4 space-y-4 relative">
          <h2 className="text-2xl font-semibold">Select a Location</h2>
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a location..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {loading && (
              <div className="absolute right-3 top-2.5 w-4 h-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
            )}

            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectSuggestion(s)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <MapContainer
            center={coordinates ?? DEFAULT_POSITION}
            zoom={13}
            scrollWheelZoom={true}
            whenCreated={(mapInstance) => setMap(mapInstance)}
            className="h-80 rounded-lg z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {coordinates && (
              <Marker
                position={coordinates}
                icon={markerIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const newPos = marker.getLatLng();
                    setCoordinates({ lat: newPos.lat, lng: newPos.lng });
                  },
                }}
              />
            )}
            <LocationMarker onSelect={setCoordinates} />
            {coordinates && <MapUpdater coordinates={coordinates} />}
          </MapContainer>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              isSubmitting || !isValid || Object.keys(errors).length > 0
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AttendanceUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: AttendanceUpdateModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: 0,
    name: "",
    check_in: "",
    check_out: "",
    longitude: 23.8041,
    latitude: 90.4074,
    company_id: 0,
    location: "https://www.openstreetmap.org/?mlat=23.80411&mlon=90.4074",
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const result = siteSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<FormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = siteSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<FormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
    setIsSubmitting(false);
  };

  // Map related state and effects
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch location suggestions
  const fetchSuggestions = debounce(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=10`
      );
      let data: Suggestion[] = await res.json();

      if (userLocation) {
        data = data
          .map((s) => ({
            ...s,
            distance: Math.sqrt(
              Math.pow(parseFloat(s.lat) - userLocation.lat, 2) +
                Math.pow(parseFloat(s.lon) - userLocation.lng, 2)
            ),
          }))
          .sort((a, b) => a.distance! - b.distance!);
      }

      setSuggestions(data.slice(0, 5));
    } catch (error) {
      console.error("Suggestion error:", error);
    } finally {
      setLoading(false);
    }
  }, 2500);

  // Trigger fetchSuggestions on search change
  useEffect(() => {
    fetchSuggestions(search);
  }, [search]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (s: Suggestion) => {
    const newCoords = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setCoordinates(newCoords);
    setSearch(s.display_name);
    setSuggestions([]);
  };
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (coordinates && map) {
      map.setView(coordinates, map.getZoom());
    }
  }, [coordinates, map]);

  useEffect(() => {
    console.log("Form Values:", initialData);
    setFormValues(initialData);
    setCoordinates({
      lat: initialData.latitude,
      lng: initialData.longitude,
    });
  }, [initialData]);

  useEffect(() => {
    setIsDirty(dirtyValuesChecker(initialData, formValues));
  }, [initialData, formValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Configure Attendance Site</h2>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">Name</label>
          <input
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Check In
          </label>
          <input
            name="check_in"
            type="time"
            value={formValues.check_in}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.check_in && (
            <p className="text-red-500 text-sm">{errors.check_in}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Check Out
          </label>
          <input
            name="check_out"
            type="time"
            value={formValues.check_out}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.check_out && (
            <p className="text-red-500 text-sm">{errors.check_out}</p>
          )}
        </div>

        <div className="max-w-xl mx-auto p-4 space-y-4 relative">
          <h2 className="text-2xl font-semibold">Select a Location</h2>
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a location..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {loading && (
              <div className="absolute right-3 top-2.5 w-4 h-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
            )}

            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectSuggestion(s)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <MapContainer
            center={coordinates ?? DEFAULT_POSITION}
            zoom={13}
            scrollWheelZoom={true}
            whenCreated={(mapInstance) => setMap(mapInstance)}
            className="h-80 rounded-lg z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {coordinates && (
              <Marker
                position={coordinates}
                icon={markerIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const newPos = marker.getLatLng();
                    setCoordinates({ lat: newPos.lat, lng: newPos.lng });
                  },
                }}
              />
            )}
            <LocationMarker onSelect={setCoordinates} />
            {coordinates && <MapUpdater coordinates={coordinates} />}
          </MapContainer>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              isSubmitting ||
              !isValid ||
              Object.keys(errors).length > 0 ||
              !isDirty
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
