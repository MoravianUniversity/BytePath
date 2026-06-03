import { useEffect, useState } from 'react';
import { authService, User } from '../services/auth';
import { API_BASE } from '../services/api';
import './LoginScreen.css';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    authService.getProfile()
      .then((user) => {
        if (!isMounted) return;
        authService.saveUser(user);
        onLogin(user);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [onLogin]);

  const handleGoogleLogin = () => {
    setError('');
    window.location.assign(`${API_BASE}/auth/google`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.login(email);
      authService.saveUser(user);
      onLogin(user);
    } catch (err) {
      setError('Failed to login. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <h1>🎓 BytePath</h1>
        <p className="login-subtitle">Python Learning Platform</p>

        <form onSubmit={handleSubmit} className="login-form">
          {isLocalhost && (
            <>
              <input
                type="email"
                placeholder="Enter your school email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="login-input"
              />

              <button
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </>
          )}
          <button
            type="button"
            disabled={loading}
            className="login-button google-login-button"
            onClick={handleGoogleLogin}
          >
            {loading ? 'Checking session...' : 'Sign in with Google'}
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>

        <p className="login-note">
          New users will be automatically registered
        </p>
      </div>
    </div>
  );
}
