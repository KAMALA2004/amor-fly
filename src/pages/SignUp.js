import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { setDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../styles/SignUp.css';
const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Save user info to Firestore
      await setDoc(doc(db, 'users', uid), {
        email,
        joinedAt: new Date()
      });

      alert('Signup successful!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="signup-container">
    <h2>Sign Up</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleSignup}>Sign Up</button>
      <p>Already have an account? <Link to="/login">Login here</Link></p>

    </div>
  );
};

export default SignUp;
