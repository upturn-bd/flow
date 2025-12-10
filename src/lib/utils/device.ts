import { UAParser } from 'ua-parser-js';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  
  const STORAGE_KEY = 'flow_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  
  return deviceId;
}

export interface DeviceDetails {
  browser: string;
  os: string;
  device_type: string;
  model: string;
  user_agent: string;
  device_info: string; // Summary string
  location?: string; // Geolocation
}

export async function getUserLocation(): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Format: "Lat: XX.XXXX, Lon: YY.YYYY"
        const locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        resolve(locationString);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(''); // Return empty string if user denies or error occurs
      },
      {
        timeout: 10000, // 10 second timeout
        enableHighAccuracy: false
      }
    );
  });
}

export function getDeviceDetails(): DeviceDetails {
  if (typeof window === 'undefined') {
    return {
      browser: '',
      os: '',
      device_type: '',
      model: '',
      user_agent: '',
      device_info: ''
    };
  }
  
  try {
    const userAgent = window.navigator.userAgent;
    // UAParser v2.x - call as function, returns result object directly
    const result = UAParser(userAgent);
    
    // Extract browser info
    const browserName = result.browser?.name || 'Unknown Browser';
    const browserVersion = result.browser?.version || '';
    const browser = `${browserName} ${browserVersion}`.trim();
    
    // Extract OS info  
    const osName = result.os?.name || 'Unknown OS';
    const osVersion = result.os?.version || '';
    const os = `${osName} ${osVersion}`.trim();
    
    // Extract device type (mobile, tablet, desktop, etc.)
    const deviceType = result.device?.type || 
                      (userAgent.toLowerCase().includes('mobile') ? 'mobile' : 
                       userAgent.toLowerCase().includes('tablet') ? 'tablet' : 
                       'desktop');
    
    // Extract device model
    const deviceVendor = result.device?.vendor || '';
    const deviceModel = result.device?.model || '';
    const model = deviceVendor && deviceModel 
      ? `${deviceVendor} ${deviceModel}`.trim() 
      : deviceVendor || deviceModel || (deviceType === 'desktop' ? 'Desktop Computer' : 'Unknown Device');
    
    // Construct a friendly summary
    let summary = `${browserName} on ${osName}`;
    if (deviceType !== 'desktop') {
      summary += ` (${deviceType})`;
    }
    
    return {
      browser,
      os,
      device_type: deviceType,
      model,
      user_agent: userAgent,
      device_info: summary
    };
  } catch (error) {
    console.error('Error parsing device details:', error);
    
    // Fallback to basic detection
    const userAgent = window.navigator.userAgent;
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      device_type: 'desktop',
      model: 'Unknown Device',
      user_agent: userAgent,
      device_info: 'Unknown Device'
    };
  }
}

export function getDeviceInfo(): string {
  return getDeviceDetails().device_info;
}
