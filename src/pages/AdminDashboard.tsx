import  { useEffect, useState } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { Bus, Users, Map, Bell, AlertTriangle, Calendar, Info, RefreshCw } from 'lucide-react';
import { db } from '../firebase/config';
import Card from '../components/Card';
import MapView from '../components/Map';
import { Bus as BusType, Trip, Student, Driver, Notification } from '../types';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function AdminDashboard() {
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [adminLocation, setAdminLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationInput, setLocationInput] = useState({ lat: '', lng: '' });
  const [showLocationForm, setShowLocationForm] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch active trips
        const tripsQuery = query(
          collection(db, 'trips'),
          where('status', '==', 'in-progress')
        );
        const tripsSnapshot = await getDocs(tripsQuery);
        const tripsData = tripsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Trip[];
        setActiveTrips(tripsData);
        
        // Fetch buses
        const busesQuery = query(collection(db, 'buses'));
        const busesSnapshot = await getDocs(busesQuery);
        const busesData = busesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BusType[];
        setBuses(busesData);
        
        // Fetch drivers
        const driversQuery = query(collection(db, 'drivers'));
        const driversSnapshot = await getDocs(driversQuery);
        const driversData = driversSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Driver[];
        setDrivers(driversData);
        
        // Set first bus as selected if any
        if (busesData.length > 0 && busesData[0].currentTrip) {
          setSelectedBus(busesData[0].id);
          setSelectedTrip(busesData[0].currentTrip);
        }
        
        // Fetch students on buses
        const studentsQuery = query(
          collection(db, 'students'),
          where('isOnBus', '==', true)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Student[];
        setStudents(studentsData);
        
        // Setup real-time notifications
        const notificationsUnsubscribe = onSnapshot(
          query(
            collection(db, 'notifications'),
            where('userId', '==', 'admin'),
            where('read', '==', false)
          ),
          (snapshot) => {
            const notificationsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Notification[];
            
            setNotifications(notificationsData);
          }
        );
        
        // Setup real-time bus location updates
        const busesUnsubscribe = onSnapshot(
          collection(db, 'buses'),
          (snapshot) => {
            const updatedBuses = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as BusType[];
            
            setBuses(updatedBuses);
          }
        );
        
        // Setup real-time student tracking
        const studentsUnsubscribe = onSnapshot(
          query(collection(db, 'students'), where('isOnBus', '==', true)),
          (snapshot) => {
            const updatedStudents = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Student[];
            
            setStudents(updatedStudents);
          }
        );
        
        setLoading(false);
        
        return () => {
          notificationsUnsubscribe();
          busesUnsubscribe();
          studentsUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  function handleBusSelect(busId: string, tripId: string | undefined) {
    setSelectedBus(busId);
    if (tripId) {
      setSelectedTrip(tripId);
    }
  }

  function getDriverName(driverId: string) {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  }
  
  const handleSetAdminLocation = () => {
    // Get browser location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setAdminLocation(newLocation);
          setLocationInput({
            lat: newLocation.lat.toString(),
            lng: newLocation.lng.toString()
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setShowLocationForm(true);
        }
      );
    } else {
      setShowLocationForm(true);
    }
  };
  
  const handleManualLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(locationInput.lat);
    const lng = parseFloat(locationInput.lng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setAdminLocation({ lat, lng });
      setShowLocationForm(false);
    }
  };
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)} minutes ago`;
    } else if (diffSeconds < 86400) {
      return `${Math.floor(diffSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffSeconds / 86400)} days ago`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
        <p className="text-muted-foreground">Monitor all bus trips and students in real-time</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-100">Active Buses</p>
              <h3 className="text-2xl font-bold">{buses.filter(bus => bus.currentTrip).length}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-100">Students On Buses</p>
              <h3 className="text-2xl font-bold">{students.length}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <div className="flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-100">Active Trips</p>
              <h3 className="text-2xl font-bold">{activeTrips.length}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <Link to="/trips" className="flex items-center">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-100">Manage Trips</p>
              <h3 className="text-xl font-bold">Assign Routes</h3>
            </div>
          </Link>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Live Bus Tracking" className="h-full">
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap justify-between items-center mb-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {buses.filter(bus => bus.currentTrip).map(bus => (
                      <button
                        key={bus.id}
                        onClick={() => handleBusSelect(bus.id, bus.currentTrip)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedBus === bus.id
                            ? 'bg-primary text-white'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        Bus {bus.plateNumber}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-end mb-2">
                    {!adminLocation ? (
                      <Button onClick={handleSetAdminLocation} size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Set My Location
                      </Button>
                    ) : (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1 text-primary" />
                        Your location set: {adminLocation.lat.toFixed(4)}, {adminLocation.lng.toFixed(4)}
                        <button 
                          className="ml-2 text-primary hover:underline"
                          onClick={() => setAdminLocation(null)}
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {showLocationForm && (
                  <form onSubmit={handleManualLocationSubmit} className="mb-4 p-3 border rounded-md bg-muted/20">
                    <div className="text-sm font-medium mb-2">Enter Your Location Manually</div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Latitude"
                        value={locationInput.lat}
                        onChange={(e) => setLocationInput({ ...locationInput, lat: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Longitude"
                        value={locationInput.lng}
                        onChange={(e) => setLocationInput({ ...locationInput, lng: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                      <button 
                        type="submit" 
                        className="px-3 py-1 bg-primary text-white rounded text-sm"
                      >
                        Set
                      </button>
                    </div>
                  </form>
                )}
                
                {selectedBus ? (
                  <div className="relative">
                    <MapView 
                      busId={selectedBus} 
                      tripId={selectedTrip || undefined}
                      height="450px" 
                      showRoute={true}
                      showLayerControls={true}
                      manualLocation={adminLocation}
                    />
                    
                    {/* Trip info overlay */}
                    {selectedTrip && (
                      <div className="absolute top-2 right-2 bg-white rounded-md shadow p-3 max-w-xs z-10">
                        <div className="flex items-center mb-2">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-semibold text-sm">Current Trip</span>
                        </div>
                        
                        {activeTrips.filter(trip => trip.id === selectedTrip).map(trip => (
                          <div key={trip.id} className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Route:</span>
                              <span className="font-medium">{trip.route}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Driver:</span>
                              <span>{getDriverName(trip.driverId)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Students:</span>
                              <span>{trip.students.length} on board</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Started:</span>
                              <span>{new Date(trip.startTime).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
                    <Map className="h-12 w-12 mb-2" />
                    <p>Select a bus to view its location and route</p>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
        
        <div>
          <Card title="Active Routes" className="mb-6">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activeTrips.length > 0 ? (
              <div className="space-y-4">
                {activeTrips.map(trip => (
                  <div 
                    key={trip.id} 
                    className={`p-3 border rounded-lg cursor-pointer transition hover:bg-muted/50 ${
                      selectedTrip === trip.id ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => {
                      const bus = buses.find(b => b.currentTrip === trip.id);
                      if (bus) {
                        handleBusSelect(bus.id, trip.id);
                      }
                    }}
                  >
                    <div className="font-medium text-sm">{trip.route}</div>
                    <div className="mt-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Driver: {getDriverName(trip.driverId)}
                      </span>
                      <span className="text-primary">
                        {trip.students.length} students
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Started: {new Date(trip.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Map className="h-10 w-10 mx-auto mb-2" />
                <p className="text-sm">No active routes at the moment</p>
              </div>
            )}
          </Card>
          
          <Card title="Recent Notifications">
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div key={notification.id} className="flex items-start p-3 bg-muted rounded-md">
                    {notification.type === 'student-offboard' ? (
                      <AlertTriangle className="h-5 w-5 mr-3 text-amber-500 flex-shrink-0" />
                    ) : (
                      <Bell className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimestamp(notification.timestamp)}</p>
                      
                      {notification.location && (
                        <button 
                          className="text-xs text-primary mt-1 flex items-center"
                          onClick={() => {
                            setAdminLocation(notification.location);
                            
                            // If related to a bus, select that bus
                            if (notification.busId) {
                              setSelectedBus(notification.busId);
                              setSelectedTrip(notification.tripId);
                            }
                          }}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          View Location
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-start p-3 bg-muted rounded-md">
                  <Bell className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">No New Notifications</p>
                    <p className="text-xs text-muted-foreground">All student movements are tracked here</p>
                  </div>
                </div>
              )}
              
              <Link to="/trips" className="block w-full">
                <div className="flex items-center justify-center p-3 bg-primary/10 text-primary rounded-md font-medium text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Trips
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
 