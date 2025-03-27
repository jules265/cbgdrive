import  { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCS024K6CozcOvOLHMou9dKsNDh-fCw10c",
  authDomain: "usermanagr.firebaseapp.com",
  projectId: "usermanagr",
  storageBucket: "usermanagr.appspot.com",
  messagingSenderId: "201891796617",
  appId: "1:201891796617:web:ab31f6c5b0e1becb6bd858",
  measurementId: "G-WPNMDSTYXZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
 