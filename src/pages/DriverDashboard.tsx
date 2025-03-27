import  { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, updateDoc, where, addDoc, onSnapshot } from 'firebase/firestore';
import { MapPin, User, Check, AlertTriangle, Map, Navigation, LogOut, Clock } from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import MapView from '../components/Map';
import { Trip, Student, Bus as BusType } from '../types';
import { toast } from 'react-toastify';

export default function DriverDashboard() {
  const { currentUser } = useAuth();
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [bus, setBus] = useState<BusType | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isDeboardingActive, setIsDeboardingActive] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showConfirmDeboard, setShowConfirmDeboard] = useState(false);

  useEffect(() => {
    async function fetchDriverData() {
      if (!currentUser) return;
      
      try {
        // Get driver's active trip
        const tripsQuery = query(
          collection(db, 'trips'),
          where('driverId', '==', currentUser.id),
          where('status', '==', 'in-progress')
        );
        const tripsSnapshot = await getDocs(tripsQuery);
        
        if (!tripsSnapshot.empty) {
          const tripData = {
            id: tripsSnapshot.docs[0].id,
            ...tripsSnapshot.docs[0].data()
          } as Trip;
          setActiveTrip(tripData);
          
          // Get bus info
          const busDoc = await getDoc(doc(db, 'buses', tripData.busId));
          if (busDoc.exists()) {
            setBus({ id: busDoc.id, ...busDoc.data() } as BusType);
          }
          
          // Get students on this trip
          const studentPromises = tripData.students.map(studentId => 
            getDoc(doc(db, 'students', studentId))
          );
          
          const studentDocs = await Promise.all(studentPromises);
          const studentData = studentDocs
            .filter(doc => doc.exists())
            .map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
          
          setStudents(studentData);
          
          // Set up real-time updates for students (to detect changes made by admin)
          const unsubscribeStudents = onSnapshot(
            query(collection(db, 'students'), where('currentTrip', '==', tripData.id)),
            (snapshot) => {
              const updatedStudents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Student[];
              setStudents(updatedStudents);
            }
          );
          
          return () => {
            unsubscribeStudents();
          };
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching driver data:', error);
        setLoading(false);
      }
    }
    
    fetchDriverData();
  }, [currentUser]);

  useEffect(() => {
    // Clean up location tracking when component unmounts
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setLocation(newLocation);
        
        // If we have an active trip and bus, update its location in Firebase
        if (activeTrip && bus) {
          updateBusLocation(newLocation);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error(`Location error: ${error.message}`);
        setIsTracking(false);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 30000, 
        timeout: 27000 
      }
    );
    
    setWatchId(id);
  };

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  const updateBusLocation = async (location: { lat: number; lng: number }) => {
    if (!bus || !activeTrip) return;
    
    try {
      await updateDoc(doc(db, 'buses', bus.id), {
        location: {
          ...location,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Error updating bus location:', error);
    }
  };

  const handleStartDeboarding = () => {
    setIsDeboardingActive(true);
    toast.info('Deboarding mode activated. Select students who are getting off the bus.');
  };

  const handleStudentSelection = (studentId: string) => {
    if (!isDeboardingActive) return;
    
    setSelectedStudent(studentId);
    setShowConfirmDeboard(true);
  };

  const handleMarkOffBoarded = async () => {
    if (!activeTrip || !bus || !selectedStudent) return;
    
    try {
      // Update student status
      await updateDoc(doc(db, 'students', selectedStudent), {
        isOnBus: false,
        currentTrip: null,
        currentBus: null
      });
      
      // Update local state
      setStudents(students.map(student => 
        student.id === selectedStudent
          ? { ...student, isOnBus: false }
          : student
      ));
      
      // Create notification for admin
      const student = students.find(s => s.id === selectedStudent);
      if (student) {
        const currentLocation = location ? `at location (${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})` : '';
        
        const notificationData = {
          userId: 'admin', // This would typically be the admin user ID
          title: 'Student Deboarded',
          message: `${student.name} has gotten off the bus ${currentLocation}`,
          read: false,
          timestamp: Date.now(),
          type: 'student-offboard',
          location: location,
          driverId: currentUser?.id,
          studentId: student.id,
          tripId: activeTrip.id,
          busId: bus.id
        };
        
        await addDoc(collection(db, 'notifications'), notificationData);
        
        toast.success(`${student.name} marked as deboarded`);
      }
      
      setShowConfirmDeboard(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error marking student as offboarded:', error);
      toast.error('Failed to update student status');
    }
  };

  const handleFinishDeboarding = () => {
    setIsDeboardingActive(false);
    setSelectedStudent(null);
    toast.success('Deboarding mode deactivated.');
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
        <h1 className="text-2xl font-bold">Driver Dashboard</h1>
        <p className="text-muted-foreground">Manage your active trip and student tracking</p>
      </div>
      
      {activeTrip && bus ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-primary/10 p-3 mr-3">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Active Trip</h3>
                  <p className="text-sm text-muted-foreground">{activeTrip.route}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bus</p>
                  <p className="font-medium">{bus.plateNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Students</p>
                  <p className="font-medium">{students.filter(s => s.isOnBus).length} on board</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Time</p>
                  <p className="font-medium">{new Date(activeTrip.startTime).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Est. Completion</p>
                  <p className="font-medium">{new Date(activeTrip.estimatedEndTime).toLocaleTimeString()}</p>
                </div>
              </div>
            </Card>
            
            <Card className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-primary/10 p-3 mr-3">
                  <Map className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Location Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    {isTracking ? 'Tracking active - Admin can see your location' : 'Start tracking to share your location'}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                {!isTracking ? (
                  <Button onClick={startLocationTracking} className="w-full">
                    <Navigation className="h-4 w-4 mr-2" />
                    Start Location Tracking
                  </Button>
                ) : (
                  <Button onClick={stopLocationTracking} variant="outline" className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Stop Location Tracking
                  </Button>
                )}
              </div>
              
              <div className="relative h-[180px] rounded-lg overflow-hidden">
                <MapView 
                  busId={bus.id} 
                  tripId={activeTrip.id}
                  height="180px"
                  manualLocation={location}
                />
                {location && (
                  <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow text-xs">
                    <div className="font-medium mb-1">Current Location</div>
                    <div>Lat: {location.lat.toFixed(6)}</div>
                    <div>Lng: {location.lng.toFixed(6)}</div>
                    <div className="text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          <Card title="Student Management">
            <div className="mb-4 flex flex-wrap gap-2">
              {!isDeboardingActive ? (
                <Button onClick={handleStartDeboarding}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Start Student Deboarding
                </Button>
              ) : (
                <>
                  <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-md flex items-center w-full md:w-auto mb-2">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>Deboarding Mode Active - Select students who are getting off the bus</span>
                  </div>
                  
                  <Button onClick={handleFinishDeboarding} variant="outline">
                    <Check className="h-4 w-4 mr-2" />
                    Finish Deboarding
                  </Button>
                </>
              )}
            </div>
            
            {students.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                <p>No students assigned to this trip</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium text-sm">Name</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Grade</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Parent Contact</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr 
                        key={student.id} 
                        className={`border-b ${
                          isDeboardingActive && student.isOnBus ? 'hover:bg-muted/50 cursor-pointer' : ''
                        } ${
                          isDeboardingActive && selectedStudent === student.id ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => {
                          if (isDeboardingActive && student.isOnBus) {
                            handleStudentSelection(student.id);
                          }
                        }}
                      >
                        <td className="py-3 px-4">{student.name}</td>
                        <td className="py-3 px-4">Grade {student.grade}, Class {student.class}</td>
                        <td className="py-3 px-4">{student.parentPhone}</td>
                        <td className="py-3 px-4">
                          {student.isOnBus ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              On Board
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Deboarded
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {student.isOnBus && (
                            <Button
                              variant={isDeboardingActive ? "primary" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isDeboardingActive) {
                                  handleStudentSelection(student.id);
                                }
                              }}
                              disabled={!isDeboardingActive}
                            >
                              <LogOut className="h-4 w-4 mr-1" />
                              Mark Off
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
            <h3 className="text-lg font-medium mb-2">No Active Trip</h3>
            <p className="text-muted-foreground">
              You don't have any active trips at the moment.
            </p>
          </div>
        </Card>
      )}
      
      {/* Confirm Deboarding Modal */}
      {showConfirmDeboard && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Student Deboarding</h2>
            
            <p className="mb-4">
              Are you sure {students.find(s => s.id === selectedStudent)?.name} is getting off the bus?
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDeboard(false);
                  setSelectedStudent(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleMarkOffBoarded}>
                <Check className="h-4 w-4 mr-2" />
                Confirm Deboarding
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 