import  { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit, Trash, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Select from '../components/Select';
import { Student } from '../types';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student>>({
    name: '',
    grade: '',
    class: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setCurrentStudent({ ...currentStudent, [name]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (isEditing && currentStudent.id) {
        await updateDoc(doc(db, 'students', currentStudent.id), {
          ...currentStudent,
          isOnBus: currentStudent.isOnBus || false
        });
        toast.success('Student updated successfully');
      } else {
        await addDoc(collection(db, 'students'), {
          ...currentStudent,
          isOnBus: false,
          currentTrip: null,
          currentBus: null
        });
        toast.success('Student added successfully');
      }
      
      setIsAddModalOpen(false);
      setCurrentStudent({
        name: '',
        grade: '',
        class: '',
        parentPhone: '',
        parentEmail: '',
        address: '',
      });
      setIsEditing(false);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error('Failed to save student');
    }
  }

  function handleEdit(student: Student) {
    setCurrentStudent(student);
    setIsEditing(true);
    setIsAddModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteDoc(doc(db, 'students', id));
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student');
      }
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student information and track their trips</p>
        </div>
        <Button onClick={() => { setIsAddModalOpen(true); setIsEditing(false); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
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
              placeholder="Search students..."
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
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Grade/Class</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Parent Contact</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="py-3 px-4 whitespace-nowrap">{student.name}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {student.grade} - {student.class}
                      </td>
                      <td className="py-3 px-4">
                        <div>{student.parentPhone}</div>
                        <div className="text-sm text-muted-foreground">{student.parentEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        {student.isOnBus ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            On Bus
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not on bus
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(student.id)}
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
                      No students found
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
              {isEditing ? 'Edit Student' : 'Add New Student'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <Input
                label="Full Name"
                name="name"
                value={currentStudent.name}
                onChange={handleInputChange}
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Grade"
                  name="grade"
                  value={currentStudent.grade}
                  onChange={handleInputChange}
                  options={[
                    { value: '1', label: 'Grade 1' },
                    { value: '2', label: 'Grade 2' },
                    { value: '3', label: 'Grade 3' },
                    { value: '4', label: 'Grade 4' },
                    { value: '5', label: 'Grade 5' },
                    { value: '6', label: 'Grade 6' },
                    { value: '7', label: 'Grade 7' },
                    { value: '8', label: 'Grade 8' },
                    { value: '9', label: 'Grade 9' },
                    { value: '10', label: 'Grade 10' },
                    { value: '11', label: 'Grade 11' },
                    { value: '12', label: 'Grade 12' },
                  ]}
                  required
                />
                
                <Input
                  label="Class"
                  name="class"
                  value={currentStudent.class}
                  onChange={handleInputChange}
                  placeholder="e.g. A, B, C"
                  required
                />
              </div>
              
              <Input
                label="Parent Phone"
                name="parentPhone"
                value={currentStudent.parentPhone}
                onChange={handleInputChange}
                required
              />
              
              <Input
                label="Parent Email"
                name="parentEmail"
                type="email"
                value={currentStudent.parentEmail}
                onChange={handleInputChange}
              />
              
              <Input
                label="Address"
                name="address"
                value={currentStudent.address}
                onChange={handleInputChange}
                required
              />
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setCurrentStudent({
                      name: '',
                      grade: '',
                      class: '',
                      parentPhone: '',
                      parentEmail: '',
                      address: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? 'Update' : 'Add'} Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 