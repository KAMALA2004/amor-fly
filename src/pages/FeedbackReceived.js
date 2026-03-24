// Updated FeedbackReceived.js - Without requiring composite index
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { FiStar, FiMessageCircle } from 'react-icons/fi';
import '../styles/Feedback.css';

const FeedbackReceived = ({ podId }) => {
  const [receivedFeedback, setReceivedFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReceivedFeedback = async () => {
      if (!podId || !auth.currentUser) return;
      
      setIsLoading(true);
      try {
        const currentUserId = auth.currentUser.uid;
        const feedbackRef = collection(db, 'pods', podId, 'feedback');
        // Remove the where clause from the query
        const q = query(feedbackRef, orderBy('timestamp', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const feedbackList = [];
        
        querySnapshot.forEach((doc) => {
          const feedbackData = {
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          };
          // Filter in JavaScript instead of Firestore
          if (feedbackData.to === currentUserId) {
            feedbackList.push(feedbackData);
          }
        });
        
        setReceivedFeedback(feedbackList);
      } catch (error) {
        console.error("Error fetching received feedback:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReceivedFeedback();
  }, [podId]);

  if (isLoading) {
    return (
      <div className="feedback-loading-small">
        <div className="spinner"></div>
      </div>
    );
  }

  if (receivedFeedback.length === 0) {
    return (
      <div className="empty-feedback-state">
        <FiMessageCircle size={48} />
        <p>No feedback received yet</p>
        <small>When pod members give you feedback, it will appear here</small>
      </div>
    );
  }

  return (
    <div className="feedback-received-container">
      <h3 className="feedback-received-title">
        <FiStar /> Feedback Received ({receivedFeedback.length})
      </h3>
      <div className="feedback-list">
        {receivedFeedback.map((feedback) => (
          <div key={feedback.id} className="feedback-card">
            <div className="feedback-card-header">
              <div className="feedback-avatar" style={{ fontSize: '1.5rem' }}>
                {feedback.fromAvatar || '🐾'}
              </div>
              <div className="feedback-sender-info">
                <strong>{feedback.fromAnon || 'Anonymous'}</strong>
                <span className="feedback-time">
                  {feedback.timestamp?.toLocaleDateString()}
                </span>
              </div>
            </div>
            <p className="feedback-text">{feedback.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackReceived;