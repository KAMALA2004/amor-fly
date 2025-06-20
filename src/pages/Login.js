import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Fetch user's pod ID
      const userDoc = await getDoc(doc(db, 'users', uid));
      const podId = userDoc.exists() ? userDoc.data().podId : null;

      if (podId) {
        navigate(`/pod/${podId}`);
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      alert('Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to your pod</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <span onClick={() => navigate('/')}>Sign up</span>
            </p>
            <p className="forgot-password" onClick={() => navigate('/forgot-password')}>
              Forgot password?
            </p>
          </div>
        </form>
      </div>
      
      <div className="login-decoration">
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
      </div>
    </div>
  );
};

export default Login;