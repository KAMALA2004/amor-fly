import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // ✅ Fetch user's pod ID
      const userDoc = await getDoc(doc(db, 'users', uid));
      const podId = userDoc.exists() ? userDoc.data().podId : null;

      if (podId) {
        alert('Login successful!');
        navigate(`/pod/${podId}`); // 🔁 Go directly to their pod
      } else {
        alert('No pod assigned. Please complete onboarding.');
        navigate('/onboarding'); // fallback
      }
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
      />
      <button onClick={handleLogin}>Login</button>
      <p className="switch-link" onClick={() => navigate('/')}>
        New user? Sign up
      </p>
    </div>
  );
};

export default Login;
