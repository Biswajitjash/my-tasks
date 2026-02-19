import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../utils/api';
import VoiceInputButton from './VoiceInputButton';

const TicketRaised = ({ currentUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    userTo: '',
    feedback: '1'
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await ticketAPI.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Memoized voice handler - won't recreate on every render
  const handleVoiceTranscript = useMemo(() => (fieldName) => (transcript, mode) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: mode === 'replace' ? transcript : prev[fieldName]
        ? prev[fieldName] + ' ' + transcript
        : transcript,
    }));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
      if (file.size > 5 * 1024 * 1024) { setError('Image size should be less than 5MB'); return; }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = new FormData();
      data.append('userId', currentUser.id);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('priority', formData.priority);
      data.append('userTo', formData.userTo);
      data.append('feedback', formData.userTo);

      if (image) data.append('image', image);
      await ticketAPI.create(data);
      setSuccess('Ticket created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Raise New Ticket</h1>
        <p className="page-subtitle">Submit your issue or request · 🎤 Voice input supported</p>
      </div>

      <div className="auth-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}
        {success && <div className="alert alert-success"><span>✓</span><span>{success}</span></div>}

        <form onSubmit={handleSubmit}>
          {/* Title Field */}
          <div className="form-group">
            <label className="form-label">Title</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Brief description of the issue"
                style={{ flex: 1 }}
              />
              <VoiceInputButton
                fieldName="title"
                onTranscript={handleVoiceTranscript('title')}
                mode="replace"
              />
            </div>
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <textarea
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Provide detailed information about the issue..."
                style={{ flex: 1 }}
              />
              <VoiceInputButton
                fieldName="description"
                onTranscript={handleVoiceTranscript('description')}
                mode="append"
              />
            </div>
          </div>

          {/* Grid: Category, Priority, Assigned To */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                <option value="General">General</option>
                <option value="Tour">Tour</option>
                <option value="Technical Change Require">Technical</option>
                <option value="New Development Request">Feature Request</option>
                <option value="Functional Change Request">Change Request</option>
                <option value="Meeting Schedule">Meeting Schedule</option>
                <option value="Bug Report">Bug Report</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select name="priority" className="form-select" value={formData.priority} onChange={handleChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assigned To</label>
              <select name="userTo" className="form-select" value={formData.userTo} onChange={handleChange}>
                <option value="">Select Assignee</option>
                {users.filter(user => user.id !== currentUser.id).map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">Attach Image (Optional)</label>
            <div className="file-upload-container">
              <label className="file-upload-label">
                <input type="file" className="file-upload-input" accept="image/*" onChange={handleImageChange} />
                <span style={{ fontSize: '1.5rem' }}>📎</span>
                <span className="file-upload-text">{image ? image.name : 'Click to upload image (Max 5MB)'}</span>
              </label>
              {imagePreview && (
                <div className="file-preview">
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: '1', minWidth: '120px' }}>
              {loading ? <span className="spinner"></span> : 'Submit Ticket'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ flex: '1', minWidth: '120px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketRaised;
