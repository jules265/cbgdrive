import  { ref, set, onValue } from 'firebase/database';
import { db } from '../firebase/config';

// Generate a simulated bus route based on waypoints
export function generateBusRoute(
  startPoint: { lat: number; lng: number },
  endPoint: { lat: number; lng: number },
  numPoints: number = 20
) {
  const route = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * ratio;
    const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * ratio;
    
    // Add some randomness to make it more realistic
    const jitter = 0.0005;
    const jitteredLat = lat + (Math.random() * jitter * 2 - jitter);
    const jitteredLng = lng + (Math.random() * jitter * 2 - jitter);
    
    route.push({
      lat: jitteredLat,
      lng: jitteredLng,
      timestamp: Date.now() + (i * 60000) // One point per minute
    });
  }
  
  return route;
}

// Start a simulated trip with periodic location updates
export function startSimulatedTrip(tripId: string, busId: string, routePoints: any[]) {
  let currentPointIndex = 0;
  
  // Function to update the bus location in Firebase
  const updateBusLocation = async () => {
    if (currentPointIndex >= routePoints.length) {
      // Trip is complete
      return;
    }
    
    const currentPoint = routePoints[currentPointIndex];
    
    try {
      // Update bus location in Firebase
      await set(ref(db, `busLocations/${busId}`), {
        lat: currentPoint.lat,
        lng: currentPoint.lng,
        heading: calculateHeading(
          currentPointIndex > 0 ? routePoints[currentPointIndex - 1] : currentPoint,
          currentPoint
        ),
        speed: calculateSpeed(
          currentPointIndex > 0 ? routePoints[currentPointIndex - 1] : currentPoint,
          currentPoint
        ),
        timestamp: Date.now(),
        tripId
      });
      
      // Update trip progress
      await set(ref(db, `trips/${tripId}/progress`), {
        currentPoint: currentPointIndex,
        totalPoints: routePoints.length,
        percentComplete: Math.round((currentPointIndex / (routePoints.length - 1)) * 100),
        estimatedTimeRemaining: (routePoints.length - currentPointIndex) * 60000,
        currentLocation: {
          lat: currentPoint.lat,
          lng: currentPoint.lng
        }
      });
      
      // Move to next point
      currentPointIndex++;
      
    } catch (error) {
      console.error('Error updating bus location:', error);
    }
  };
  
  // Update location every 5 seconds
  const intervalId = setInterval(updateBusLocation, 5000);
  
  // Return a function to stop the simulation
  return () => {
    clearInterval(intervalId);
  };
}

// Listen for bus location updates
export function listenForBusLocation(busId: string, callback: (location: any) => void) {
  const busLocationRef = ref(db, `busLocations/${busId}`);
  
  return onValue(busLocationRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
}

// Calculate heading between two points
function calculateHeading(point1: any, point2: any) {
  const lat1 = point1.lat * Math.PI / 180;
  const lat2 = point2.lat * Math.PI / 180;
  const lng1 = point1.lng * Math.PI / 180;
  const lng2 = point2.lng * Math.PI / 180;
  
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  if (bearing < 0) {
    bearing += 360;
  }
  
  return Math.round(bearing);
}

// Calculate simulated speed between two points
function calculateSpeed(point1: any, point2: any) {
  // Random speed between 20-40 km/h for school buses
  return Math.floor(Math.random() * 20 + 20);
}
 