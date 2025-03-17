import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import Home from './components/home/Home'; 
import Dashboard from './components/dashboard/Dashboard';
import Inventory from './components/inventory/Inventory';
import Loading from './components/loading/Loading'; 
import Unloading from './components/unloading/Unloading'; 
import Header from './components/layout/Header'; 
import Footer from './components/layout/Footer'; 
import InitializeFirebaseData from './InitializeFirebaseData'; 


// import { Link } from 'react-router-dom';



export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100">
          <Header />

          <div className="container flex-grow-1 d-flex mt-3">
            <main className="flex-grow-1">
              <Routes>
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegistrationForm />} />
                <Route path="/init-db" element={<InitializeFirebaseData />} />
                <Route 
                  path="/home" 
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  } 
                />
                  <Route 
                    path="/dashboard" 
                     element={
                     <ProtectedRoute>
                     <Dashboard />
                     </ProtectedRoute>
                     } 
                  />
                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/loading" 
                  element={
                    <ProtectedRoute>
                      <Loading />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/unloading" 
                  element={
                    <ProtectedRoute>
                      <Unloading />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/home" />} />
              </Routes>
            </main>
          </div>

          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}
