// src/pages/PodPage.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const PodPage = () => {
  const { podId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [anonName, setAnonName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const podRef = doc(db, 'pods', podId);
          const podSnap = await getDoc(podRef);

          if (podSnap.exists()) {
            const data = podSnap.data();
            setMembers(data.members || []);
          }

          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setAnonName(userData.anonName || 'LearnerFox21');
          }
        } catch (err) {
          console.error('Error fetching pod/user data:', err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [podId]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome to Your Pod</h2>
      <p><strong>Pod ID:</strong> {podId}</p>
      <p><strong>Your Anonymous Name:</strong> {anonName}</p>

      <h3>Pod Members:</h3>
      <ul>
        {members.map((m, index) => (
          <li key={index}>🧑 Anonymous Member {index + 1}</li>
        ))}
      </ul>

      <button onClick={() => navigate(`/podchat/${podId}`)}>
        Enter Pod Chat
      </button>
    </div>
  );
};

export default PodPage;
