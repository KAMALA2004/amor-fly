import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import {
  addDoc,
  collection,
  getDoc,
  doc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/Feedback.css';

const FeedbackForm = ({ podId, memberId, onSubmitSuccess }) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [userAnonName, setUserAnonName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserAnonName(userSnap.data().anonName || 'AnonymousFox');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      alert('Please write some feedback.');
      return;
    }

    try {
      await addDoc(collection(db, 'pods', podId, 'feedback'), {
        from: auth.currentUser.uid,
        fromAnon: userAnonName,
        to: memberId,
        text: feedbackText,
        timestamp: new Date(),
      });
      setFeedbackText('');
      alert('Feedback submitted!');
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Something went wrong.');
    }
  };

  return (
    <div className="feedback-form-container">
      <h4>📝 Give Feedback</h4>
      <textarea
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        placeholder="Write something thoughtful..."
        rows="4"
      />
      <button onClick={handleSubmit}>✅ Submit Feedback</button>
    </div>
  );
};

export default FeedbackForm;
