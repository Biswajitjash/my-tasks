import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../utils/api';

// ─── Voice Announcement ────────────────────────────────────────────────
const speakNotification = (ticketId) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(
      `New Activity, Task ID ${ticketId} assigned to you`
    );
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }
};

// ─── Toast Component ───────────────────────────────────────────────────
const Toast = ({ notifications, onDismiss, onNavigate }) => {
  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '360px',
    }}>
      {notifications.map((notif) => (
        <div
          key={notif.id}
          onClick={() => onNavigate(notif.ticketId, notif.id)}
          style={{
            background: 'rgba(22, 27, 34, 0.97)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(88,166,255,0.4)',
            borderLeft: '4px solid #58a6ff',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(88,166,255,0.1)',
            animation: 'slideInRight 0.35s ease-out',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-4px)';
            e.currentTarget.style.borderLeftColor = '#79c0ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.borderLeftColor = '#58a6ff';
          }}
        >
          <div style={{
            fontSize: '1.5rem',
            flexShrink: 0,
            animation: 'bellRing 0.6s ease-out',
          }}>🔔</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: 700,
              color: '#58a6ff',
              fontSize: '0.85rem',
              marginBottom: '0.25rem',
              letterSpacing: '0.02em',
            }}>
              New Ticket Assigned to You
            </div>
            <div style={{
              color: '#e6edf3',
              fontSize: '0.9rem',
              fontWeight: 500,
              marginBottom: '0.15rem',
            }}>
              #{notif.ticketId} — {notif.title}
            </div>
            <div style={{
              color: '#8b949e',
              fontSize: '0.78rem',
            }}>
              Priority: <span style={{ color: getPriorityColor(notif.priority) }}>{notif.priority}</span>
              {' · '}Category: {notif.category}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notif.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0',
              flexShrink: 0,
              transition: 'color 0.2s',
            }}
            title="Dismiss"
          >✕</button>
        </div>
      ))}
    </div>
  );
};

// ─── Bell Icon (used in Navbar) ─────────────────────────────────────────
export const NotificationBell = ({ count, onClick }) => (
  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onClick} title="Notifications">
    <svg
      width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={count > 0 ? '#58a6ff' : '#8b949e'}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: count > 0 ? 'bellRing 1s ease-out' : 'none', display: 'block' }}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {count > 0 && (
      <span style={{
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        background: 'linear-gradient(135deg, #ff6b6b, #ff4444)',
        color: '#fff',
        borderRadius: '10px',
        padding: '1px 5px',
        fontSize: '0.65rem',
        fontWeight: 700,
        minWidth: '16px',
        textAlign: 'center',
        border: '1.5px solid #0d1117',
        lineHeight: '1.4',
      }}>
        {count > 9 ? '9+' : count}
      </span>
    )}
  </div>
);

// ─── Helpers ────────────────────────────────────────────────────────────
function getPriorityColor(priority) {
  const map = { Urgent: '#ff6b6b', High: '#ff8b3e', Medium: '#f778ba', Low: '#56d364' };
  return map[priority] || '#8b949e';
}

// ─── Notification Dropdown Panel ────────────────────────────────────────
const NotificationPanel = ({ notifications, onDismiss, onClearAll, onClose, onNavigate }) => (
  <div style={{
    position: 'absolute',
    top: 'calc(100% + 12px)',
    right: 0,
    width: '340px',
    background: 'rgba(22, 27, 34, 0.98)',
    backdropFilter: 'blur(16px)',
    border: '1px solid #30363d',
    borderRadius: '12px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    zIndex: 9000,
    overflow: 'hidden',
    animation: 'slideDown 0.2s ease-out',
  }}>
    <div style={{
      padding: '0.9rem 1rem',
      borderBottom: '1px solid #30363d',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{ fontWeight: 700, color: '#e6edf3', fontSize: '0.95rem' }}>
        🔔 Notifications
      </span>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {notifications.length > 0 && (
          <button onClick={onClearAll} style={{
            background: 'none', border: 'none', color: '#8b949e',
            cursor: 'pointer', fontSize: '0.75rem',
          }}>Clear all</button>
        )}
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#8b949e',
          cursor: 'pointer', fontSize: '1rem',
        }}>✕</button>
      </div>
    </div>

    <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
      {notifications.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#8b949e', fontSize: '0.85rem' }}>
          No new notifications
        </div>
      ) : (
        notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => onNavigate(notif.ticketId, notif.id)}
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: '8px',
              marginBottom: '0.35rem',
              background: 'rgba(88,166,255,0.06)',
              border: '1px solid rgba(88,166,255,0.12)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(88,166,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(88,166,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(88,166,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(88,166,255,0.12)';
            }}
          >
            <div style={{ fontSize: '1.1rem', flexShrink: 0 }}>📋</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e6edf3', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                #{notif.ticketId} — {notif.title}
              </div>
              <div style={{ color: '#8b949e', fontSize: '0.75rem' }}>
                <span style={{ color: getPriorityColor(notif.priority) }}>{notif.priority}</span>
                {' · '}{notif.category}
                {' · '}{notif.timeAgo}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notif.id);
              }}
              style={{
                background: 'none', border: 'none', color: '#6e7681',
                cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0,
              }}
            >✕</button>
          </div>
        ))
      )}
    </div>
  </div>
);

