import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Login from './pages/login';
import AdminDashboard from './pages/AdminDashboard';
import DosenDashboard from './pages/DosenDashboard';

export default function App() {
  const [user, setUser] = useState(null); // Simpan semua data user termasuk role
  const navigate = useNavigate();

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.role === 'admin') {
      navigate('/admin');
    } else if (userData.role === 'dosen') {
      navigate('/dosen');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login onLoginSuccess={handleLoginSuccess} />}
      />

      <Route
        path="/admin"
        element={
          user?.role === 'admin' ? (
            <AdminDashboard onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/dosen"
        element={
          user?.role === 'dosen' ? (
            <DosenDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
