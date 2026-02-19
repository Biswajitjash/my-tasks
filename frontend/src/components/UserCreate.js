import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';
import VoiceInputButton from './VoiceInputButton';

const UserCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', fullName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleVoice = useMemo(() => (fieldName) => (transcript, mode) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: mode === 'replace' ? transcript : (prev[fieldName] + ' ' + transcript).trim(),
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters long'); setLoading(false); return; }
    try {
      const { confirmPassword, ...dataToSend } = formData;
      await userAPI.register(dataToSend);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join us to manage your tickets efficiently · 🎤 Voice input supported</p>

        {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}
        {success && <div className="alert alert-success"><span>✓</span><span>{success}</span></div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                name="fullName"
                className="form-input"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                style={{ flex: 1 }}
              />
              <VoiceInputButton
                fieldName="fullName"
                onTranscript={handleVoice('fullName')}
                mode="replace"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="johndoe"
                style={{ flex: 1 }}
              />
              <VoiceInputButton
                fieldName="username"
                onTranscript={handleVoice('username')}
                mode="replace"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
                style={{ flex: 1 }}
              />
              <VoiceInputButton
                fieldName="email"
                onTranscript={handleVoice('email')}
                mode="replace"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" name="confirmPassword" className="form-input" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} style={{ color: 'var(--electric-blue)', cursor: 'pointer', fontWeight: 600 }}>
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
};

export default UserCreate;
