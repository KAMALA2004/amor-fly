import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import { doc, getDoc, collection, addDoc, setDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import ReflectionsBoard from './ReflectionsBoard';
import '../styles/PodPage.css';

const PodPage = () => {
  const { podId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [anonymousName, setAnonymousName] = useState('');
  const [userId, setUserId] = useState(null);
  const [progressText, setProgressText] = useState('');
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);
  const [streaks, setStreaks] = useState([]);
  const [hasProgressThisWeek, setHasProgressThisWeek] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressEntries, setProgressEntries] = useState([]);

  const currentWeekKey = format(new Date(), "yyyy-'W'II");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await loadPodData(user.uid);
      }
    });
    return () => unsubscribe();
  }, [podId]);

  const loadPodData = async (uid) => {
    try {
      const [userSnap, podSnap] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDoc(doc(db, 'pods', podId))
      ]);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setAnonymousName(data.anonymousName || 'AnonymousFox');
        setUserPoints(data.progressPoints || 0);
      }

      if (podSnap.exists()) {
        const memberUids = podSnap.data().members || [];
        const memberData = await Promise.all(
          memberUids.map(async (uid) => {
            const userDoc = await getDoc(doc(db, 'users', uid));
            const userData = userDoc.data() || {};
            return {
              uid,
              anonymousName: userData.anonymousName || 'Anonymous',
              avatar: userData.avatar || '👤'
            };
          })
        );
        setMembers(memberData);
      }

      const [matchSnap, progressSnap] = await Promise.all([
        getDoc(doc(db, 'pods', podId, 'weeklyMatches', currentWeekKey)),
        getDocs(collection(db, 'pods', podId, 'progressUpdates'))
      ]);

      if (matchSnap.exists()) setMatchInfo(matchSnap.data());

      const weekKey = format(new Date(), "yyyy-'W'II");
      let hasThisWeek = false;

      const progressData = progressSnap.docs.map(docSnap => docSnap.data());

      progressData.forEach(entry => {
        const isCurrentUser = entry.userId === uid;
        const week = format(entry.timestamp?.toDate(), "yyyy-'W'II");
        if (isCurrentUser && week === weekKey) {
          hasThisWeek = true;
        }
      });

      setProgressEntries(progressData);
      setHasProgressThisWeek(hasThisWeek);
    } catch (err) {
      console.error('Error loading pod data:', err);
    }
  };

  useEffect(() => {
    if (!members.length || !progressEntries.length) return;

    const participationMap = {};
    const weekKey = format(new Date(), "yyyy-'W'II");

    progressEntries.forEach((entry) => {
      const week = format(entry.timestamp?.toDate?.(), "yyyy-'W'II");
      if (!participationMap[entry.userId]) {
        participationMap[entry.userId] = new Set();
      }
      participationMap[entry.userId].add(week);
    });

    const calculateStreaks = async () => {
      const memberStreaks = await Promise.all(
        members.map(async member => {
          const weeks = participationMap[member.uid] || new Set();
          const userDoc = await getDoc(doc(db, 'users', member.uid));
          const name = userDoc.exists() ? userDoc.data().anonymousName || 'Anonymous' : 'Anonymous';
          const avatar = member.avatar || '👤';
          return {
            name,
            count: weeks.size,
            avatar
          };
        })
      );
      setStreaks(memberStreaks);
    };

    calculateStreaks();
  }, [members, progressEntries]);

  const handleProgressSubmit = async () => {
    if (!progressText.trim()) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const prevPoints = userSnap.exists() ? userSnap.data().progressPoints || 0 : 0;

      await Promise.all([
        addDoc(collection(db, 'pods', podId, 'progressUpdates'), {
          userId: auth.currentUser.uid,
          anonymousName,
          text: progressText,
          timestamp: new Date()
        }),
        setDoc(userRef, { progressPoints: prevPoints + 10 }, { merge: true })
      ]);

      setUserPoints(prevPoints + 10);
      setProgressText('');
      setShowProgressForm(false);
      await loadPodData(auth.currentUser.uid); // Refresh everything
    } catch (err) {
      console.error('Error sharing progress:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWeeklyMatch = async () => {
    try {
      const matchRef = doc(db, 'pods', podId, 'weeklyMatches', currentWeekKey);
      const matchSnap = await getDoc(matchRef);

      if (matchSnap.exists()) return alert('Weekly match already exists!');

      const uniqueMembers = [...new Set(members.map(m => m.uid))];
      if (uniqueMembers.length < 2) return alert('Not enough members!');

      const shuffled = [...uniqueMembers].sort(() => 0.5 - Math.random());
      const pairs = [];

      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) pairs.push({ member1: shuffled[i], member2: shuffled[i + 1] });
      }

      await setDoc(matchRef, { pairs, createdAt: new Date() });
      setMatchInfo({ pairs });
      loadPodData(auth.currentUser.uid);
    } catch (err) {
      console.error('Error creating match:', err);
    }
  };

  const getCurrentUserMatch = () => {
    const uid = auth.currentUser?.uid;
    const pair = matchInfo?.pairs?.find(
      ({ member1, member2 }) => member1 === uid || member2 === uid
    );
    return pair ? (pair.member1 === uid ? pair.member2 : pair.member1) : null;
  };

  const getMatchedPartner = () => {
    const partnerId = getCurrentUserMatch();
    return members.find(m => m.uid === partnerId) || { anonymousName: 'Anonymous', avatar: '👤' };
  };

  return (
    <div className="pod-container">
      <header className="pod-header">
        <div className="header-content">
          <h1 className="pod-title">
            <span className="pod-icon">🛖</span> Learning Pod
          </h1>
          <div className="user-controls">
            <div className="user-points">
              <span className="points-icon">✨</span>
              <span className="points-value">{userPoints}</span>
            </div>
            <button onClick={() => navigate('/profile')} className="profile-btn">
              <span className="profile-avatar">👤</span>
              <span className="profile-name">{anonymousName}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="pod-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">🌐</span> Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <span className="tab-icon">🔗</span> Connections
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reflections' ? 'active' : ''}`}
          onClick={() => setActiveTab('reflections')}
        >
          <span className="tab-icon">🧠</span> Reflections
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="tab-content">
          <section className="pod-card members-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">👥</span> Pod Members
              </h2>
              <span className="member-count">{members.length} members</span>
            </div>
            <div className="members-grid">
              {members.map((member) => (
                <div key={member.uid} className="member-card" onClick={() => member.uid !== userId && navigate(`/user/${member.uid}`)}>
                  <span className="member-avatar">{member.avatar}</span>
                  <span className="member-name">
                    {member.uid === userId ? `${member.anonymousName} (You)` : member.anonymousName}
                  </span>
                  {member.uid === userId && <span className="you-badge">YOU</span>}
                </div>
              ))}
            </div>
          </section>

          <section className="pod-card progress-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">📈</span> Weekly Progress
              </h2>
              <button 
                className={`add-progress-btn ${showProgressForm ? 'cancel' : ''}`}
                onClick={() => setShowProgressForm(!showProgressForm)}
              >
                {showProgressForm ? (
                  <>
                    <span className="btn-icon">✕</span> Cancel
                  </>
                ) : (
                  <>
                    <span className="btn-icon">+</span> Add Progress
                  </>
                )}
              </button>
            </div>
            
            {showProgressForm && (
              <div className="progress-form">
                <div className="form-header">
                  <h3>Share Your Progress</h3>
                  <p>What did you learn this week? What challenges did you face?</p>
                </div>
                <textarea
                  placeholder="This week I learned...\nMy biggest challenge was...\nNext week I want to..."
                  value={progressText}
                  onChange={(e) => setProgressText(e.target.value)}
                  rows={5}
                />
                <div className="form-footer">
                  <button 
                    className={`submit-progress-btn ${!progressText.trim() ? 'disabled' : ''}`}
                    onClick={handleProgressSubmit}
                    disabled={!progressText.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner"></span> Sharing...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">🚀</span> Share Progress (+10 pts)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="streaks-container">
              <div className="section-header">
                <h3 className="streaks-title">
                  <span className="section-icon">🔥</span> Participation Streaks
                </h3>
                <span className="streaks-subtitle">Weekly check-ins</span>
              </div>
              <div className="streaks-grid">
                {streaks.length > 0 ? (
                  streaks.map((streak, index) => (
                    <div key={index} className="streak-card">
                      <span className="streak-avatar">{streak.avatar}</span>
                      <div className="streak-info">
                        <span className="streak-name">{streak.name}</span>
                        <span className="streak-count">
                          <span className="fire-icon">🔥</span> {streak.count} week{streak.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No participation data yet</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'connections' && (
        <div className="tab-content">
          <section className="pod-card connections-section">
            <h2 className="section-title">
              <span className="section-icon">🔗</span> Weekly Connections
            </h2>
            
            {matchInfo ? (
              hasProgressThisWeek ? (
                getCurrentUserMatch() ? (
                  <div className="match-card">
                    <h3>Your Learning Buddy This Week</h3>
                    <div className="match-profile">
                      <span className="match-avatar">{getMatchedPartner().avatar}</span>
                      <span className="match-name">{getMatchedPartner().anonymousName}</span>
                    </div>
                    <button 
                      className="connect-btn"
                      onClick={() => navigate(`/weekly-connection/${podId}`)}
                    >
                      Start Conversation
                    </button>
                  </div>
                ) : (
                  <p className="no-match">No match found for you this week.</p>
                )
              ) : (
                <div className="match-prompt">
                  <p>Share your weekly progress to unlock your 1:1 match!</p>
                  <button 
                    className="progress-prompt-btn"
                    onClick={() => setShowProgressForm(true)}
                  >
                    Share Progress
                  </button>
                </div>
              )
            ) : (
              <div className="generate-match">
                <p>No weekly matches have been created yet.</p>
                <button 
                  className="generate-match-btn"
                  onClick={generateWeeklyMatch}
                >
                  Generate Weekly Matches
                </button>
              </div>
            )}

            <div className="quick-actions">
              <button 
                className="action-btn chat-btn"
                onClick={() => navigate(`/podchat/${podId}`)}
              >
                <span className="btn-icon">💬</span> Pod Chat Room
              </button>
              <button 
                className="action-btn resources-btn"
                onClick={() => navigate(`/pod/${podId}/resources`)}
              >
                <span className="btn-icon">📚</span> Resource Hub
              </button>
              <button 
                className="action-btn feedback-btn"
                onClick={() => navigate(`/feedback-form/${podId}`)}
              >
                <span className="btn-icon">✍️</span> Provide Feedback
              </button>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'reflections' && (
        <div className="tab-content">
          <section className="pod-card reflections-section">
            <h2 className="section-title">
              <span className="section-icon">🧠</span> Wall of Reflections
            </h2>
            <ReflectionsBoard podId={podId} />
          </section>
        </div>
      )}
    </div>
  );
};

export default PodPage;