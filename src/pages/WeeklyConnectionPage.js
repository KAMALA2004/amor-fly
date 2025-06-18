import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import FeedbackForm from './FeedbackForm'; // ✅ Make sure this path is correct

const WeeklyConnectionPage = () => {
  const { podId } = useParams();
  const [userId, setUserId] = useState(null);
  const [anonName, setAnonName] = useState('');
  const [matchInfo, setMatchInfo] = useState(null);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentWeekKey = format(new Date(), "yyyy-'W'II");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !podId) return;

      setUserId(user.uid);
      await checkEligibility(user.uid);
      await fetchAnonName(user.uid);
      await fetchMatchInfo();

      setLoading(false);
    });

    return () => unsubscribe();
  }, [podId]);

  const checkEligibility = async (uid) => {
    try {
      const progressRef = collection(db, 'pods', podId, 'progressUpdates');
      const progressSnap = await getDocs(progressRef);
      const currentWeek = currentWeekKey;

      const hasSubmitted = progressSnap.docs.some((doc) => {
        const data = doc.data();
        return (
          data.userId === uid &&
          format(data.timestamp.toDate(), "yyyy-'W'II") === currentWeek
        );
      });

      setEligible(hasSubmitted);
    } catch (err) {
      console.error('❌ Error checking eligibility:', err);
    }
  };

  const fetchAnonName = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setAnonName(userSnap.data().anonName || 'AnonymousFox');
      }
    } catch (err) {
      console.error('❌ Error fetching user anon name:', err);
    }
  };

  const fetchMatchInfo = async () => {
    try {
      const matchRef = doc(db, 'pods', podId, 'weeklyMatches', currentWeekKey);
      const matchSnap = await getDoc(matchRef);
      if (matchSnap.exists()) {
        setMatchInfo(matchSnap.data());
      }
    } catch (err) {
      console.error('❌ Error fetching weekly match:', err);
    }
  };

  const getMatchedPartnerId = () => {
    const pair = matchInfo?.pairs?.find(([a, b]) => a === userId || b === userId);
    return pair?.find((id) => id !== userId);
  };

  const matchedPartnerId = getMatchedPartnerId();

  if (loading) return <p>⏳ Loading weekly connection...</p>;

  return (
    <div className="weekly-connection-page">
      <h2>🌐 Weekly 1:1 Connection</h2>

      {!eligible ? (
        <div className="locked-box">
          <p>⚠️ You haven't submitted your progress for this week yet.</p>
          <p>📌 Please go back and submit your weekly update to unlock your match.</p>
        </div>
      ) : (
        <div className="match-box">
          <p>👤 <strong>Your Anonymous Name:</strong> {anonName}</p>
          {matchedPartnerId ? (
            <>
              <p>🤝 Matched with: <strong>Anonymous Member ending in {matchedPartnerId.slice(-5)}</strong></p>
              <FeedbackForm podId={podId} memberId={matchedPartnerId} />
            </>
          ) : (
            <p>❌ No match assigned yet for this week. Try again later or ask your leader to generate it.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyConnectionPage;
