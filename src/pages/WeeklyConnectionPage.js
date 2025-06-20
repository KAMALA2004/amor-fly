import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import '../styles/WeeklyConnectionPage.css';

const WeeklyConnectionPage = () => {
  const { podId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [anonName, setAnonName] = useState('');
  const [partnerAnonName, setPartnerAnonName] = useState('');
  const [partnerAvatar, setPartnerAvatar] = useState('🦊');
  const [matchInfo, setMatchInfo] = useState(null);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  const currentWeekKey = format(new Date(), "yyyy-'W'II");
  const avatars = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'];

  const checkEligibility = async (user) => {
    try {
      const progressRef = collection(db, 'pods', podId, 'progressUpdates');
      const progressSnap = await getDocs(progressRef);
      const updates = progressSnap.docs.map((doc) => doc.data());

      const hasSubmitted = updates.some((update) => {
        const timestamp = update.timestamp?.toDate?.() || update.timestamp;
        return (
          update.userId === user.uid &&
          format(timestamp, "yyyy-'W'II") === currentWeekKey
        );
      });

      setEligible(hasSubmitted);
    } catch (err) {
      console.error('Error checking eligibility:', err);
    }
  };

  const fetchMatch = async () => {
    try {
      const matchRef = doc(db, 'pods', podId, 'weeklyMatches', currentWeekKey);
      const matchSnap = await getDoc(matchRef);
      if (matchSnap.exists()) {
        setMatchInfo(matchSnap.data());
      }
    } catch (err) {
      console.error('Error fetching match:', err);
    }
  };

  const getMatchedPartnerId = () => {
    const pair = matchInfo?.pairs?.find(
      (pair) => pair.member1 === userId || pair.member2 === userId
    );
    return pair ? (pair.member1 === userId ? pair.member2 : pair.member1) : null;
  };

  useEffect(() => {
    if (!podId) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await checkEligibility(user);

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setAnonName(userSnap.data().anonymousName || 'Anonymous Explorer');
        }

        await fetchMatch();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [podId]);

  const matchedPartnerId = getMatchedPartnerId();

  useEffect(() => {
    const fetchPartnerName = async () => {
      if (matchedPartnerId) {
        const partnerRef = doc(db, 'users', matchedPartnerId);
        const partnerSnap = await getDoc(partnerRef);
        if (partnerSnap.exists()) {
          const data = partnerSnap.data();
          setPartnerAnonName(data.anonymousName || 'Anonymous Partner');
          setPartnerAvatar(avatars[Math.floor(Math.random() * avatars.length)]);
        }
      }
    };

    fetchPartnerName();
  }, [matchedPartnerId]);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + ((7 - nextMonday.getDay() + 1) % 7));
      nextMonday.setHours(0, 0, 0, 0);
      
      const diff = nextMonday - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      setTimeLeft(`${days}d ${hours}h until next match`);
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 3600000); // Update every hour
    return () => clearInterval(timer);
  }, []);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Finding your weekly connection...</p>
    </div>
  );

  return (
    <div className="weekly-connection-container">
      <div className="connection-header">
        <h1>Weekly Connection</h1>
        <p className="subtitle">Your 1:1 match for this week</p>
        <div className="time-remaining">{timeLeft}</div>
      </div>

      <div className="connection-card">
        {!eligible ? (
          <div className="locked-state">
            <div className="lock-icon">🔒</div>
            <h3>Connection Locked</h3>
            <p>Complete your weekly progress update to unlock your 1:1 match</p>
            <button 
              className="primary-btn"
              onClick={() => navigate(`/pods/${podId}/progress`)}
            >
              Submit Progress Update
            </button>
          </div>
        ) : (
          <div className="match-state">
            {matchedPartnerId ? (
              <>
                <div className="match-header">
                  <h3>Your Match This Week</h3>
                  <div className="match-avatars">
                    <div className="avatar-you">🦊</div>
                    <div className="avatar-connector">💞</div>
                    <div className="avatar-partner">{partnerAvatar}</div>
                  </div>
                </div>
                
                <div className="match-details">
                  <div className="detail-card">
                    <div className="detail-label">You</div>
                    <div className="detail-value">{anonName}</div>
                  </div>
                  
                  <div className="detail-card highlight">
                    <div className="detail-label">Matched With</div>
                    <div className="detail-value">{partnerAnonName}</div>
                  </div>
                </div>

                {matchInfo?.createdAt && (
                  <div className="match-meta">
                    Matched on {new Date(matchInfo.createdAt.seconds * 1000).toLocaleDateString()}
                  </div>
                )}

                <div className="action-buttons">
                  <button 
                    className="primary-btn chat-btn"
                    onClick={() => navigate(`/one-on-one-chat/${podId}/${matchedPartnerId}`)}
                  >
                    💬 Start Chatting
                  </button>
                </div>
              </>
            ) : (
              <div className="no-match">
                <div className="search-icon">🔍</div>
                <h3>No Match Yet</h3>
                <p>We're still pairing members for this week. Check back soon!</p>
                <div className="match-info-tip">
                  <p>🔹 Matches are made weekly based on your activity</p>
                  <p>🔹 You'll only be matched with one person per week</p>
                  <p>🔹 New matches are generated every Monday</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyConnectionPage;
