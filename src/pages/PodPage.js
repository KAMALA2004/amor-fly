import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import {
  doc, getDoc, collection, addDoc, setDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/PodPage.css';
import { format } from 'date-fns';

const PodPage = () => {
  const { podId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]); // Array of { uid, anonName }
  const [anonName, setAnonName] = useState('');
  const [userId, setUserId] = useState(null);
  const [progressText, setProgressText] = useState('');
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);

  const currentWeekKey = format(new Date(), "yyyy-'W'II");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        try {
          // 🔹 Get current user's anon name
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const name = userSnap.data().anonName || 'LearnerFox21';
            setAnonName(name);
          }

          // 🔹 Get pod data
          const podRef = doc(db, 'pods', podId);
          const podSnap = await getDoc(podRef);

          if (podSnap.exists()) {
            const data = podSnap.data();
            const memberUids = data.members || [];

            // 🔹 Fetch anon names of all members
            const uniqueUids = [...new Set(memberUids)];
            const memberData = await Promise.all(
              uniqueUids.map(async (uid) => {
                const userDoc = await getDoc(doc(db, 'users', uid));
                const name = userDoc.exists() ? userDoc.data().anonName || 'Anonymous' : 'Anonymous';
                return { uid, anonName: name };
              })
            );
            setMembers(memberData);
          }

          // 🔹 Check for existing match
          const matchRef = doc(db, 'pods', podId, 'weeklyMatches', currentWeekKey);
          const matchSnap = await getDoc(matchRef);
          if (matchSnap.exists()) {
            setMatchInfo(matchSnap.data());
          }
        } catch (err) {
          console.error('❌ Error fetching pod/user data:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [podId]);

  // ✅ Submit progress
  const handleProgressSubmit = async () => {
    try {
      await addDoc(collection(db, 'pods', podId, 'progressUpdates'), {
        userId: auth.currentUser.uid,
        anonName,
        text: progressText,
        timestamp: new Date()
      });
      setProgressText('');
      alert('✅ Progress shared successfully!');
    } catch (err) {
      console.error('❌ Error sharing progress:', err);
    }
  };

  // ✅ Generate match using objects
  const generateWeeklyMatch = async () => {
    const uniqueMembers = [...new Set(members.map((m) => m.uid))];
    const shuffled = [...uniqueMembers].sort(() => 0.5 - Math.random());
    const pairs = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i + 1]) {
        pairs.push({ member1: shuffled[i], member2: shuffled[i + 1] });
      }
    }

    try {
      await setDoc(doc(db, 'pods', podId, 'weeklyMatches', currentWeekKey), {
        pairs,
        createdAt: new Date()
      });
      setMatchInfo({ pairs });
      alert('✅ Weekly 1:1 match created!');
    } catch (err) {
      console.error('❌ Error creating match:', err);
    }
  };

  // ✅ Get matched partner's UID
  const getCurrentUserMatch = () => {
    const uid = auth.currentUser.uid;
    const pair = matchInfo?.pairs?.find(
      ({ member1, member2 }) => member1 === uid || member2 === uid
    );
    return pair ? (pair.member1 === uid ? pair.member2 : pair.member1) : null;
  };

  return (
    <div className="pod-container">
      <h2>🛩️ Welcome to Your Pod</h2>
      <p><strong>Pod ID:</strong> {podId}</p>
      <p><strong>Your Anonymous Name:</strong> {anonName}</p>

      <h3>👥 Pod Members</h3>
      <ul className="member-list">
        {members.map((member) => (
          <li key={member.uid}>
            🧑 {member.uid === userId ? `${member.anonName} (You)` : member.anonName}
          </li>
        ))}
      </ul>

      <div className="button-group">
        <button className="chat-btn" onClick={() => navigate(`/podchat/${podId}`)}>
          💬 Enter Pod Chat
        </button>

        <button className="feedback-btn" onClick={() => navigate(`/weekly-connection/${podId}`)}>
          🔗 Go to Weekly Connection Page
        </button>

        <button className="feedback-btn" onClick={() => setShowProgressForm((prev) => !prev)}>
          📝 {showProgressForm ? 'Hide' : 'Share'} Weekly Progress
        </button>

        <button className="feedback-btn" onClick={() => navigate(`/feedback-form/${podId}`)}>
          ✍️ Open Feedback Form
        </button>

        <button className="feedback-btn" onClick={generateWeeklyMatch}>
          🔄 Generate Weekly Match
        </button>
      </div>

      {showProgressForm && (
        <div className="feedback-section">
          <textarea
            rows="4"
            placeholder="Write about your weekly learning progress..."
            value={progressText}
            onChange={(e) => setProgressText(e.target.value)}
          />
          <button className="chat-btn" onClick={handleProgressSubmit}>🚀 Submit Progress</button>
        </div>
      )}

      {matchInfo && (
        <div className="match-section">
          <h4>✨ This Week’s 1:1 Match</h4>
          {getCurrentUserMatch() ? (
            <p>You’re matched with: <strong>{getCurrentUserMatch().slice(-5)}</strong> (anonymous)</p>
          ) : (
            <p>❌ No match found yet. Please try again later.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PodPage;
