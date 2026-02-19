import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationBell, NotificationPanel } from './NotificationSystem';

const Navbar = ({ currentUser, setCurrentUser, notifData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [panelOpen, setPanelOpen] = useState(false);
  const bellWrapRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handler = (e) => {
      if (bellWrapRef.current && !bellWrapRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const count = notifData?.count || 0;
  const notifications = notifData?.notifications || [];

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div
          className="navbar-brand"
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          {currentUser?.fullName || currentUser?.username || 'User'}
        </div>

        {currentUser && (
          <div className="navbar-links">
            <span
              className={`nav-link ${isActive('/tickets/new') ? 'active' : ''}`}
              onClick={() => navigate('/tickets/new')}
            >
              New Ticket
            </span>

            {/* <span
              className={`nav-link ${isActive('/feedback') ? 'active' : ''}`}
              onClick={() => navigate('/feedback')}
            >
              Feedback
            </span> */}

            {/* 🔔 Notification Bell */}
            <div ref={bellWrapRef} style={{ position: 'relative', color: 'Highlight', background: 'black' }}>
              <NotificationBell
                count={count}
                onClick={() => setPanelOpen((prev) => !prev)}
              />
              {panelOpen && (
                <NotificationPanel
                  notifications={notifications}
                  onDismiss={notifData?.dismissNotif}
                  onClearAll={notifData?.clearAll}
                  onClose={() => setPanelOpen(false)}
                  onNavigate={notifData?.handleNavigate}
                />
              )}
            </div>

            <span className="nav-link" onClick={handleLogout}>
              Logout
            </span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
