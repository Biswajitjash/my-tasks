import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { feedbackAPI, ticketAPI } from '../utils/api';
import VoiceInputButton from './VoiceInputButton';

const Feedbacks = ({ currentUser }) => {
  const [tickets, setTickets] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [formData, setFormData] = useState({ ticketId: '', rating: 0, comment: '' });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ticketsRes, feedbacksRes] = await Promise.all([
        ticketAPI.getUserTickets(currentUser.id),
        feedbackAPI.getUserFeedbacks(currentUser.id)
      ]);
      setTickets(ticketsRes.data.filter(t => t.status === 'Resolved' || t.status === 'Closed'));
      setFeedbacks(feedbacksRes.data);
    } catch (err) { setError('Failed to load data'); }
  }, [currentUser.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleVoiceTranscript = useMemo(() => (transcript, mode) => {
    setFormData((prev) => ({
      ...prev,
      comment: mode === 'replace' ? transcript : prev.comment
        ? prev.comment + ' ' + transcript
        : transcript,
    }));
  }, []);

  const handleRatingClick = (rating) => setFormData({ ...formData, rating });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (formData.rating === 0) { setError('Please select a rating'); setLoading(false); return; }
    try {
      await feedbackAPI.create({
        userId: currentUser.id,
        ticketId: formData.ticketId || null,
        rating: formData.rating,
        comment: formData.comment
      });
      setSuccess('Feedback submitted successfully!');
      setFormData({ ticketId: '', rating: 0, comment: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit feedback.');
    } finally { setLoading(false); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Feedback</h1>
        <p className="page-subtitle">Share your experience with us</p>
      </div>

      <div className="action-bar">
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Your Feedbacks</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Feedback'}
        </button>
      </div>

      {showForm && (
        <div className="auth-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Submit Feedback</h3>
          {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}
          {success && <div className="alert alert-success"><span>✓</span><span>{success}</span></div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Related Ticket (Optional)</label>
              <select name="ticketId" className="form-select" value={formData.ticketId} onChange={handleChange}>
                <option value="">General Feedback</option>
                {tickets.map(ticket => (
                  <option key={ticket.id} value={ticket.id}>#{ticket.id} - {ticket.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Rating</label>
              <div className="rating-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= (hoveredRating || formData.rating) ? 'filled' : ''}`}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >★</span>
                ))}
                <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
                  {formData.rating > 0 ? `${formData.rating} / 5` : 'Select rating'}
                </span>
              </div>
            </div>

            {/* Comment with voice */}
            <div className="form-group">
              <label className="form-label">Comment</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <textarea
                  name="comment"
                  className="form-textarea"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="Tell us about your experience... 🎤"
                  style={{ flex: 1 }}
                />
                <VoiceInputButton
                  fieldName="comment"
                  onTranscript={handleVoiceTranscript}
                  mode="append"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Submit Feedback'}
            </button>
          </form>
        </div>
      )}

      <div className="grid">
        {feedbacks.length === 0 ? (
          <div className="card text-center">
            <p style={{ color: 'var(--text-secondary)' }}>No feedbacks yet. Share your first feedback!</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="card">
              <div className="card-header">
                <div>
                  <div className="rating-container" style={{ marginBottom: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`star ${star <= feedback.rating ? 'filled' : ''}`} style={{ cursor: 'default', fontSize: '1.2rem' }}>★</span>
                    ))}
                  </div>
                  <div className="card-meta">{formatDate(feedback.createdAt)}</div>
                </div>
              </div>
              {feedback.ticketId && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <span className="badge badge-priority-low">Ticket #{feedback.ticketId}</span>
                </div>
              )}
              {feedback.comment && <div className="card-content">{feedback.comment}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feedbacks;
