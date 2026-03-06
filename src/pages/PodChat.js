// src/pages/PodChat.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { doc, getDoc } from 'firebase/firestore';
import { FiSend, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { auth, db } from '../firebase/config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import '../styles/PodChat.css';
import { filterMessage } from '../utils/messageFilters';

const socket = io('http://localhost:5000');

const PodChat = () => {
  const { podId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [sender, setSender] = useState('Anonymous');
  const [senderId, setSenderId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filterWarning, setFilterWarning] = useState(null);
  const [warningTimeout, setWarningTimeout] = useState(null);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const getAvatarColor = (id) => {
    const colors = ['#E07A5F', '#81B29A', '#F4A261', '#3D405B', '#F2CC8F'];
    return colors[id?.charCodeAt(0) % colors.length] || '#E07A5F';
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setSenderId(user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setSender(userData.anonymousName || 'Anonymous');
        } else {
          setSender('Anonymous');
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!podId) return;

    socket.emit('join-pod', podId);

    const q = query(
      collection(db, 'pods', podId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
          };
        })
        .filter((msg) => msg.text && msg.timestamp);

      setMessages(msgs);
    });

    return () => {
      socket.emit('leave-pod', podId);
      unsubscribeFirestore();
    };
  }, [podId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear warning after timeout
  const showWarning = (message, violations = []) => {
    // Create a more detailed warning message
    let detailedWarning = message;
    
    if (violations.includes('fullName') || violations.includes('personalInfo')) {
      detailedWarning = "🔒 Please don't share your real name. Use your anonymous name instead.";
    } else if (violations.includes('email')) {
      detailedWarning = "📧 Email addresses are not allowed for privacy reasons.";
    } else if (violations.includes('phone')) {
      detailedWarning = "📱 Phone numbers are not allowed for privacy reasons.";
    } else if (violations.includes('location') || violations.includes('address')) {
      detailedWarning = "📍 Please don't share your location or address.";
    } else if (violations.includes('age') || violations.includes('dob')) {
      detailedWarning = "🎂 Please don't share your age or date of birth.";
    } else if (violations.includes('creditCard') || violations.includes('ssn')) {
      detailedWarning = "💳 Financial information is not allowed.";
    }
    
    setFilterWarning(detailedWarning);
    
    // Clear previous timeout
    if (warningTimeout) {
      clearTimeout(warningTimeout);
    }
    
    // Set new timeout to clear warning after 6 seconds
    const timeout = setTimeout(() => {
      setFilterWarning(null);
    }, 6000);
    
    setWarningTimeout(timeout);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    
    // Apply filters to check message content
    const filterResult = filterMessage(newMessage);
    
    // If message is not allowed, show warning and don't send
    if (!filterResult.isAllowed) {
      showWarning(
        filterResult.warningMessage || "This message contains personal information and cannot be sent.",
        filterResult.violations
      );
      
      // Shake the input to draw attention
      const input = document.querySelector('.message-input');
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 500);
      
      return;
    }
    
    setIsSending(true);
    const messageData = {
      text: newMessage,
      sender,
      senderId,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'pods', podId, 'messages'), messageData);
      socket.emit('send-message', {
        ...messageData,
        podId,
        timestamp: new Date().toISOString(),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    // Clear warning when user starts typing again
    if (filterWarning) {
      setFilterWarning(null);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="pod-chat-container">
      <div className="chat-header">
        <div className="pod-info">
          <div 
            className="pod-avatar"
            style={{ 
              backgroundColor: getAvatarColor(podId),
              background: `linear-gradient(135deg, ${getAvatarColor(podId)} 0%, ${getAvatarColor(podId + '1')} 100%)`
            }}
          >
            {podId?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>Pod Chat</h2>
            <p>Room ID: {podId}</p>
          </div>
        </div>
        <div className="active-users">
          <span className="active-dot"></span>
          <span>Active now</span>
          <button 
            className="guidelines-toggle"
            onClick={() => setShowGuidelines(!showGuidelines)}
            style={{
              background: 'none',
              border: 'none',
              marginLeft: '10px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            <FiInfo size={18} />
          </button>
        </div>
      </div>

      {showGuidelines && (
        <div className="guidelines-panel" style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          margin: '10px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          fontSize: '14px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>📋 Community Guidelines</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
            <li>❌ No sharing personal information (name, email, phone, address)</li>
            <li>❌ No sharing age or date of birth</li>
            <li>❌ No sharing location</li>
            <li>❌ No financial information</li>
            <li>✅ Use your anonymous name only</li>
            <li>✅ Keep conversations respectful</li>
          </ul>
        </div>
      )}

      <div className="messages-container">
        <div className="welcome-bubble">
          <div className="welcome-message">
            Welcome to the pod! Messages are end-to-end encrypted.
          </div>
          <div className="community-guidelines" style={{ 
            fontSize: '0.8rem', 
            color: '#666', 
            marginTop: '5px',
            backgroundColor: '#e8f4fd',
            padding: '5px 10px',
            borderRadius: '15px',
            display: 'inline-block'
          }}>
            🔒 Privacy mode enabled - Personal info is automatically blocked
          </div>
        </div>
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message ${msg.senderId === senderId ? 'sent' : 'received'}`}
          >
            {msg.senderId !== senderId && (
              <div 
                className="user-avatar"
                style={{ 
                  backgroundColor: getAvatarColor(msg.senderId),
                  background: `linear-gradient(135deg, ${getAvatarColor(msg.senderId)} 0%, ${getAvatarColor(msg.senderId + '1')} 100%)`
                }}
              >
                {msg.sender?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="message-content">
              {msg.senderId !== senderId && (
                <div className="sender-name">{msg.sender}</div>
              )}
              <div className="message-bubble">
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        {filterWarning && (
          <div className="filter-warning" style={{
            position: 'absolute',
            top: '-70px',
            left: '0',
            right: '0',
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            animation: 'slideDown 0.3s ease, fadeOut 0.3s ease 5.7s',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <FiAlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>
                Message Blocked
              </strong>
              {filterWarning}
              <div style={{ 
                fontSize: '12px', 
                marginTop: '6px', 
                opacity: '0.9',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                paddingTop: '6px'
              }}>
                ⚡ This message was not sent to protect your privacy
              </div>
            </div>
          </div>
        )}
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className={`message-input ${filterWarning ? 'filter-violation' : ''}`}
          style={filterWarning ? { 
            borderColor: '#dc3545',
            boxShadow: '0 0 0 3px rgba(220, 53, 69, 0.25)'
          } : {}}
        />
        <button
          onClick={sendMessage}
          disabled={isSending || !newMessage.trim()}
          className="send-button"
          style={filterWarning ? { backgroundColor: '#dc3545' } : {}}
        >
          <FiSend size={20} />
        </button>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .message-input.filter-violation::placeholder {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default PodChat;