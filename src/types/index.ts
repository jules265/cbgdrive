export  interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'driver' | 'manager';
  photoURL?: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  class: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  currentTrip?: string;
  currentBus?: string;
  isOnBus: boolean;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  photoURL?: string;
  currentBus?: string;
  isOnDuty: boolean;
}

export interface Bus {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  driverId?: string;
  currentTrip?: string;
  location?: {
    lat: number;
    lng: number;
    timestamp: number;
  };
}

export interface Trip {
  id: string;
  busId: string;
  driverId: string;
  route: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startTime: number;
  estimatedEndTime: number;
  actualEndTime?: number;
  students: string[];
  checkpointReaches: Record<string, { timestamp: number; studentsOffBoarded: string[] }>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  type: 'student-offboard' | 'trip-start' | 'trip-end' | 'emergency';
  location?: { lat: number; lng: number };
  driverId?: string;
  studentId?: string;
  tripId?: string;
  busId?: string;
}
 