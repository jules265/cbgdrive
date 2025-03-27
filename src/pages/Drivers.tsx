import  { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit, Trash, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { Driver } from '../types';

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Partial<Driver>>({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    try {
      const querySnapshot = await getDocs(collection(db, 'drivers'));
      const driversData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Driver[];
      setDrivers(driversData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCurrentDriver({ ...currentDriver, [name]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (isEditing && currentDriver.id) {
        await updateDoc(doc(db, 'drivers', currentDriver.id), {
          ...currentDriver,
          isOnDuty: currentDriver.isOnDuty || false
        });
        toast.success('Driver updated successfully');
      } else {
        await addDoc(collection(db, 'drivers'), {
          ...currentDriver,
          isOnDuty: false,
          currentBus: null,
        });
        toast.success('Driver added successfully');
      }
      
      setIsAddModalOpen(false);
      setCurrentDriver({
        name: '',
        email: '',
        phone: '',
        licenseNumber: '',
      });
      setIsEditing(false);
      fetchDrivers();
    } catch (error) {
      console.error('Error saving driver:', error);
      toast.error('Failed to save driver');
    }
  }

  function handleEdit(driver: Driver) {
    setCurrentDriver(driver);
    setIsEditing(true);
    setIsAddModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await deleteDoc(doc(db, 'drivers', id));
        toast.success('Driver deleted successfully');
        fetchDrivers();
      } catch (error) {
        console.error('Error deleting driver:', error);
        toast.error('Failed to delete driver');
      }
    }
  }

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-muted-foreground">Manage driver information and assignments</p>
        </div>
        <Button onClick={() => { setIsAddModalOpen(true); setIsEditing(false); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
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
              placeholder="Search drivers..."
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
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Information</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">License Number</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDrivers.length > 0 ? (
                  filteredDrivers.map((driver) => (
                    <tr key={driver.id}>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {driver.name}
                      </td>
                      <td className="py-3 px-4">
                        <div>{driver.phone}</div>
                        <div className="text-sm text-muted-foreground">{driver.email}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {driver.licenseNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {driver.isOnDuty ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            On Duty
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Off Duty
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(driver)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(driver.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      No drivers found
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
              {isEditing ? 'Edit Driver' : 'Add New Driver'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <Input
                label="Full Name"
                name="name"
                value={currentDriver.name}
                onChange={handleInputChange}
                required
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={currentDriver.email}
                onChange={handleInputChange}
                required
              />
              
              <Input
                label="Phone Number"
                name="phone"
                value={currentDriver.phone}
                onChange={handleInputChange}
                required
              />
              
              <Input
                label="License Number"
                name="licenseNumber"
                value={currentDriver.licenseNumber}
                onChange={handleInputChange}
                required
              />
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setCurrentDriver({
                      name: '',
                      email: '',
                      phone: '',
                      licenseNumber: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? 'Update' : 'Add'} Driver
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 