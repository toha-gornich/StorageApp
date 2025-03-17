import React, { createContext, useState, useEffect, useContext } from 'react';

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
} from 'firebase/auth';
import { app } from '../FirebaseConfig'; 

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  // Set up authentication state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  // Function for user login
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user); // Оновлюємо стан користувача
      return userCredential.user;
    } catch (error) {
      throw new Error("Невірні облікові дані: " + error.message);
    }
  }

  // Function for user registration
  async function register(name, email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Оновлюємо профіль користувача
      await updateProfile(userCredential.user, { displayName: name });
  
      // Оновлюємо стан
      setCurrentUser({ ...userCredential.user, displayName: name });
  
      return userCredential.user;
    } catch (error) {
      throw new Error("Помилка реєстрації: " + error.message);
    }
  }

  // Function for user logout
  async function logout() {
    try {
      await signOut(auth);
      setCurrentUser(null); // Очищаємо стан після виходу
      return true;
    } catch (error) {
      throw new Error("Помилка виходу: " + error.message);
    }
  }

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}