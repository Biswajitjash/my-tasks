import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../utils/api';

const Dashboard = ({ currentUser }) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open');
  const [showStats, setShowStats] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowStats(true);
      const timer = setTimeout(() => setShowStats(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowStats(true);
    }
  }, [isMobile]);

  const fetchTickets = useCallback(async () => {
    try {
      const response = await ticketAPI.getUserTickets(currentUser.id);
      setTickets(response.data);
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCardClick = (ticketId) => navigate(`/tickets/${ticketId}`);

  // ✅ Normalize: supports both old `image` string and new `images` array
  const getImages = (ticket) => {
    if (Array.isArray(ticket.images) && ticket.images.length > 0) return ticket.images;
    if (ticket.image) return [ticket.image];
    return [];
  };

  const getCardStatusColor = (status) => ({
    'Open': 'rgba(137, 247, 127, 0.1)',
    'In Progress': 'rgba(243, 193, 67, 0.1)',
    'Resolved': 'rgba(216, 105, 238, 0.1)',
    'Closed': 'rgba(243, 94, 131, 0.1)'
  }[status] || 'transparent');

  const getCardBorderColor = (status) => ({
    'Open': 'rgba(69, 236, 18, 0.3)',
    'In Progress': 'rgba(241, 175, 7, 0.3)',
    'Resolved': 'rgba(233, 35, 216, 0.3)',
    'Closed': 'rgba(107, 114, 128, 0.3)'
  }[status] || 'rgba(255, 255, 255, 0.1)');

  const getStatusBadgeClass = (status) => ({
    'Open': 'status-open',
    'In Progress': 'status-in-progress',
    'Resolved': 'status-resolved',
    'Closed': 'status-closed'
  }[status] || 'badge-status-open');

  const getPriorityBadgeClass = (priority) => ({
    'Low': 'priority-low',
    'Medium': 'priority-medium',
    'High': 'priority-high',
    'Unknown': 'priority-unknown'
  }[priority] || 'priority-medium');

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    }) + ', ' + new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
  };

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status.toLowerCase().replace(' ', '-') === filter);

  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center">
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      {showStats && (
        <div className="stats-grid" style={{ transition: 'opacity 0.5s ease-out', opacity: 1 }}>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tickets</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.open}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">Workings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="action-bar">
        <div className="flex gap-0">
          {['all', 'open', 'in-progress', 'resolved'].map((f) => (
            <button
              key={f}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'in-progress' ? 'Working ' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Cards */}
      <div className="grid">
        {filteredTickets.length === 0 ? (
          <div className="card text-center">
            <p style={{ color: 'var(--text-secondary)' }}>
              {filter === 'all'
                ? 'No tickets yet. Create your first ticket!'
                : `No ${filter} tickets found.`}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const images = getImages(ticket); // ✅ Normalized array

            return (
              <div
                key={ticket.id}
                className="card"
                onClick={() => handleCardClick(ticket.id)}
                style={{
                  background: getCardStatusColor(ticket.status),
                  border: `1px solid ${getCardBorderColor(ticket.status)}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Card Header */}
                <div className="card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="card-title">{ticket.title}</h3>
                    <p className="card-meta" style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      #{ticket.id} • {formatDate(ticket.createdAt)} • {ticket.userId} to {ticket.userTo}
                    </p>
                  </div>

                  {/* All Badges */}
                  <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className="badge" style={{
                      background: 'rgba(88, 166, 255, 0.1)',
                      color: 'var(--cyan)',
                      border: '1px solid rgba(88, 166, 255, 0.2)'
                    }}>
                      {ticket.category}
                    </span>

                    <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>

                    <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                      {ticket.status}
                    </span>

                    {/* ✅ Attachment badge - purple, shows count */}
                    {images.length > 0 && (
                      <span className="badge" style={{
                        background: 'rgba(168, 85, 247, 0.1)',
                        color: '#a855f7',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        📎 {images.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="card-content">
                  {ticket.description}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// export default Dashboard;
// import { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ticketAPI } from '../utils/api';

// const Dashboard = ({ currentUser }) => {
//   const navigate = useNavigate();
//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [filter, setFilter] = useState('open');
//   const [showStats, setShowStats] = useState(true);
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth <= 768);
//     checkMobile();
//     window.addEventListener('resize', checkMobile);
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   useEffect(() => {
//     if (isMobile) {
//       setShowStats(true);
//       const timer = setTimeout(() => setShowStats(false), 5000);
//       return () => clearTimeout(timer);
//     } else {
//       setShowStats(true);
//     }
//   }, [isMobile]);

//   const fetchTickets = useCallback(async () => {
//     try {
//       const response = await ticketAPI.getUserTickets(currentUser.id);
//       setTickets(response.data);
//     } catch (err) {
//       setError('Failed to load tickets');
//     } finally {
//       setLoading(false);
//     }
//   }, [currentUser.id]);

//   useEffect(() => {
//     fetchTickets();
//   }, [fetchTickets]);

//   const handleCardClick = (ticketId) => navigate(`/tickets/${ticketId}`);

//   // ✅ Normalize: supports both old `image` string and new `images` array
//   const getImages = (ticket) => {
//     if (Array.isArray(ticket.images) && ticket.images.length > 0) return ticket.images;
//     if (ticket.image) return [ticket.image];
//     return [];
//   };

//   const getCardStatusColor = (status) => ({
//     'Open': 'rgba(137, 247, 127, 0.1)',
//     'In Progress': 'rgba(243, 193, 67, 0.1)',
//     'Resolved': 'rgba(216, 105, 238, 0.1)',
//     'Closed': 'rgba(243, 94, 131, 0.1)'
//   }[status] || 'transparent');

//   const getCardBorderColor = (status) => ({
//     'Open': 'rgba(69, 236, 18, 0.3)',
//     'In Progress': 'rgba(241, 175, 7, 0.3)',
//     'Resolved': 'rgba(233, 35, 216, 0.3)',
//     'Closed': 'rgba(107, 114, 128, 0.3)'
//   }[status] || 'rgba(255, 255, 255, 0.1)');

//   const getStatusBadgeClass = (status) => ({
//     'Open': 'status-open',
//     'In Progress': 'status-in-progress',
//     'Resolved': 'status-resolved',
//     'Closed': 'status-closed'
//   }[status] || 'badge-status-open');

//   const getPriorityBadgeClass = (priority) => ({
//     'Low': 'priority-low',
//     'Medium': 'priority-medium',
//     'High': 'priority-high',
//     'Unknown': 'priority-unknown'
//   }[priority] || 'priority-medium');

//   const formatDate = (dateString) =>
//     new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric', month: 'short', day: 'numeric'
//     }) + ', ' + new Date(dateString).toLocaleTimeString('en-US', {
//       hour: '2-digit', minute: '2-digit'
//     });

//   const stats = {
//     total: tickets.length,
//     open: tickets.filter(t => t.status === 'Open').length,
//     inProgress: tickets.filter(t => t.status === 'In Progress').length,
//     resolved: tickets.filter(t => t.status === 'Resolved').length,
//   };

//   const filteredTickets = filter === 'all'
//     ? tickets
//     : tickets.filter(t => t.status.toLowerCase().replace(' ', '-') === filter);

//   if (loading) {
//     return (
//       <div className="page-container">
//         <div className="text-center">
//           <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="page-container">
//       {error && (
//         <div className="alert alert-error">
//           <span>⚠️</span>
//           <span>{error}</span>
//         </div>
//       )}

//       {/* Stats Grid */}
//       {showStats && (
//         <div className="stats-grid" style={{ transition: 'opacity 0.5s ease-out', opacity: 1 }}>
//           <div className="stat-card">
//             <div className="stat-value">{stats.total}</div>
//             <div className="stat-label">Total Tickets</div>
//           </div>
//           <div className="stat-card">
//             <div className="stat-value">{stats.open}</div>
//             <div className="stat-label">Open</div>
//           </div>
//           <div className="stat-card">
//             <div className="stat-value">{stats.inProgress}</div>
//             <div className="stat-label">Workings</div>
//           </div>
//           <div className="stat-card">
//             <div className="stat-value">{stats.resolved}</div>
//             <div className="stat-label">Resolved</div>
//           </div>
//         </div>
//       )}

//       {/* Filter Bar */}
//       <div className="action-bar">
//         <div className="flex gap-0">
//           {['all', 'open', 'in-progress', 'resolved'].map((f) => (
//             <button
//               key={f}
//               className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
//               onClick={() => setFilter(f)}
//             >
//               {f === 'all' ? 'All' : f === 'in-progress' ? 'Working ' : f.charAt(0).toUpperCase() + f.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Ticket Cards */}
//       <div className="grid">
//         {filteredTickets.length === 0 ? (
//           <div className="card text-center">
//             <p style={{ color: 'var(--text-secondary)' }}>
//               {filter === 'all'
//                 ? 'No tickets yet. Create your first ticket!'
//                 : `No ${filter} tickets found.`}
//             </p>
//           </div>
//         ) : (
//           filteredTickets.map((ticket) => {
//             const images = getImages(ticket); // ✅ Normalized array

//             return (
//               <div
//                 key={ticket.id}
//                 className="card"
//                 onClick={() => handleCardClick(ticket.id)}
//                 style={{
//                   background: getCardStatusColor(ticket.status),
//                   border: `1px solid ${getCardBorderColor(ticket.status)}`,
//                   transition: 'all 0.3s ease',
//                   cursor: 'pointer',
//                 }}
//                 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
//                 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
//               >
//                 {/* Card Header */}
//                 <div className="card-header">
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     <h3 className="card-title">{ticket.title}</h3>
//                     <p className="card-meta" style={{
//                       whiteSpace: 'nowrap',
//                       overflow: 'hidden',
//                       textOverflow: 'ellipsis'
//                     }}>
//                       #{ticket.id} • {formatDate(ticket.createdAt)} • {ticket.userId} to {ticket.userTo}
//                     </p>
//                   </div>

//                   {/* All Badges */}
//                   <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
//                     <span className="badge" style={{
//                       background: 'rgba(88, 166, 255, 0.1)',
//                       color: 'var(--cyan)',
//                       border: '1px solid rgba(88, 166, 255, 0.2)'
//                     }}>
//                       {ticket.category}
//                     </span>

//                     <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`}>
//                       {ticket.priority}
//                     </span>

//                     <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
//                       {ticket.status}
//                     </span>

//                     {/* ✅ Attachment badge - purple, shows count */}
//                     {images.length > 0 && (
//                       <span className="badge" style={{
//                         background: 'rgba(168, 85, 247, 0.1)',
//                         color: '#a855f7',
//                         border: '1px solid rgba(168, 85, 247, 0.3)',
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: '3px'
//                       }}>
//                         📎 {images.length}
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 {/* Description */}
//                 <div className="card-content">
//                   {ticket.description}
//                 </div>

//               </div>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;