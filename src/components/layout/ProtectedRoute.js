import React from 'react';
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <p>Завантаження...</p>; // Або спінер
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
}