// ─── Main NotificationSystem ─────────────────────────────────────────────
const NotificationSystem = ({ currentUser, onBellRender }) => {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [allNotifs, setAllNotifs] = useState([]);
  const seenTicketIdsRef = useRef(new Set());
  const isFirstPollRef = useRef(true);

  const pollTickets = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await ticketAPI.getAllTickets();
      const tickets = res.data;

      const myTickets = tickets.filter(
        (t) => String(t.userTo) === String(currentUser.id)
      );

      if (isFirstPollRef.current) {
        myTickets.forEach((t) => seenTicketIdsRef.current.add(t.id));
        isFirstPollRef.current = false;
        return;
      }

      const newTickets = myTickets.filter((t) => !seenTicketIdsRef.current.has(t.id));

      if (newTickets.length > 0) {
        newTickets.forEach((t) => seenTicketIdsRef.current.add(t.id));

        const newNotifs = newTickets.map((t) => ({
          id: `notif-${t.id}-${Date.now()}`,
          ticketId: t.id,
          title: t.title,
          priority: t.priority,
          category: t.category,
          timeAgo: 'just now',
        }));

        // Voice announcement for each new ticket
        newTickets.forEach((t) => speakNotification(t.id));

        setToasts((prev) => [...prev, ...newNotifs]);
        newNotifs.forEach((n) => {
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== n.id));
          }, 7000);
        });

        setAllNotifs((prev) => [...newNotifs, ...prev]);

        if ('Notification' in window && Notification.permission === 'granted') {
          newTickets.forEach((t) => {
            new Notification('🎫 New Ticket Assigned', {
              body: `#${t.id} — ${t.title}\nPriority: ${t.priority}`,
              icon: '/favicon.ico',
            });
          });
        }
      }
    } catch (err) {
      console.warn('Notification poll error:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    pollTickets();
    const interval = setInterval(pollTickets, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser, pollTickets]);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
  
  const dismissNotif = (id) => setAllNotifs((prev) => prev.filter((n) => n.id !== id));
  
  const clearAll = () => setAllNotifs([]);

  // Navigate to ShowDetails and clear the specific notification
  const handleNavigate = useCallback((ticketId, notifId) => {
    // Remove from toasts
    setToasts((prev) => prev.filter((t) => t.id !== notifId));
    // Remove from panel
    setAllNotifs((prev) => prev.filter((n) => n.id !== notifId));
    // Navigate
    navigate(`/tickets/${ticketId}`);
  }, [navigate]);

  useEffect(() => {
    if (onBellRender) {
      onBellRender({ 
        count: allNotifs.length, 
        notifications: allNotifs, 
        dismissNotif, 
        clearAll,
        handleNavigate 
      });
    }
  }, [allNotifs]); // eslint-disable-line

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes bellRing {
          0%,100% { transform: rotate(0deg); }
          15%      { transform: rotate(15deg); }
          30%      { transform: rotate(-12deg); }
          45%      { transform: rotate(10deg); }
          60%      { transform: rotate(-8deg); }
          75%      { transform: rotate(5deg); }
        }
        @keyframes micPulse {
          0%,100% { box-shadow: 0 0 8px rgba(255,107,107,0.5); }
          50%      { box-shadow: 0 0 20px rgba(255,107,107,0.9); }
        }
        @keyframes slideDown {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <Toast notifications={toasts} onDismiss={dismissToast} onNavigate={handleNavigate} />
    </>
  );
};

export { NotificationPanel };
export default NotificationSystem;
