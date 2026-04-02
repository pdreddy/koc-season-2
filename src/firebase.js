import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDbO0eP52i4t3V94bEiDcl7WoKbSrrM9VA',
  authDomain: 'koc2-20fb8.firebaseapp.com',
  databaseURL: 'https://koc2-20fb8-default-rtdb.firebaseio.com',
  projectId: 'koc2-20fb8',
  storageBucket: 'koc2-20fb8.firebasestorage.app',
  messagingSenderId: '317734341461',
  appId: '1:317734341461:web:1bcad5a1792fac0e46bddc',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export const db = getDatabase(app);
export { auth };
export const MATCHES_REF = 'KOC2DBPONEW';
