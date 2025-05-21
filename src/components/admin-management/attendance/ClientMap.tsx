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

interface ClientMapProps {
  value: Coordinates;
  onChange: (coords: Coordinates) => void;
  type: string;
}

const DEFAULT_POSITION: Coordinates = { lat: 51.505, lng: -0.09 };

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

const MapController = ({ setMap }: { setMap: (map: L.Map) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  
  return null;
};

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

export default function ClientMap({ value, onChange, type }: ClientMapProps) {
  const [coordinates, setCoordinates] = useState<Coordinates>(value);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);

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

  useEffect(() => {
    fetchSuggestions(search);
  }, [search]);

  useEffect(() => {
    if (type === "create") {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(coords);
          setCoordinates(coords);
          onChange(coords);
        },
        (err) => console.warn("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

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
    onChange(newCoords);
  };

  useEffect(() => {
    if (coordinates && map) {
      map.setView(coordinates, map.getZoom());
    }
  }, [coordinates, map]);

  useEffect(() => {
    if (value) {
      setCoordinates(value);
    }
  }, [value]);

  return (
    <div className="w-full space-y-4 relative mt-4">
      <div ref={dropdownRef} className="relative">
        <label className="block font-semibold text-blue-800 mb-1">
          Location
        </label>
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
        className="h-[60vh] w-full rounded-lg shadow-md"
      >
        <MapController setMap={setMap} />
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
                onChange({ lat: newPos.lat, lng: newPos.lng });
              },
            }}
          />
        )}
        <LocationMarker
          onSelect={(coords) => {
            setCoordinates(coords);
            onChange(coords);
          }}
        />
        {coordinates && <MapUpdater coordinates={coordinates} />}
      </MapContainer>
    </div>
  );
}
