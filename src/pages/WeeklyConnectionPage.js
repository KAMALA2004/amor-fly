import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import { format } from 'date-fns';
import '../styles/WeeklyConnectionPage.css';
import FeedbackForm from '../pages/FeedbackForm';

const WeeklyConnectionPage = () => {
  const { podId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [anonName, setAnonName] = useState('');
  const [matchInfo, setMatchInfo] = useState(null);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentWeekKey = format(new Date(), "yyyy-'W'II");

  // ✅ Check if progress submitted for this week
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
      console.error('❌ Error checking eligibility:', err);
    }
  };

  // ✅ Get this week's match info
  const fetchMatch = async () => {
    try {
      const matchRef = doc(db, 'pods', podId, 'weeklyMatches', currentWeekKey);
      const matchSnap = await getDoc(matchRef);
      if (matchSnap.exists()) {
        setMatchInfo(matchSnap.data());
      }
    } catch (err) {
      console.error('❌ Error fetching match:', err);
    }
  };

  // ✅ Auth listener to fetch data
  useEffect(() => {
    if (!podId) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await checkEligibility(user);

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setAnonName(userSnap.data().anonName || 'AnonymousFox');
        }

        await fetchMatch();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [podId]);

  // ✅ Find current user's match from object-based structure
  const getMatchedPartnerId = () => {
    const pair = matchInfo?.pairs?.find(
      (pair) => pair.member1 === userId || pair.member2 === userId
    );
    return pair ? (pair.member1 === userId ? pair.member2 : pair.member1) : null;
  };

  const matchedPartnerId = getMatchedPartnerId();

  if (loading) return <p>⏳ Loading your weekly connection...</p>;

  return (
    <div className="weekly-connection-page">
      <h2>🌐 Weekly 1:1 Connection</h2>

      {!eligible ? (
        <div className="locked-box">
          <p>⚠️ Please complete required activities to unlock your 1:1 connection.</p>
        </div>
      ) : (
        <div className="match-box">
          <p>👤 <strong>{anonName}</strong></p>

          {matchedPartnerId ? (
            <>
              <p>💞 Matched with: <strong>Anonymous Member ending in {matchedPartnerId.slice(-5)}</strong></p>

              {/* Chat first */}
              <button
                className="chat-btn"
                onClick={() => navigate(`/one-on-one-chat/${podId}/${matchedPartnerId}`)}
              >
                💬 Chat with your Match
              </button>

              {/* Feedback after chat */}
              <FeedbackForm podId={podId} memberId={matchedPartnerId} />
            </>
          ) : (
            <p>❌ No match assigned yet. Please check back later.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyConnectionPage;
