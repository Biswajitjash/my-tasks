import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import UserLogin from './components/UserLogin';
import UserCreate from './components/UserCreate';
import UserPasswordUpdate from './components/UserPasswordUpdate';
import Dashboard from './components/Dashboard';
import TicketRaised from './components/TicketRaised';
import TicketUpdate from './components/TicketUpdate';
import Feedbacks from './components/Feedbacks';
import ShowDetails from './components/ShowDetails';
import NotificationSystem from './components/NotificationSystem';
import './styles/App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifData, setNotifData] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleBellRender = useCallback((data) => {
    setNotifData(data);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!currentUser) return <Navigate to="/login" replace />;
    return children;
  };

  const PublicRoute = ({ children }) => {
    if (currentUser) return <Navigate to="/dashboard" replace />;
    return children;
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar currentUser={currentUser} setCurrentUser={setCurrentUser} notifData={notifData} />

        {/* Global notification polling — invisible, runs in background */}
        {currentUser && (
          <NotificationSystem currentUser={currentUser} onBellRender={handleBellRender} />
        )}

        <Routes>
          <Route path="/login" element={<PublicRoute><UserLogin setCurrentUser={setCurrentUser} /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><UserCreate /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard currentUser={currentUser} /></ProtectedRoute>} />
          <Route path="/tickets/:id" element={<ShowDetails currentUser={currentUser} />} />
          <Route path="/tickets/new" element={<ProtectedRoute><TicketRaised currentUser={currentUser} /></ProtectedRoute>} />
          <Route path="/tickets/edit/:id" element={<ProtectedRoute><TicketUpdate currentUser={currentUser} /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><Feedbacks currentUser={currentUser} /></ProtectedRoute>} />
          <Route path="/change-password" element={<PublicRoute><UserPasswordUpdate /></PublicRoute>} />
          <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
          <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
