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
  const [userAvatar, setUserAvatar] = useState('🐾');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserAnonName(userData.anonymousName || 'AnonymousFox');
          setUserAvatar(userData.avatar || '🐾');
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

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'pods', podId, 'feedback'), {
        from: auth.currentUser.uid,
        fromAnon: userAnonName,
        fromAvatar: userAvatar,
        to: memberId,
        text: feedbackText.trim(),
        timestamp: new Date(),
      });
      setFeedbackText('');
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-form-container">
      <div className="feedback-form-header">
        <h4>📝 Give Feedback</h4>
        <p className="feedback-form-subtitle">Your feedback will be shared anonymously</p>
      </div>
      <textarea
        className="feedback-textarea"
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        placeholder="Write something thoughtful..."
        rows="4"
      />
      <button 
        className="feedback-submit-btn"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="feedback-spinner"></span>
        ) : (
          '✅ Submit Feedback'
        )}
      </button>
    </div>
  );
};

export default FeedbackForm;
