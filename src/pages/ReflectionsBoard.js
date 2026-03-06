import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { 
  collection, addDoc, onSnapshot, query, where, 
  Timestamp, getDocs, orderBy, doc, getDoc, updateDoc, 
  increment, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';
import { FiBarChart2, FiPlus, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { FaVoteYea } from 'react-icons/fa';

import '../styles/ReflectionsBoard.css';

const ReflectionsBoard = ({ podId }) => {
  const [user, setUser] = useState(null);
  const [anonName, setAnonName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [votingPollId, setVotingPollId] = useState(null);
  const [tabId] = useState(() => Math.random().toString(36).substring(7)); // Unique ID per tab

  useEffect(() => {
    // Check if there's a stored user for this tab
    const storedUser = sessionStorage.getItem(`user_${tabId}`);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Check if this tab should handle this auth change
        // We'll use a timestamp to determine which tab gets the update
        const lastAuthTime = sessionStorage.getItem('lastAuthTime');
        const currentTime = Date.now();
        
        // If this is a new auth event and no recent auth in the last 2 seconds,
        // or if we don't have a user stored for this tab
        if (!lastAuthTime || currentTime - parseInt(lastAuthTime) > 2000 || !sessionStorage.getItem(`user_${tabId}`)) {
          sessionStorage.setItem('lastAuthTime', currentTime.toString());
          sessionStorage.setItem(`user_${tabId}`, JSON.stringify(u));
          
          setUser(u);
          
          // Get user's anonymous name
          const userRef = doc(db, 'users', u.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setAnonName(userSnap.data().anonymousName || 'Anonymous');
          }
        }
      } else {
        // Clear user data for this tab
        sessionStorage.removeItem(`user_${tabId}`);
        setUser(null);
        setAnonName('');
      }
    });

    return () => unsub();
  }, [tabId]);

  // Fetch all active polls
  useEffect(() => {
    if (!podId) return;

    const q = query(
      collection(db, 'pods', podId, 'polls'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || null
      }));
      setPolls(data);
    });

    return () => unsubscribe();
  }, [podId]);

  const handleAddOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    
    if (!pollQuestion.trim()) {
      alert('Please enter a poll question!');
      return;
    }

    const validOptions = pollOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options for the poll!');
      return;
    }

    setLoading(true);

    try {
      // Create poll options object with initial votes = 0
      const optionsObj = {};
      validOptions.forEach((opt, index) => {
        optionsObj[`opt${index}`] = {
          text: opt.trim(),
          votes: 0,
          voters: []
        };
      });

      // Set expiration date to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await addDoc(collection(db, 'pods', podId, 'polls'), {
        question: pollQuestion.trim(),
        options: optionsObj,
        createdBy: user.uid,
        createdByName: anonName,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        totalVotes: 0,
        isActive: true
      });

      // Reset form
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating poll:', err);
      alert('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionKey) => {
    if (!user) return;
    setVotingPollId(pollId);

    try {
      const pollRef = doc(db, 'pods', podId, 'polls', pollId);
      const pollDoc = await getDoc(pollRef);
      
      if (!pollDoc.exists()) return;
      
      const pollData = pollDoc.data();
      
      // Check if user has already voted on any option
      let previousVoteKey = null;
      let previousVoteOption = null;
      
      Object.keys(pollData.options).forEach(key => {
        if (pollData.options[key].voters?.includes(user.uid)) {
          previousVoteKey = key;
          previousVoteOption = pollData.options[key];
        }
      });

      // If user clicked on the same option they already voted for, remove their vote
      if (previousVoteKey === optionKey) {
        await updateDoc(pollRef, {
          [`options.${optionKey}.votes`]: increment(-1),
          [`options.${optionKey}.voters`]: arrayRemove(user.uid),
          totalVotes: increment(-1)
        });
      } 
      // If user is voting for a different option
      else {
        // If they had a previous vote, remove it
        if (previousVoteKey) {
          await updateDoc(pollRef, {
            [`options.${previousVoteKey}.votes`]: increment(-1),
            [`options.${previousVoteKey}.voters`]: arrayRemove(user.uid)
          });
        }

        // Add their vote to the new option
        await updateDoc(pollRef, {
          [`options.${optionKey}.votes`]: increment(1),
          [`options.${optionKey}.voters`]: arrayUnion(user.uid),
          totalVotes: previousVoteKey ? increment(0) : increment(1)
        });
      }
    } catch (err) {
      console.error('Error voting:', err);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setVotingPollId(null);
    }
  };

  const getUserVote = (poll) => {
    if (!user || !poll.options) return null;
    
    for (const [key, option] of Object.entries(poll.options)) {
      if (option.voters?.includes(user.uid)) {
        return key;
      }
    }
    return null;
  };

  const getVotePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const isPollExpired = (poll) => {
    if (!poll.expiresAt) return false;
    return new Date() > poll.expiresAt;
  };

  const formatExpiryDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  // Don't render anything if there's no user for this tab
  if (!user) {
    return (
      <div className="reflections-container">
        <div className="reflections-header">
          <h2 style={{ color: '#1a202c' }}>Pod Polls</h2>
        </div>
        <div className="empty-state">
          <p style={{ color: '#4a5568' }}>Please log in to view and create polls.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reflections-container">
      <div className="reflections-header">
        <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiBarChart2 className="header-icon" />
          <h2 style={{ color: '#1a202c' }}>Pod Polls</h2>
        </div>
        <button 
          className="create-poll-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <FiPlus className="button-icon" />
          {showCreateForm ? 'Cancel' : 'Create Poll'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreatePoll} className="reflection-form">
          <h3 style={{ marginBottom: '20px', color: '#1a202c' }}>Create a New Poll</h3>
          
          <div className="form-group">
            <label htmlFor="pollQuestion" style={{ color: '#2d3748', fontWeight: '600' }}>Question</label>
            <input
              type="text"
              id="pollQuestion"
              placeholder="e.g., Which topic should we learn next?"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              maxLength="200"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                color: '#1a202c',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ color: '#2d3748', fontWeight: '600' }}>Options (minimum 2, maximum 5)</label>
            {pollOptions.map((option, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  maxLength="100"
                  required={index < 2}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    color: '#1a202c',
                    backgroundColor: '#ffffff'
                  }}
                />
                {index >= 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: '8px'
                    }}
                  >
                    <FiX />
                  </button>
                )}
              </div>
            ))}
            
            {pollOptions.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  background: 'none',
                  border: '2px dashed #4f46e5',
                  color: '#4f46e5',
                  padding: '10px',
                  borderRadius: '12px',
                  width: '100%',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                + Add Option
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      )}

      <div className="reflections-wall">
        <h3 style={{ color: '#1a202c' }}>
          Active Polls
          <span className="reflection-count">{polls.length}</span>
        </h3>
        
        {polls.length === 0 ? (
          <div className="empty-state">
            <FaVoteYea style={{ fontSize: '4rem', color: '#a0aec0', marginBottom: '20px' }} />
            <p style={{ color: '#4a5568' }}>No active polls yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="reflection-cards">
            {polls.map((poll) => {
              const userVote = getUserVote(poll);
              const expired = isPollExpired(poll);
              const totalVotes = poll.totalVotes || 0;
              
              return (
                <div key={poll.id} className="reflection-card" style={{ padding: '25px' }}>
                  <div className="reflection-content" style={{ width: '100%' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ fontSize: '1.3rem', color: '#1a202c', margin: '0 0 10px 0', fontWeight: '600' }}>
                        {poll.question}
                      </h4>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          color: '#4338ca', 
                          background: '#eef2ff', 
                          padding: '4px 12px', 
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          Created by {poll.createdByName}
                        </span>
                        {poll.expiresAt && (
                          <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            color: expired ? '#b91c1c' : '#4a5568',
                            background: expired ? '#fee2e2' : '#f1f5f9',
                            padding: '4px 12px', 
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}>
                            <FiClock />
                            {formatExpiryDate(poll.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      {Object.entries(poll.options || {}).map(([key, option]) => {
                        const voteCount = option.votes || 0;
                        const percentage = getVotePercentage(voteCount, totalVotes);
                        const isUserVote = userVote === key;
                        
                        return (
                          <div key={key} style={{ position: 'relative' }}>
                            <button
                              onClick={() => !expired && handleVote(poll.id, key)}
                              disabled={expired || votingPollId === poll.id}
                              style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '14px 18px',
                                background: isUserVote ? '#eef2ff' : '#f8fafc',
                                border: isUserVote ? '2px solid #4f46e5' : '2px solid transparent',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                cursor: expired ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                zIndex: 1,
                                opacity: expired ? 0.7 : 1,
                                color: '#1a202c',
                                fontWeight: isUserVote ? '600' : '400'
                              }}
                            >
                              <span style={{ textAlign: 'left', flex: 1, color: '#1a202c' }}>{option.text}</span>
                              <span style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <span style={{ color: '#2d3748', minWidth: '80px', textAlign: 'right', fontWeight: '500' }}>
                                  {voteCount} vote{voteCount !== 1 ? 's' : ''}
                                </span>
                                <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600', color: '#4338ca' }}>
                                  {percentage}%
                                </span>
                              </span>
                            </button>
                            <div style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              height: '100%',
                              width: `${percentage}%`,
                              background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.15), rgba(124, 58, 237, 0.15))',
                              borderRadius: '12px',
                              transition: 'width 0.3s ease',
                              pointerEvents: 'none',
                              zIndex: 0
                            }} />
                          </div>
                        );
                      })}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop: '1px solid #e2e8f0'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4a5568' }}>
                        <FaVoteYea style={{ color: '#4f46e5' }} />
                        <span style={{ fontWeight: '500' }}>{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</span>
                      </span>
                      {userVote && !expired && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', fontWeight: '500' }}>
                          <FiCheck />
                          You voted
                        </span>
                      )}
                      {expired && (
                        <span style={{
                          padding: '4px 12px',
                          background: '#dc2626',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReflectionsBoard;