import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from '@/lib/icons';

// Dynamically import the ClientMap to avoid SSR issues
const ClientMap = dynamic(() => import('@/components/admin/attendance/ClientMap'), { 
  ssr: false 
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapFieldProps {
  label: string;
  value: Coordinates;
  onChange: (coords: Coordinates) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export const MapField: React.FC<MapFieldProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  className = "",
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={className}>
      <label className="block font-semibold text-gray-700 mb-2">
        <div className="flex items-center gap-2">
          <MapPin size={18} weight="duotone" className="text-gray-500" />
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
      </label>
      
      <div className="relative">
        {isClient ? (
          <div className="h-64 border border-border-secondary rounded-md overflow-hidden">
            <ClientMap
              value={value}
              onChange={onChange}
              type="attendance"
            />
          </div>
        ) : (
          <div className="h-64 border border-border-secondary rounded-md bg-background-secondary flex items-center justify-center">
            <MapPin size={32} weight="duotone" className="text-gray-400" />
            <span className="ml-2 text-gray-500">Loading map...</span>
          </div>
        )}
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      
      <div className="mt-2 text-sm text-gray-600">
        <p>Latitude: {value.lat.toFixed(6)}</p>
        <p>Longitude: {value.lng.toFixed(6)}</p>
      </div>
    </div>
  );
};

export default MapField;
