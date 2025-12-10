import React, { useState, useEffect } from 'react';
import { useUserDevices } from '@/hooks/useUserDevices';
import { Desktop, DeviceMobile, Trash, Check, X, Globe, Browser, Cpu, MapPin } from '@phosphor-icons/react';
import { formatDate, formatTimeFromISO } from '@/lib/utils';

interface DevicesTabProps {
  userId: string;
  canManage: boolean;
}

// Helper function to parse location string to coordinates
function parseLocation(location: string): { lat: number; lon: number } | null {
  if (!location) return null;
  const parts = location.split(',').map(s => s.trim());
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
}

// Cache for geocoded locations to avoid repeated API calls
const locationCache = new Map<string, string>();

// Component to display location with reverse geocoding
function LocationDisplay({ location }: { location: string }) {
  const [placeName, setPlaceName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const coords = parseLocation(location);
  
  useEffect(() => {
    if (!coords) {
      setLoading(false);
      return;
    }
    
    const cacheKey = `${coords.lat},${coords.lon}`;
    
    // Check cache first
    if (locationCache.has(cacheKey)) {
      setPlaceName(locationCache.get(cacheKey)!);
      setLoading(false);
      return;
    }
    
    // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&zoom=10`)
      .then(res => res.json())
      .then(data => {
        // Extract city, state, or country from the address
        const address = data.address || {};
        const place = address.city || address.town || address.village || 
                     address.state || address.country || 'Unknown Location';
        
        // Cache the result
        locationCache.set(cacheKey, place);
        setPlaceName(place);
        setLoading(false);
      })
      .catch(() => {
        const fallback = 'Unknown Location';
        locationCache.set(cacheKey, fallback);
        setPlaceName(fallback);
        setLoading(false);
      });
  }, [coords?.lat, coords?.lon]);
  
  if (!coords) return null;
  
  const googleMapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lon}`;
  
  return (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors cursor-pointer"
      title={`View on Google Maps: ${coords.lat}, ${coords.lon}`}
    >
      <MapPin size={14} weight="fill" />
      <span>{loading ? 'Loading...' : placeName}</span>
    </a>
  );
}

export default function DevicesTab({ userId, canManage }: DevicesTabProps) {
  const { devices, loading, updateDeviceStatus, deleteDevice } = useUserDevices(userId);

  if (loading) return <div className="p-4 text-center text-foreground-secondary">Loading devices...</div>;

  // Separate devices by status
  const approvedDevices = devices.filter(d => d.status === 'approved');
  const pendingDevices = devices.filter(d => d.status === 'pending');
  const rejectedDevices = devices.filter(d => d.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground-primary">Devices</h3>
        <span className="text-sm text-foreground-secondary">
          {approvedDevices.length} approved
          {pendingDevices.length > 0 && ` • ${pendingDevices.length} pending`}
          {rejectedDevices.length > 0 && ` • ${rejectedDevices.length} rejected`}
        </span>
      </div>
      
      <div className="space-y-4">
        {devices.map(device => (
          <div key={device.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border-primary rounded-lg bg-surface-primary gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-50 dark:bg-primary-950/20 rounded-full shrink-0">
                {device.device_type === 'mobile' || device.device_type === 'tablet' ? (
                  <DeviceMobile size={24} className="text-primary-600 dark:text-primary-400" />
                ) : (
                  <Desktop size={24} className="text-primary-600 dark:text-primary-400" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground-primary">{device.device_info}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    device.status === 'approved' ? 'bg-success/10 text-success dark:bg-success/20' :
                    device.status === 'pending' ? 'bg-warning/10 text-warning dark:bg-warning/20' :
                    'bg-error/10 text-error dark:bg-error/20'
                  }`}>
                    {device.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-sm text-foreground-secondary space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Last login:</span> 
                    {formatDate(device.last_login)} {formatTimeFromISO(device.last_login)}
                  </div>
                  
                  {(device.browser || device.os || device.device_type) && (
                    <div className="flex items-center gap-3 text-xs text-foreground-tertiary flex-wrap">
                      {device.browser && (
                        <span className="flex items-center gap-1">
                          <Browser size={14} /> {device.browser}
                        </span>
                      )}
                      {device.os && (
                        <span className="flex items-center gap-1">
                          <Cpu size={14} /> {device.os}
                        </span>
                      )}
                      {device.device_type && (
                        <span className="capitalize px-2 py-0.5 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300 rounded-full">
                          {device.device_type}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-foreground-tertiary flex-wrap">
                    {device.ip_address && (
                      <span className="flex items-center gap-1">
                        <Globe size={14} /> IP: {device.ip_address}
                      </span>
                    )}
                    {device.location && <LocationDisplay location={device.location} />}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Show action buttons for pending devices (always) or delete for any device when canManage */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {device.status === 'pending' && (
                <>
                  <button 
                    onClick={() => updateDeviceStatus(device.id, 'approved')}
                    className="p-2 text-success hover:bg-success/10 rounded-full transition-colors"
                    title="Approve"
                  >
                    <Check size={20} />
                  </button>
                  <button 
                    onClick={() => updateDeviceStatus(device.id, 'rejected')}
                    className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                    title="Reject"
                  >
                    <X size={20} />
                  </button>
                </>
              )}
              {canManage && (
                <button 
                  onClick={() => deleteDevice(device.id)}
                  className="p-2 text-foreground-tertiary hover:text-error hover:bg-error/10 rounded-full transition-colors"
                  title="Remove Device"
                >
                  <Trash size={20} />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {devices.length === 0 && (
          <div className="text-center py-8 text-foreground-secondary bg-surface-secondary rounded-lg border border-dashed border-border-primary">
            <Desktop size={32} className="mx-auto mb-2 opacity-50" />
            <p>No devices registered.</p>
          </div>
        )}
      </div>
    </div>
  );
}
