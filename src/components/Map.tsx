import  { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { Bus, MapPin, Navigation } from 'lucide-react';
import { db } from '../firebase/config';
import { Bus as BusType, Trip } from '../types';
import axios from 'axios';

interface MapViewProps {
  busId?: string;
  tripId?: string;
  width?: string | number;
  height?: string | number;
  showRoute?: boolean;
  showLayerControls?: boolean;
  manualLocation?: { lat: number; lng: number } | null;
}

export default function MapView({ 
  busId, 
  tripId, 
  width = '100%', 
  height = '400px', 
  showRoute = true,
  showLayerControls = true,
  manualLocation = null
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busLocation, setBusLocation] = useState<{lat: number; lng: number; timestamp: number} | null>(null);
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [mapType, setMapType] = useState('normal.day');

  useEffect(() => {
    let mapInstance: any = null;
    let marker: any = null;
    let routeLine: any = null;
    let unsubscribe: (() => void) | null = null;

    const initializeMap = async () => {
      try {
        if (!mapContainerRef.current) return;
        setLoading(true);

        // If we have a manual location, use that
        if (manualLocation) {
          setBusLocation({
            ...manualLocation,
            timestamp: Date.now()
          });
        }
        // Otherwise, subscribe to the bus's location in Firebase
        else if (busId) {
          unsubscribe = onSnapshot(doc(db, 'buses', busId), (doc) => {
            if (doc.exists() && doc.data().location) {
              setBusLocation(doc.data().location);
            } else {
              // Fallback to simulated location if no real data exists
              const simulatedBusLocation = {
                lat: 40.7128 + (Math.random() * 0.01),
                lng: -74.006 + (Math.random() * 0.01),
                timestamp: Date.now()
              };
              setBusLocation(simulatedBusLocation);
            }
          });
        }

        if (tripId) {
          // Get trip details
          const tripDoc = await getDoc(doc(db, 'trips', tripId));
          if (tripDoc.exists()) {
            const tripData = { id: tripDoc.id, ...tripDoc.data() };
            setTripDetails(tripData);
          } else {
            // Fallback to simulated trip if no real data exists
            const simulatedTrip = {
              id: tripId,
              route: 'Morning Pickup - North Route',
              startTime: Date.now() - 1800000, // 30 minutes ago
              estimatedEndTime: Date.now() + 1800000, // 30 minutes from now
              waypoints: [
                { lat: 40.7128, lng: -74.006 }, // Start
                { lat: 40.7200, lng: -74.010 }, // Waypoint 1
                { lat: 40.7250, lng: -74.015 }, // Waypoint 2
                { lat: 40.7300, lng: -74.020 }  // End
              ]
            };
            setTripDetails(simulatedTrip);
          }
        }

        // In a real implementation, we would render the HERE map here
        // For now, we're showing a placeholder with simulated data
        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [busId, tripId, manualLocation]);

  const handleMapTypeChange = (type: string) => {
    setMapType(type);
  };

  const getMapImage = () => {
    let mapStyle = 'https://images.unsplash.com/photo-1577086664693-894d8405334a';
    
    if (mapType === 'satellite') {
      mapStyle = 'https://images.unsplash.com/photo-1587587567790-868981a2a5eb';
    } else if (mapType === 'terrain') {
      mapStyle = 'https://images.unsplash.com/photo-1566288623394-377af472d81b';
    }
    
    return mapStyle;
  };

  return (
    <div style={{ width, height, position: 'relative' }}>
      <div 
        ref={mapContainerRef} 
        className="bg-muted rounded-lg overflow-hidden relative"
        style={{ width: '100%', height: '100%' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        ) : error ? (
          <div className="text-center p-4 h-full flex flex-col items-center justify-center">
            <p className="text-red-500 mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        ) : (
          <div className="h-full w-full relative">
            {/* Map placeholder using background image */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${getMapImage()})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.95)'
              }}
            />
            
            {/* Bus marker */}
            {busLocation && (
              <div 
                className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  top: '50%', 
                  left: '50%',
                  animation: 'pulse 2s infinite'
                }}
              >
                <div className="bg-blue-500 p-2 rounded-full text-white">
                  {manualLocation ? (
                    <Navigation className="h-6 w-6" />
                  ) : (
                    <Bus className="h-6 w-6" />
                  )}
                </div>
              </div>
            )}
            
            {/* Route visualization - simplified */}
            {showRoute && tripDetails && (
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <div className="h-0.5 w-3/4 bg-primary/70 rounded relative">
                  <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-green-500" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500" />
                  
                  {/* Waypoints */}
                  <div className="absolute -top-1.5 left-1/3 w-3 h-3 rounded-full bg-amber-500" />
                  <div className="absolute -top-1.5 left-2/3 w-3 h-3 rounded-full bg-amber-500" />
                </div>
              </div>
            )}
            
            {/* Info overlay */}
            <div className="absolute bottom-3 left-3 bg-white rounded-md shadow p-3 max-w-xs z-20">
              <div className="flex items-center mb-2">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                <span className="font-semibold text-sm">
                  {tripDetails ? tripDetails.route : 'Live Location'}
                </span>
              </div>
              
              {busLocation && (
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span>{busLocation.lat.toFixed(4)}, {busLocation.lng.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last update:</span>
                    <span>{new Date(busLocation.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Map controls */}
      {showLayerControls && !loading && !error && (
        <div className="absolute top-2 right-2 bg-white p-2 rounded shadow z-10 text-xs">
          <div className="font-semibold mb-1">Map Type</div>
          <div className="space-y-1">
            <div className="flex items-center">
              <input
                type="radio"
                id="layer-standard"
                name="map-layer"
                className="mr-1"
                checked={mapType === 'normal.day'}
                onChange={() => handleMapTypeChange('normal.day')}
              />
              <label htmlFor="layer-standard">Standard</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="layer-satellite"
                name="map-layer"
                className="mr-1"
                checked={mapType === 'satellite'}
                onChange={() => handleMapTypeChange('satellite')}
              />
              <label htmlFor="layer-satellite">Satellite</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="layer-terrain"
                name="map-layer"
                className="mr-1"
                checked={mapType === 'terrain'}
                onChange={() => handleMapTypeChange('terrain')}
              />
              <label htmlFor="layer-terrain">Terrain</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 