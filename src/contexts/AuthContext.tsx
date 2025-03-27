import  { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  signup: (email: string, password: string, displayName: string, role: User['role']) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setCurrentUser({
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || undefined,
              role: docSnap.data().role,
            });
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signup(email: string, password: string, displayName: string, role: User['role']) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName,
      role,
      createdAt: new Date().getTime(),
    });
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  const value = {
    currentUser,
    isLoading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
 