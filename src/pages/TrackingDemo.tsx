import  { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Info, Clock, Users, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import MapView from '../components/Map';
import { geocodeAddress, reverseGeocode } from '../services/hereMapService';
import Button from '../components/Button';

export default function TrackingDemo() {
  const { busId, tripId } = useParams<{ busId: string; tripId: string }>();
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busDetails, setBusDetails] = useState<any>(null);
  const [showLiveTracking, setShowLiveTracking] = useState(true);
  
  // Simulated bus data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Simulate fetching bus data
        setBusDetails({
          id: busId || '123',
          plateNumber: 'SCH-456',
          model: 'Thomas Built C2',
          driver: 'Michael Johnson',
          speed: Math.floor(Math.random() * 20 + 15), // Random speed between 15-35
          students: 24,
          location: {
            lat: 40.7128,
            lng: -74.006
          },
          routeName: 'Morning Pickup - North Route',
          nextStop: 'Lincoln Elementary School',
          status: 'on-route'
        });
        
        // Simulate getting the current address via reverse geocoding
        setCurrentAddress('1234 Broadway Ave, New York, NY 10001');
        
        // Simulate ETA calculation
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        setEstimatedArrival(now.toLocaleTimeString());
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading tracking data:', error);
        setLoading(false);
      }
    };
    
    loadData();
    
    // Simulate periodic updates
    const interval = setInterval(() => {
      if (busDetails) {
        setBusDetails(prev => ({
          ...prev,
          speed: Math.floor(Math.random() * 20 + 15),
          students: prev.students
        }));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [busId, tripId]);
  
  const toggleTracking = () => {
    setShowLiveTracking(!showLiveTracking);
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center items-center h-80">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Live Bus Tracking</h1>
        <p className="text-muted-foreground flex items-center">
          <MapPin className="h-4 w-4 mr-1" /> 
          Tracking Bus {busDetails?.plateNumber} - {busDetails?.routeName}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white">
          <div className="flex items-center mb-4">
            <div className="rounded-full bg-primary/10 p-3 mr-4">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Current Status</h3>
              <p className="text-sm text-muted-foreground">Live updates</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Speed</span>
              <span className="font-medium">{busDetails?.speed} km/h</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Location</span>
              <span className="font-medium truncate max-w-[200px]">{currentAddress}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Driver</span>
              <span className="font-medium">{busDetails?.driver}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Students Onboard</span>
              <span className="font-medium">{busDetails?.students}</span>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={toggleTracking}
            >
              {showLiveTracking ? 'Show Route Overview' : 'Show Live Tracking'}
            </Button>
          </div>
        </Card>
        
        <Card className="bg-white">
          <div className="flex items-center mb-4">
            <div className="rounded-full bg-primary/10 p-3 mr-4">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Trip Information</h3>
              <p className="text-sm text-muted-foreground">Route and ETA</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Route</span>
              <span className="font-medium">{busDetails?.routeName}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Next Stop</span>
              <span className="font-medium">{busDetails?.nextStop}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estimated Arrival</span>
              <span className="font-medium">{estimatedArrival}</span>
            </div>
            
            <div className="rounded-md bg-amber-50 p-3 flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Traffic is moderate along the route. Estimated delays of 5-10 minutes possible.
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white">
          <div className="flex items-center mb-4">
            <div className="rounded-full bg-primary/10 p-3 mr-4">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Students Onboard</h3>
              <p className="text-sm text-muted-foreground">Real-time passenger list</p>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[220px]">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground">Grade</th>
                  <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[...Array(12)].map((_, index) => (
                  <tr key={index}>
                    <td className="py-2 px-2 text-sm whitespace-nowrap">
                      Student {index + 1}
                    </td>
                    <td className="py-2 px-2 text-sm whitespace-nowrap">
                      Grade {Math.floor(Math.random() * 12) + 1}
                    </td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        On Bus
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Students</span>
              <span className="font-medium">{busDetails?.students} / 36</span>
            </div>
          </div>
        </Card>
      </div>
      
      <Card title={showLiveTracking ? "Live Bus Location" : "Complete Route Overview"} className="mb-6">
        <div className="h-[500px]">
          <MapView 
            busId={busId} 
            tripId={tripId}
            height="100%" 
            showRoute={!showLiveTracking}
            showLayerControls={true}
          />
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Next Stops">
          <div className="space-y-3">
            {[1, 2, 3].map((stop) => (
              <div key={stop} className="flex items-start border-l-4 border-primary pl-4 py-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Stop #{stop}</h4>
                  <p className="text-sm text-muted-foreground">
                    {stop === 1 ? '1234 Broadway Ave' : stop === 2 ? '5678 Park Place' : '9012 Main St'}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      ETA: {stop === 1 ? '8:45 AM' : stop === 2 ? '9:00 AM' : '9:15 AM'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {stop === 1 ? '5 students' : stop === 2 ? '8 students' : '10 students'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card title="Trip History">
          <div className="space-y-3">
            <div className="flex items-center border-l-4 border-green-500 pl-4 py-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">Trip Started</h4>
                <p className="text-xs text-muted-foreground">
                  Bus departed from main depot
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                8:00 AM
              </div>
            </div>
            
            <div className="flex items-center border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">First Pickup</h4>
                <p className="text-xs text-muted-foreground">
                  7 students boarded at Westside Community Center
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                8:15 AM
              </div>
            </div>
            
            <div className="flex items-center border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">Second Pickup</h4>
                <p className="text-xs text-muted-foreground">
                  12 students boarded at Oakwood Apartments
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                8:30 AM
              </div>
            </div>
            
            <div className="flex items-center border-l-4 border-gray-300 pl-4 py-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">Third Pickup</h4>
                <p className="text-xs text-muted-foreground">
                  En route - Estimated 8:45 AM
                </p>
              </div>
              <div className="text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  In Progress
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
 