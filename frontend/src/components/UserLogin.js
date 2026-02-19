import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';

const UserLogin = ({ setCurrentUser }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await userAPI.login(formData);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setCurrentUser(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to manage your tickets</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            style={{ color: 'var(--electric-blue)', cursor: 'pointer', fontWeight: 600 }}
          >
            Create Account
          </span>
        </p>

        <div className="text-center mt-20" >
          <span
            onClick={() => navigate('/change-password')}
            style={{
              cursor: 'pointer',
              fontSize: '1.0rem',
              fontWeight: 500
            }}
          >
            Update Password ?
          </span>
        </div>

      </div>
    </div>
  );
};

export default UserLogin;
