import  { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User, Users, Bus, MapPin, Settings, Bell, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-card shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Bus className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold">SchoolTrack</span>
            </Link>
          </div>
          
          {currentUser && (
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link 
                to="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                Dashboard
              </Link>
              
              {currentUser.role === 'admin' && (
                <>
                  <Link 
                    to="/students" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/students') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    Students
                  </Link>
                  <Link 
                    to="/drivers" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/drivers') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    Drivers
                  </Link>
                  <Link 
                    to="/buses" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/buses') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    Buses
                  </Link>
                  <Link 
                    to="/trips" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/trips') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Trips
                    </span>
                  </Link>
                </>
              )}
              
              {currentUser.role === 'driver' && (
                <Link 
                  to="/my-trips" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/my-trips') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  My Trips
                </Link>
              )}
              
              <div className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted">
                <Bell className="h-5 w-5" />
              </div>
              
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted flex items-center"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          )}
          
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && currentUser && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            
            {currentUser.role === 'admin' && (
              <>
                <Link
                  to="/students"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/students') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Students
                </Link>
                <Link
                  to="/drivers"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/drivers') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Drivers
                </Link>
                <Link
                  to="/buses"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/buses') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Buses
                </Link>
                <Link
                  to="/trips"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/trips') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Trips
                  </span>
                </Link>
              </>
            )}
            
            {currentUser.role === 'driver' && (
              <Link
                to="/my-trips"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/my-trips') ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setIsOpen(false)}
              >
                My Trips
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium hover:bg-muted"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
 