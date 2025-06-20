import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { FiUser, FiMessageSquare } from 'react-icons/fi';
import { FaHandsHelping } from 'react-icons/fa';
import FeedbackForm from '../pages/FeedbackForm';
import '../styles/Feedback.css';

const FeedbackPage = () => {
  const [members, setMembers] = useState([]);
  const [userPodId, setUserPodId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPodMembers = async () => {
      setIsLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const usersSnap = await getDocs(collection(db, 'users'));

        const userDoc = usersSnap.docs.find(doc => doc.id === uid);
        const podId = userDoc?.data()?.podId;

        setUserPodId(podId);

        const podMembers = usersSnap.docs
          .filter(doc => doc.data().podId === podId && doc.id !== uid)
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            color: getRandomColor()
          }));

        setMembers(podMembers);
      } catch (error) {
        console.error("Error fetching pod members:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodMembers();
  }, []);

  const getRandomColor = () => {
    const colors = [
      '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB',
      '#B5EAD7', '#C7CEEA', '#F8B195', '#F67280',
      '#6C5B7B', '#355C7D'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (isLoading) {
    return (
      <div className="feedback-loading">
        <div className="spinner"></div>
        <p>Loading your pod members...</p>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <FaHandsHelping className="header-icon" />
        <h2>Pod Feedback Circle</h2>
        <p className="subtitle">Share constructive feedback with your teammates</p>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <img src="/images/empty-feedback.svg" alt="No members" />
          <p>No members found in your pod yet</p>
          <small>Invite others to join your pod to start giving feedback</small>
        </div>
      ) : (
        <div className="member-cards">
          {members.map((member) => (
            <div key={member.id} className="member-card">
              <div
                className="member-avatar"
                style={{ backgroundColor: member.color }}
              >
                <span style={{ fontSize: '1.5rem' }}>
                  {member.avatar || '🐾'}
                </span>
              </div>
              <div className="member-info">
                <h3>{member.avatar || '🐾'} {member.anonymousName || `Anonymous ${member.id.slice(-5)}`}</h3>
                <p className="member-role">{member.role || 'Pod Member'}</p>
              </div>

              <div className="feedback-section">
                <div className="section-header">
                  <FiMessageSquare />
                  <span>Your Feedback</span>
                </div>
                <FeedbackForm podId={userPodId} memberId={member.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
