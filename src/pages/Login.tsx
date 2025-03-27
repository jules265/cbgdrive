import  { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Bus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <Bus className="h-10 w-10 text-primary" />
            <h1 className="ml-2 text-2xl font-bold text-gray-800">SchoolTrack</h1>
          </div>
        </div>
        
        <Card className="w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            
            <Button 
              type="submit" 
              className="w-full mt-4"
              isLoading={loading}
              disabled={loading}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account? Contact administrator
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
 