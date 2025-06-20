import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [badgeEarned, setBadgeEarned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData({ id: user.uid, ...data });

            if (data.podId) {
              // Fetch progress updates
              const progressRef = collection(db, 'pods', data.podId, 'progressUpdates');
              const progressSnap = await getDocs(progressRef);
              const filtered = progressSnap.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((item) => item.userId === user.uid);

              setProgressUpdates(filtered);

              // Compute unique weeks participated
              const uniqueWeeks = new Set(
                filtered.map((item) =>
                  format(item.timestamp.toDate(), "yyyy-'W'II")
                )
              );
              setBadgeEarned(uniqueWeeks.size >= 4);

              // Fetch match history with anonymous names
              const weeklyMatchesRef = collection(db, 'pods', data.podId, 'weeklyMatches');
              const matchSnap = await getDocs(weeklyMatchesRef);
              const matchHistoryWithNames = await Promise.all(
                matchSnap.docs.map(async (docSnap) => {
                  const match = docSnap.data();
                  const pair = match.pairs?.find(
                    p => p.member1 === user.uid || p.member2 === user.uid
                  );
                  if (!pair) return null;
                  const partnerId = pair.member1 === user.uid ? pair.member2 : pair.member1;

                  const partnerSnap = await getDoc(doc(db, 'users', partnerId));
                  const partnerName = partnerSnap.exists()
                    ? partnerSnap.data().anonymousName || 'Anonymous'
                    : 'Anonymous';

                  return {
                    id: docSnap.id,
                    week: docSnap.id,
                    partnerName,
                    timestamp: match.timestamp
                  };
                })
              );

              setMatchHistory(matchHistoryWithNames.filter(Boolean));
            }
          }
        } catch (error) {
          console.error("Error loading profile data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="empty-state">
        <h2>Profile Not Found</h2>
        <p>We couldn't load your profile information.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="avatar-container">
          <div className="avatar-circle">
            {userData.avatar || '👤'}
          </div>
          {badgeEarned && (
            <div className="badge">
              <span>🏆</span>
              <span className="badge-tooltip">4+ Week Veteran</span>
            </div>
          )}
        </div>
        <h1>{userData.anonymousName || 'Anonymous User'}</h1>
        <p className="member-since">
          Member since {format(userData.joinedAt.toDate(), 'MMMM yyyy')}
        </p>
      </header>

      <div className="profile-grid">
        <section className="profile-card about-card">
          <h2 className="section-title">
            <span className="icon">👤</span> About
          </h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{userData.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Pod</span>
              <span className="info-value">{userData.podId || 'Not assigned'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Personality</span>
              <span className="info-value">{userData.personality || 'Not specified'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Skills</span>
              <span className="info-value">
                {userData.skills?.length > 0 ? (
                  <div className="skills-container">
                    {userData.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                ) : 'None listed'}
              </span>
            </div>
          </div>
        </section>

        <section className="profile-card progress-card">
          <h2 className="section-title">
            <span className="icon">📈</span> Progress Updates
          </h2>
          {progressUpdates.length > 0 ? (
            <div className="updates-list">
              {progressUpdates
                .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
                .map((update) => (
                  <div key={update.id} className="update-item">
                    <div className="update-header">
                      <span className="update-date">
                        {format(update.timestamp.toDate(), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="update-text">{update.text}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-section">
              <p>No progress updates yet.</p>
              <button className="add-update-btn">+ Add Update</button>
            </div>
          )}
        </section>

        <section className="profile-card matches-card">
          <h2 className="section-title">
            <span className="icon">🤝</span> Match History
          </h2>
          {matchHistory.length > 0 ? (
            <div className="matches-list">
              {matchHistory
                .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
                .map((match) => (
                  <div key={match.id} className="match-item">
                    <div className="match-week">Week {match.week}</div>
                    <div className="match-details">
                      <span className="match-label">Partner:</span>
                      <span className="match-partner">{match.partnerName}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-section">
              <p>No match history available.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;