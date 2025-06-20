import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import '../styles/StreaksBoard.css';

const StreaksBoard = () => {
  const { podId } = useParams();
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);

  const getWeekKey = (timestamp) => format(timestamp.toDate(), "yyyy-'W'II");

  useEffect(() => {
    const fetchStreaks = async () => {
      try {
        const progressRef = collection(db, 'pods', podId, 'progressUpdates');
        const snapshot = await getDocs(progressRef);
        const updates = snapshot.docs.map(doc => doc.data());

        // Group updates by user
        const userWeeksMap = {};
        for (const update of updates) {
          const weekKey = getWeekKey(update.timestamp);
          if (!userWeeksMap[update.userId]) {
            userWeeksMap[update.userId] = { weeks: new Set(), lastUpdate: update.timestamp };
          }
          userWeeksMap[update.userId].weeks.add(weekKey);
        }

        // Build streaks
        const streakResults = await Promise.all(
          Object.entries(userWeeksMap).map(async ([uid, data]) => {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const name = userSnap.exists() ? userSnap.data().anonymousName || 'Anonymous' : 'Anonymous';

            const count = data.weeks.size;
            let emoji, status;
            if (count >= 8) {
              emoji = '🏆';
              status = 'Legendary';
            } else if (count >= 4) {
              emoji = '🏅';
              status = 'Champion';
            } else if (count >= 2) {
              emoji = '🔥';
              status = 'On Fire';
            } else {
              emoji = '👏';
              status = 'Getting Started';
            }

            return {
              userId: uid,
              anonymousName: name,
              count,
              emoji,
              status,
              lastActive: format(data.lastUpdate.toDate(), 'MMM do')
            };
          })
        );

        setStreaks(streakResults.sort((a, b) => b.count - a.count));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching streaks:', err);
        setLoading(false);
      }
    };

    fetchStreaks();
  }, [podId]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading participation data...</p>
    </div>
  );

  return (
    <div className="streaks-board">
      <div className="header-section">
        <h2>🔥 Participation Streaks</h2>
        <p className="subtitle">Celebrating consistent engagement in our pod</p>
      </div>
      
      {streaks.length === 0 ? (
        <div className="empty-state">
          <p>No participation data yet. Check back later!</p>
        </div>
      ) : (
        <div className="streaks-grid">
          {streaks.map((member, index) => (
            <div key={index} className="streak-card">
              <div className="streak-emoji">{member.emoji}</div>
              <div className="streak-details">
                <h3>{member.anonymousName}</h3>
                <p className="streak-count">{member.count} week streak</p>
                <p className="streak-status">{member.status}</p>
                <p className="last-active">Last active: {member.lastActive}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StreaksBoard;