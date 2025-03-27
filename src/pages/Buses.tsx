import  { useEffect, useState, Fragment } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Plus, Edit, Trash, Search, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Select from '../components/Select';
import MapView from '../components/Map';
import { Bus, Driver } from '../types';

export default function Buses() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentBus, setCurrentBus] = useState<Partial<Bus>>({
    plateNumber: '',
    model: '',
    capacity: 0,
    driverId: '',
  });
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch buses
      const busesSnapshot = await getDocs(collection(db, 'buses'));
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
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setCurrentBus({ 
      ...currentBus, 
      [name]: name === 'capacity' ? parseInt(value) : value 
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (isEditing && currentBus.id) {
        await updateDoc(doc(db, 'buses', currentBus.id), currentBus);
        toast.success('Bus updated successfully');
      } else {
        await addDoc(collection(db, 'buses'), {
          ...currentBus,
          location: null,
          currentTrip: null,
        });
        toast.success('Bus added successfully');
      }
      
      setIsAddModalOpen(false);
      setCurrentBus({
        plateNumber: '',
        model: '',
        capacity: 0,
        driverId: '',
      });
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error('Error saving bus:', error);
      toast.error('Failed to save bus');
    }
  }

  function handleEdit(bus: Bus) {
    setCurrentBus(bus);
    setIsEditing(true);
    setIsAddModalOpen(true);
  }

  function handleViewLocation(busId: string) {
    setSelectedBusId(selectedBusId === busId ? null : busId);
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        await deleteDoc(doc(db, 'buses', id));
        toast.success('Bus deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting bus:', error);
        toast.error('Failed to delete bus');
      }
    }
  }

  const filteredBuses = buses.filter(bus =>
    bus.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Buses</h1>
          <p className="text-muted-foreground">Manage buses, assign drivers and track location</p>
        </div>
        <Button onClick={() => { setIsAddModalOpen(true); setIsEditing(false); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bus
        </Button>
      </div>
      
      <Card>
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search buses..."
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
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Plate Number</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Capacity</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBuses.length > 0 ? (
                  filteredBuses.map((bus) => (
                    <Fragment key={`bus-group-${bus.id}`}>
                      <tr>
                        <td className="py-3 px-4 whitespace-nowrap font-medium">
                          {bus.plateNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {bus.model}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {bus.capacity} seats
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {bus.currentTrip ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              On Trip
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(bus)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewLocation(bus.id)}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(bus.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {selectedBusId === bus.id && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-muted">
                            <div className="h-64">
                              <MapView busId={bus.id} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      No buses found
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
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Edit Bus' : 'Add New Bus'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <Input
                label="Plate Number"
                name="plateNumber"
                value={currentBus.plateNumber}
                onChange={handleInputChange}
                required
              />
              
              <Input
                label="Model"
                name="model"
                value={currentBus.model}
                onChange={handleInputChange}
                required
              />
              
              <Input
                label="Capacity"
                name="capacity"
                type="number"
                min="1"
                value={currentBus.capacity?.toString() || ''}
                onChange={handleInputChange}
                required
              />
              
              <Select
                label="Assign Driver (Optional)"
                name="driverId"
                value={currentBus.driverId || ''}
                onChange={handleInputChange}
                options={drivers.map(driver => ({
                  value: driver.id,
                  label: driver.name
                }))}
              />
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setCurrentBus({
                      plateNumber: '',
                      model: '',
                      capacity: 0,
                      driverId: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? 'Update' : 'Add'} Bus
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 