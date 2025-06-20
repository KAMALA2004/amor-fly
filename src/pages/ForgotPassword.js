// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="form-container">
        <h2>Reset Your Password</h2>
        <p>Enter your email and we’ll send you a link to reset your password.</p>
        
        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Send Reset Email</button>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <p className="back-to-login" onClick={() => navigate('/login')}>
          ← Back to Login
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
