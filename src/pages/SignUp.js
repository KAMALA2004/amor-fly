import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { setDoc, doc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/SignUp.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, 'users', uid), {
        email,
        joinedAt: new Date(),
        anonName: '',
      });

      navigate('/onboarding');
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h2>Create Your Account</h2>
          <p>Join our community and start your journey</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
              <span 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="0"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="password-strength">
              <div className={`strength-bar ${password.length > 0 ? 'active' : ''} ${password.length >= 6 ? 'strong' : ''}`}></div>
              <span>{password.length >= 6 ? 'Strong password' : password.length > 0 ? 'Weak password' : ''}</span>
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-with-icon">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span 
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="0"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="button-loader"></span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')}>Log in</span>
          </p>
        </div>
      </div>
      
      <div className="signup-decoration">
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
      </div>
    </div>
  );
};

export default SignUp;