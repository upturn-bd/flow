"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

// Fix for default marker icons in react-leaflet
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface GeolocationValue {
  latitude: number;
  longitude: number;
}

interface GeolocationMapProps {
  value: GeolocationValue | null;
  onChange: (coords: GeolocationValue) => void;
}

// Default position (Dhaka, Bangladesh)
const DEFAULT_POSITION: GeolocationValue = { latitude: 23.8103, longitude: 90.4125 };

function MapUpdater({ coordinates }: { coordinates: GeolocationValue | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates) {
      map.flyTo([coordinates.latitude, coordinates.longitude], map.getZoom());
    }
  }, [coordinates, map]);
  
  return null;
}

function LocationMarker({
  position,
  onSelect,
}: {
  position: GeolocationValue | null;
  onSelect: (coords: GeolocationValue) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });

  return position ? (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={markerIcon}
    />
  ) : null;
}

export default function GeolocationMap({ value, onChange }: GeolocationMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-background-secondary dark:bg-background-secondary rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  const center = value || DEFAULT_POSITION;

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border-primary dark:border-border-primary">
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={value} onSelect={onChange} />
        <MapUpdater coordinates={value} />
      </MapContainer>
    </div>
  );
}
