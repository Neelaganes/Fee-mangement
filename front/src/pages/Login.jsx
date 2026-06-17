import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';
import { Lock, User, AlertCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiLogin(username, password);
      login({ token: res.data.token, role: res.data.role, name: res.data.name });
      
      if (res.data.role === 'admin') navigate('/admin/students');
      else if (res.data.role === 'teacher') navigate('/teacher');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container animate-scaleIn">
        <div className="login-header">
          <div className="login-icon">
            <Lock size={24} />
          </div>
          <h2>Staff Portal</h2>
          <p>Secure access for authorized personnel only</p>
        </div>

        {error && (
          <div className="login-error animate-fadeIn">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / teacher"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123 / teacher123"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <div className="spinner-small" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
