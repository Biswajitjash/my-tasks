import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ticketAPI } from '../utils/api';

const ShowDetails = ({ currentUser, onDelete }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalImage, setModalImage] = useState(null);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState('');
  const [attachSuccess, setAttachSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  const fetchTicketDetail = async () => {
    try {
      const response = await ticketAPI.getTicket(id);
      setTicket(response.data);
    } catch (err) {
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Normalize: supports both old `image` string and new `images` array
  const getImages = (ticket) => {
    if (!ticket) return [];
    if (Array.isArray(ticket.images) && ticket.images.length > 0) return ticket.images;
    if (ticket.image) return [ticket.image];
    return [];
  };

  const buildImageUrl = (path) => {
    const base = process.env.REACT_APP_BACKEND_PORT
      ? `${process.env.REACT_APP_BACKEND_URL}:${process.env.REACT_APP_BACKEND_PORT}`
      : process.env.REACT_APP_BACKEND_URL;
    return `${base}${path}`;
  };



  // ✅ Attach more images handler
  const handleAttachMore = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setAttachError('Only image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAttachError('Each image must be under 5MB');
        return;
      }
    }

    setAttachLoading(true);
    setAttachError('');
    setAttachSuccess('');

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      // ✅ Using ticketAPI.addImages instead of raw fetch
      await ticketAPI.addImages(id, formData);

      setAttachSuccess(`${files.length} image(s) attached successfully!`);
      await fetchTicketDetail(); // ✅ Refresh to show new images

      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setAttachSuccess(''), 3000);

    } catch (err) {
      // ✅ Axios error format
      setAttachError(err.response?.data?.error || err.message || 'Failed to attach images');
    } finally {
      setAttachLoading(false);
    }
  };

  const handleDelete = async () => {
    if (ticket.userId !== currentUser.id) {
      alert('You can only delete your own tickets.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await ticketAPI.delete(ticket.id);
        if (onDelete) onDelete(ticket.id);
        navigate('/dashboard');
      } catch (err) {
        alert('Failed to delete ticket');
      }
    }
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'Open': { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6' },
      'In Progress': { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24' },
      'Resolved': { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e' },
      'Closed': { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', text: '#6b7280' }
    };
    return colorMap[status] || { bg: 'transparent', border: 'rgba(255,255,255,0.1)', text: '#fff' };
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Open': 'status-open',
      'In Progress': 'status-in-progress',
      'Resolved': 'status-resolved',
      'Closed': 'status-closed'
    };
    return statusMap[status] || 'status-open';
  };

  const getPriorityBadgeClass = (priority) => {
    const priorityMap = {
      'Low': 'priority-low',
      'Medium': 'priority-medium',
      'High': 'priority-high',
      'Urgent': 'priority-high'
    };
    return priorityMap[priority] || 'priority-medium';
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    }) + ', ' + new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });

  // Button visibility logic
  const canUpdate =
    (ticket?.userId === currentUser.id && ticket?.status === 'Open') ||
    (ticket?.userId !== currentUser.id && ticket?.status !== 'Resolved');

  const canDelete =
    ticket?.userId === currentUser.id && ticket?.status === 'Open';

  // ✅ Only ticket owner with Open status can attach more images
  const canAttach =
    ticket?.userId === currentUser.id && ticket?.status === 'Open';

  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center">
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error || 'Ticket not found'}</span>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const statusColors = getStatusColor(ticket.status);
  const images = getImages(ticket); // ✅ Always an array


  return (
    <div className="page-container">

      {/* Back Button */}
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/dashboard')}
        style={{ marginBottom: '1.5rem' }}
      >
        ← Back
      </button>

      {/* Main Detail Card */}
      <div
        className="card"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: statusColors.bg,
          border: `1px solid ${statusColors.border}`,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Card Header */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 className="card-title" style={{ fontSize: '1.4rem' }}>{ticket.title}</h2>
            <p className="card-meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              #{ticket.id} • {formatDate(ticket.createdAt)}
            </p>
          </div>
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
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: `1px solid ${statusColors.border}`, margin: '1rem 0' }} />

        {/* Detail Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>STATUS</p>
            <p style={{ color: statusColors.text, fontWeight: '600' }}>{ticket.status}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>PRIORITY</p>
            <p style={{ fontWeight: '600' }}>{ticket.priority}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>CATEGORY</p>
            <p style={{ fontWeight: '600' }}>{ticket.category}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>LAST UPDATED</p>
            <p style={{ fontWeight: '600' }}>{formatDate(ticket.updatedAt)}</p>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>DESCRIPTION</p>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${statusColors.border}`,
            borderRadius: '8px',
            padding: '1rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
          }}>
            {ticket.description}
          </div>
        </div>

        {/* ✅ Attachments Gallery */}
        {images.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              ATTACHMENTS ({images.length})
            </p>

            {/* ✅ Responsive grid - 2 cols mobile, 3+ desktop */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '0.75rem'
            }}>
              {images.map((imgPath, index) => (
                <div
                  key={index}
                  onClick={() => setModalImage(imgPath)}
                  style={{
                    position: 'relative',
                    paddingBottom: '75%', // 4:3 ratio box
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: `1px solid ${statusColors.border}`,
                    cursor: 'zoom-in'
                  }}
                >
                  <img
                    src={buildImageUrl(imgPath)}
                    alt={`Attachment ${index + 1}`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top',
                      display: 'block'
                    }}
                  />
                  {/* Counter badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '6px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    padding: '2px 5px',
                    borderRadius: '4px'
                  }}>
                    {index + 1}/{images.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* ✅ Attach More - only ticket owner, only Open status */}
        {canAttach && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.02)',
            border: `1px dashed ${statusColors.border}`,
            borderRadius: '8px'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              📎 ATTACH MORE IMAGES
            </p>

            {attachError && (
              <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>
                <span>⚠️</span><span>{attachError}</span>
              </div>
            )}
            {attachSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '0.75rem' }}>
                <span>✓</span><span>{attachSuccess}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAttachMore}
                disabled={attachLoading}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={attachLoading}
                onClick={() => fileInputRef.current?.click()}
                style={{ minWidth: '140px' }}
              >
                {attachLoading
                  ? <span className="spinner"></span>
                  : '+ Attach Images'
                }
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Select up to 5 images • Max 5MB each
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          paddingTop: '1rem',
          borderTop: `1px solid ${statusColors.border}`
        }}>
          {canUpdate && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/tickets/edit/${ticket.id}`)}
              style={{ flex: '1', minWidth: '130px' }}
            >
              Update
            </button>
          )} 

          {canDelete && (
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              style={{ flex: '1', minWidth: '130px' }}
            >
              Delete
            </button>
          )}


        </div>

        <button
          className="btn btn-primary"
       onClick={() => navigate(`/tickets/edit/${ticket.id}`)}
        >
          Feed Back
        </button>

      </div>

      {/* ✅ Full Image Modal with Prev/Next navigation */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            cursor: 'zoom-out'
          }}
        >
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setModalImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>

            {/* ✅ Prev/Next arrows - only when multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const idx = images.indexOf(modalImage);
                    setModalImage(images[(idx - 1 + images.length) % images.length]);
                  }}
                  style={{
                    position: 'absolute',
                    left: '-52px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.8rem',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={() => {
                    const idx = images.indexOf(modalImage);
                    setModalImage(images[(idx + 1) % images.length]);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-52px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.8rem',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ›
                </button>
              </>
            )}

            <img
              src={buildImageUrl(modalImage)}
              alt="Full view"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block'
              }}
            />

            {/* Counter */}
            {images.length > 1 && (
              <p style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                marginTop: '0.5rem'
              }}>
                {images.indexOf(modalImage) + 1} / {images.length}
              </p>
            )}
          </div>
        </div>
      )}


    </div>
  );
};

export default ShowDetails;

