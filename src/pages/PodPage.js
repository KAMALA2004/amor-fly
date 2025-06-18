import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import {
  doc, getDoc, collection, addDoc, setDoc, getDocs
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/PodPage.css';
import { format } from 'date-fns';


const PodPage = () => {
  const { podId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [anonName, setAnonName] = useState('');
  const [progressText, setProgressText] = useState('');
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);

  const currentWeekKey = format(new Date(), "yyyy-'W'II");

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
            setAnonName(userSnap.data().anonName || 'LearnerFox21');
          }

          // Check if there's a match already
          const matchRef = doc(db, 'pods', podId, 'weeklyMatches', currentWeekKey);
          const matchSnap = await getDoc(matchRef);
          if (matchSnap.exists()) {
            setMatchInfo(matchSnap.data());
          }
        } catch (err) {
          console.error('Error fetching pod/user data:', err);
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
      alert('Progress shared successfully!');
    } catch (err) {
      console.error('Error sharing progress:', err);
    }
  };

  // ✅ Match generation
  const generateWeeklyMatch = async () => {
    const shuffled = [...members].sort(() => 0.5 - Math.random());
    const pairs = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i + 1]) {
        pairs.push([shuffled[i], shuffled[i + 1]]);
      }
    }

    try {
      await setDoc(doc(db, 'pods', podId, 'weeklyMatches', currentWeekKey), {
        pairs,
        createdAt: new Date()
      });
      setMatchInfo({ pairs });
      alert('Weekly 1:1 match created!');
    } catch (err) {
      console.error('Error creating match:', err);
    }
  };

  // ✅ Find match for current user
  const getCurrentUserMatch = () => {
    const uid = auth.currentUser.uid;
    const pair = matchInfo?.pairs?.find(([a, b]) => a === uid || b === uid);
    return pair?.filter((id) => id !== uid)[0]; // Get the other person
  };

  return (
    <div className="pod-container">
      <h2>🛩️ Welcome to Your Pod</h2>
      <p><strong>Pod ID:</strong> {podId}</p>
      <p><strong>Your Anonymous Name:</strong> {anonName}</p>

      <h3>👥 Pod Members</h3>
      <ul className="member-list">
        {members.map((_, index) => (
          <li key={index}>🧑 Anonymous Member {index + 1}</li>
        ))}
      </ul>

      <div className="button-group">
        <button className="chat-btn" onClick={() => navigate(`/podchat/${podId}`)}>
          💬 Enter Pod Chat
        </button>

     <button
  className="feedback-btn"
  onClick={() => navigate(`/weekly-connection/${podId}`)}
>
  🔗 Go to Weekly Connection Page
</button>
<button
  className="feedback-btn"
  onClick={() => setShowProgressForm((prev) => !prev)}
>
  📝 {showProgressForm ? 'Hide' : 'Share'} Weekly Progress
</button>

<button
  className="feedback-btn"
  onClick={() => navigate(`/feedback-form/${podId}`)}
>
  ✍️ Open Feedback Form
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

      {showMatch && matchInfo && (
        <div className="match-section">
          <h4>✨ This Week’s 1:1 Match</h4>
          {getCurrentUserMatch() ? (
            <p>You’re matched with: <strong>{getCurrentUserMatch().slice(-5)}</strong> (anonymous)</p>
          ) : (
            <p>No match found yet. Please try again later.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PodPage;
