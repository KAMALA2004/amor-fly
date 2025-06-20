import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { collection, addDoc, onSnapshot, query, where, Timestamp, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import { FiSend, FiCheckCircle, FiFeather } from 'react-icons/fi';
import { FaQuoteLeft, FaQuoteRight } from 'react-icons/fa';

import '../styles/ReflectionsBoard.css';

const ReflectionsBoard = ({ podId }) => {
  const [user, setUser] = useState(null);
  const [anonName, setAnonName] = useState('');
  const [reflection, setReflection] = useState('');
  const [reflections, setReflections] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxChars = 280;

  const weekKey = format(new Date(), "yyyy-'W'II");
  const weekDisplay = format(new Date(), "MMMM d, yyyy");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);

        // Get user's anonymous name
        const userSnap = await getDocs(
          query(collection(db, 'users'), where('uid', '==', u.uid))
        );
        userSnap.forEach(doc => {
          const data = doc.data();
          setAnonName(data.anonymousName || 'Anonymous');
        });

        // Check if reflection already submitted
        const reflectionQuery = query(
          collection(db, 'pods', podId, 'reflections'),
          where('week', '==', weekKey),
          where('userId', '==', u.uid)
        );
        const reflectionSnap = await getDocs(reflectionQuery);
        setHasSubmitted(!reflectionSnap.empty);
      }
    });

    return () => unsub();
  }, [podId]);

  useEffect(() => {
    const q = query(
      collection(db, 'pods', podId, 'reflections'),
      where('week', '==', weekKey),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setReflections(data);
    });

    return () => unsubscribe();
  }, [podId, weekKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reflection.trim()) {
      alert("Please write something meaningful!");
      return;
    }

    try {
      await addDoc(collection(db, 'pods', podId, 'reflections'), {
        userId: user.uid,
        anonymousName: anonName,
        text: reflection.trim(),
        week: weekKey,
        timestamp: Timestamp.now()
      });
      setHasSubmitted(true);
      setReflection('');
      setCharCount(0);
    } catch (err) {
      console.error('Error adding reflection:', err);
      alert('Failed to submit reflection. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setReflection(value);
      setCharCount(value.length);
    }
  };

  const getRandomEmoji = () => {
    const emojis = ['✨', '🌟', '💡', '🌱', '🌻', '🌈', '🧠', '❤️', '🦋', '📚'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  return (
    <div className="reflections-container">
      <div className="reflections-header">
        <h2>
          <FiFeather className="header-icon" />
          Weekly Reflections
        </h2>
        <p className="week-display">{weekDisplay}</p>
      </div>

      {!hasSubmitted ? (
        <form onSubmit={handleSubmit} className="reflection-form">
          <div className="form-group">
            <label htmlFor="reflection">
              Share your thoughts for this week ({maxChars - charCount} characters left)
            </label>
            <div className="textarea-container">
              <textarea
                id="reflection"
                rows="4"
                placeholder="What insights did you gain this week? What challenged you? What are you grateful for?"
                value={reflection}
                onChange={handleInputChange}
                className={charCount === maxChars ? 'max-chars' : ''}
              />
              <div className="char-count">
                {charCount}/{maxChars}
              </div>
            </div>
          </div>
          <button type="submit" className="submit-button">
            <FiSend className="button-icon" />
            Post Reflection
          </button>
        </form>
      ) : (
        <div className="submitted-message">
          <FiCheckCircle className="success-icon" />
          <p>You've shared your reflection for this week. Thank you!</p>
        </div>
      )}

      <div className="reflections-wall">
        <h3>
          Community Reflections
          <span className="reflection-count">{reflections.length}</span>
        </h3>
        
        {reflections.length === 0 ? (
          <div className="empty-state">
            <p>No reflections yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="reflection-cards">
            {reflections.map((r) => (
              <div key={r.id} className="reflection-card">
                <div className="quote-icon left">
                  <FaQuoteLeft />
                </div>
                <div className="reflection-content">
                  <p className="reflection-text">{r.text}</p>
                  <div className="reflection-footer">
                    <span className="reflection-author">{r.anonymousName}</span>
                    <span className="reflection-emoji">{getRandomEmoji()}</span>
                  </div>
                </div>
                <div className="quote-icon right">
                  <FaQuoteRight />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReflectionsBoard;