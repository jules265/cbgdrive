import  { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import Students from './pages/Students';
import Drivers from './pages/Drivers';
import Buses from './pages/Buses';
import Trips from './pages/Trips';
import TrackingDemo from './pages/TrackingDemo';

function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: JSX.Element; 
  requiredRole?: string[];
}) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex w-full h-screen items-center justify-center flex-col space-y-3 p-2">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="text-base font-semibold">
          Loading...
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRole && !requiredRole.includes(currentUser.role)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  return children;
}

function App() {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // Mock location updates for driver app
  useEffect(() => {
    if (currentUser?.role === 'driver') {
      // Simulating GPS location updates
      const interval = setInterval(() => {
        // In a real app, this would use the browser's geolocation API
        // and update the driver's bus location in Firebase
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);
  
  return (
    <div className="min-h-screen bg-background">
      {currentUser && location.pathname !== '/login' && <Navbar />}
      
      <Routes>
        <Route path="/login" element={
          currentUser ? <Navigate to="/dashboard" /> : <Login />
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {currentUser?.role === 'admin' ? <AdminDashboard /> : <DriverDashboard />}
          </ProtectedRoute>
        } />
        
        <Route path="/students" element={
          <ProtectedRoute requiredRole={['admin']}>
            <Students />
          </ProtectedRoute>
        } />
        
        <Route path="/drivers" element={
          <ProtectedRoute requiredRole={['admin']}>
            <Drivers />
          </ProtectedRoute>
        } />
        
        <Route path="/buses" element={
          <ProtectedRoute requiredRole={['admin']}>
            <Buses />
          </ProtectedRoute>
        } />
        
        <Route path="/trips" element={
          <ProtectedRoute requiredRole={['admin']}>
            <Trips />
          </ProtectedRoute>
        } />
        
        <Route path="/tracking/:busId/:tripId" element={
          <ProtectedRoute>
            <TrackingDemo />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
 