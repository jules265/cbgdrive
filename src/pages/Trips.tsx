import  { useEffect, useState, Fragment } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { Plus, Edit, Trash, Search, MapPin, Calendar, Clock, Check, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Select from '../components/Select';
import MapView from '../components/Map';
import { Trip, Bus, Driver, Student } from '../types';
import { Link } from 'react-router-dom';

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [viewRouteId, setViewRouteId] = useState<string | null>(null);
  
  const [currentTrip, setCurrentTrip] = useState<Partial<Trip>>({
    busId: '',
    driverId: '',
    route: '',
    status: 'scheduled',
    startTime: new Date().getTime(),
    estimatedEndTime: new Date().getTime() + 3600000, // 1 hour later
    students: [],
    checkpointReaches: {}
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch trips
      const tripsSnapshot = await getDocs(collection(db, 'trips'));
      const tripsData = tripsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trip[];
      setTrips(tripsData);
      
      // Fetch available buses
      const busesQuery = query(collection(db, 'buses'), where('currentTrip', '==', null));
      const busesSnapshot = await getDocs(busesQuery);
      const busesData = busesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bus[];
      setBuses(busesData);
      
      // Fetch available drivers
      const driversQuery = query(collection(db, 'drivers'), where('isOnDuty', '==', false));
      const driversSnapshot = await getDocs(driversQuery);
      const driversData = driversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Driver[];
      setDrivers(driversData);
      
      // Fetch available students
      const studentsQuery = query(collection(db, 'students'), where('isOnBus', '==', false));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }

  async function fetchTripDetails(tripId: string) {
    setSelectedTripId(tripId);
    
    try {
      const tripDoc = await getDoc(doc(db, 'trips', tripId));
      if (tripDoc.exists()) {
        const tripData = { id: tripDoc.id, ...tripDoc.data() } as Trip;
        
        // Get student details for this trip
        const studentPromises = tripData.students.map(studentId => 
          getDoc(doc(db, 'students', studentId))
        );
        
        const studentDocs = await Promise.all(studentPromises);
        const studentData = studentDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
        
        return { trip: tripData, students: studentData };
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
    }
    
    return null;
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === 'startTime' || name === 'estimatedEndTime') {
      setCurrentTrip({ 
        ...currentTrip, 
        [name]: new Date(value).getTime()
      });
    } else {
      setCurrentTrip({ ...currentTrip, [name]: value });
    }
  }

  function handleStudentSelection(studentId: string) {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!currentTrip.busId || !currentTrip.driverId || !currentTrip.route) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    
    try {
      const tripData = {
        ...currentTrip,
        students: selectedStudents,
        status: currentTrip.status || 'scheduled',
        checkpointReaches: {}
      };
      
      if (isEditing && currentTrip.id) {
        await updateDoc(doc(db, 'trips', currentTrip.id), tripData);
        toast.success('Trip updated successfully');
      } else {
        const tripRef = await addDoc(collection(db, 'trips'), tripData);
        
        // Update bus status
        await updateDoc(doc(db, 'buses', currentTrip.busId as string), {
          currentTrip: tripRef.id
        });
        
        // Update driver status
        await updateDoc(doc(db, 'drivers', currentTrip.driverId as string), {
          isOnDuty: true,
          currentBus: currentTrip.busId
        });
        
        // Update student status
        for (const studentId of selectedStudents) {
          await updateDoc(doc(db, 'students', studentId), {
            isOnBus: true,
            currentTrip: tripRef.id,
            currentBus: currentTrip.busId
          });
        }
        
        toast.success('Trip created successfully');
      }
      
      setIsAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving trip:', error);
      toast.error('Failed to save trip');
    }
  }

  async function handleStartTrip(tripId: string) {
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'in-progress',
        startTime: new Date().getTime()
      });
      
      toast.success('Trip started successfully');
      fetchData();
    } catch (error) {
      console.error('Error starting trip:', error);
      toast.error('Failed to start trip');
    }
  }

  async function handleCompleteTrip(tripId: string, busId: string, driverId: string, students: string[]) {
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'completed',
        actualEndTime: new Date().getTime()
      });
      
      // Update bus status
      await updateDoc(doc(db, 'buses', busId), {
        currentTrip: null
      });
      
      // Update driver status
      await updateDoc(doc(db, 'drivers', driverId), {
        isOnDuty: false,
        currentBus: null
      });
      
      // Update student status
      for (const studentId of students) {
        await updateDoc(doc(db, 'students', studentId), {
          isOnBus: false,
          currentTrip: null,
          currentBus: null
        });
      }
      
      toast.success('Trip completed successfully');
      fetchData();
    } catch (error) {
      console.error('Error completing trip:', error);
      toast.error('Failed to complete trip');
    }
  }

  async function handleEdit(trip: Trip) {
    setCurrentTrip(trip);
    setSelectedStudents(trip.students);
    setIsEditing(true);
    setIsAddModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        const tripDoc = await getDoc(doc(db, 'trips', id));
        if (tripDoc.exists()) {
          const tripData = tripDoc.data() as Trip;
          
          // Reset bus status
          if (tripData.busId) {
            await updateDoc(doc(db, 'buses', tripData.busId), {
              currentTrip: null
            });
          }
          
          // Reset driver status
          if (tripData.driverId) {
            await updateDoc(doc(db, 'drivers', tripData.driverId), {
              isOnDuty: false,
              currentBus: null
            });
          }
          
          // Reset student status
          for (const studentId of tripData.students) {
            await updateDoc(doc(db, 'students', studentId), {
              isOnBus: false,
              currentTrip: null,
              currentBus: null
            });
          }
        }
        
        await deleteDoc(doc(db, 'trips', id));
        toast.success('Trip deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting trip:', error);
        toast.error('Failed to delete trip');
      }
    }
  }
  
  function resetForm() {
    setCurrentTrip({
      busId: '',
      driverId: '',
      route: '',
      status: 'scheduled',
      startTime: new Date().getTime(),
      estimatedEndTime: new Date().getTime() + 3600000,
      students: [],
      checkpointReaches: {}
    });
    setSelectedStudents([]);
    setIsEditing(false);
  }

  function toggleRouteView(tripId: string) {
    setViewRouteId(viewRouteId === tripId ? null : tripId);
  }

  const filteredTrips = trips.filter(trip =>
    trip.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const routeOptions = [
    { value: 'Morning Pickup - North Route', label: 'Morning Pickup - North Route' },
    { value: 'Afternoon Dropoff - East Route', label: 'Afternoon Dropoff - East Route' },
    { value: 'Weekend Special - South Route', label: 'Weekend Special - South Route' },
    { value: 'Field Trip Route', label: 'Field Trip Route' }
  ];

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString();
  }

  function getStatusBadgeClass(status: Trip['status']) {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trips</h1>
          <p className="text-muted-foreground">Manage bus trips, assign drivers and students</p>
        </div>
        <Button onClick={() => { setIsAddModalOpen(true); setIsEditing(false); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Trip
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center p-4 bg-blue-50 rounded-lg">
            <img 
              src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBidXMlMjB0cmFja2luZyUyMGdwcyUyMG1hcHxlbnwwfHx8fDE3NDMwNTk1MDJ8MA&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600" 
              alt="Books showing study materials for trip planning"
              className="w-20 h-20 rounded-md mr-4 object-cover"
            />
            <div>
              <h3 className="font-semibold text-lg">Trip Planning Guide</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Follow our best practices for creating efficient and safe trips for students.
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center p-4 bg-amber-50 rounded-lg">
            <img 
              src="https://images.unsplash.com/photo-1577086664693-894d8405334a?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBidXMlMjB0cmFja2luZyUyMGdwcyUyMG1hcHxlbnwwfHx8fDE3NDMwNTk1MDJ8MA&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600" 
              alt="World map with pinned locations"
              className="w-20 h-20 rounded-md mr-4 object-cover"
            />
            <div>
              <h3 className="font-semibold text-lg">Route Optimization</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Plan and optimize your bus routes for maximum efficiency.
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search trips by route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Route</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Driver/Bus</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Students</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTrips.length > 0 ? (
                  filteredTrips.map((trip, index) => (
                    <Fragment key={`trip-group-${trip.id || index}`}>
                      <tr className={selectedTripId === trip.id ? 'bg-blue-50' : ''}>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium">{trip.route}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" /> {formatDate(trip.startTime).split(',')[0]}
                            </div>
                            <div className="flex items-center text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" /> {formatDate(trip.startTime).split(',')[1]}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="text-sm">
                              {drivers.find(d => d.id === trip.driverId)?.name || 'Unknown driver'}
                              <div className="text-xs text-muted-foreground">
                                Bus: {buses.find(b => b.id === trip.busId)?.plateNumber || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(trip.status)}`}>
                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-sm">{trip.students.length} students</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Link to={`/tracking/${trip.busId}/${trip.id}`}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Live Tracking"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => toggleRouteView(trip.id)}
                              title="View Route"
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          
                            {trip.status === 'scheduled' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleStartTrip(trip.id)}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            )}
                            
                            {trip.status === 'in-progress' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleCompleteTrip(trip.id, trip.busId, trip.driverId, trip.students)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(trip)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(trip.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {viewRouteId === trip.id && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <div className="h-80 border-t border-muted p-4 bg-muted/20">
                              <div className="mb-2 flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-primary" />
                                <span className="text-sm font-medium">Route Preview: {trip.route}</span>
                              </div>
                              <MapView tripId={trip.id} showRoute={true} showLayerControls={true} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      No trips found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Edit Trip' : 'Create New Trip'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Route"
                    name="route"
                    value={currentTrip.route}
                    onChange={handleInputChange}
                    options={routeOptions}
                    required
                  />
                  
                  <Select
                    label="Bus"
                    name="busId"
                    value={currentTrip.busId}
                    onChange={handleInputChange}
                    options={buses.map(bus => ({
                      value: bus.id,
                      label: `${bus.plateNumber} - ${bus.model} (${bus.capacity} seats)`
                    }))}
                    required
                  />
                  
                  <Select
                    label="Driver"
                    name="driverId"
                    value={currentTrip.driverId}
                    onChange={handleInputChange}
                    options={drivers.map(driver => ({
                      value: driver.id,
                      label: driver.name
                    }))}
                    required
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Start Time"
                      name="startTime"
                      type="datetime-local"
                      value={new Date(currentTrip.startTime || Date.now()).toISOString().slice(0, 16)}
                      onChange={handleInputChange}
                      required
                    />
                    
                    <Input
                      label="Estimated End Time"
                      name="estimatedEndTime"
                      type="datetime-local"
                      value={new Date(currentTrip.estimatedEndTime || Date.now() + 3600000).toISOString().slice(0, 16)}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  {/* Route preview */}
                  {currentTrip.route && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-1">Route Preview</label>
                      <div className="h-40 border rounded-md overflow-hidden">
                        <MapView 
                          height="100%" 
                          showRoute={true} 
                          tripId={currentTrip.id} 
                          showLayerControls={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Assign Students
                  </label>
                  <div className="border border-gray-300 rounded-md h-80 overflow-y-auto p-2">
                    {students.length === 0 ? (
                      <p className="text-center text-muted-foreground p-4">
                        No available students to assign
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {students.map(student => (
                          <div 
                            key={student.id} 
                            className={`p-2 border rounded-md flex items-center ${
                              selectedStudents.includes(student.id) ? 'bg-primary/10 border-primary' : ''
                            }`}
                            onClick={() => handleStudentSelection(student.id)}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 mr-2"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => {}}
                            />
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Grade {student.grade}, Class {student.class}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedStudents.length} students
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? 'Update' : 'Create'} Trip
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 