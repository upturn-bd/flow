// Helper function to calculate distance between two points
export const calculateDistance = (point1: string, point2?: string): number => {
    if (!point2) return Infinity;

    // Extract coordinates from PostgreSQL point strings "(longitude,latitude)"
    const regex = /\(([^,]+),([^)]+)\)/;
    const match1 = point1.match(regex);
    const match2 = point2.match(regex);

    if (!match1 || !match2) return Infinity;

    const [, lon1, lat1] = match1;
    const [, lon2, lat2] = match2;

    // Convert to numbers
    const lat1Rad = parseFloat(lat1) * Math.PI / 180;
    const lat2Rad = parseFloat(lat2) * Math.PI / 180;
    const lon1Num = parseFloat(lon1);
    const lon2Num = parseFloat(lon2);

    // Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const dLat = (lat2Rad - lat1Rad);
    const dLon = (lon2Num - lon1Num) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in meters

    console.log("distance", distance);

    return distance;
};