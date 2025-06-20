// src/pages/PodChat.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { doc, getDoc } from 'firebase/firestore';
import { FiSend } from 'react-icons/fi';
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

const socket = io('http://localhost:5000');

const PodChat = () => {
  const { podId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [sender, setSender] = useState('Anonymous');
  const [senderId, setSenderId] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    
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
        </div>
      </div>

      <div className="messages-container">
        <div className="welcome-bubble">
          <div className="welcome-message">
            Welcome to the pod! Messages are end-to-end encrypted.
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
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="message-input"
        />
        <button
          onClick={sendMessage}
          disabled={isSending || !newMessage.trim()}
          className="send-button"
        >
          <FiSend size={20} />
        </button>
      </div>
    </div>
  );
};

export default PodChat;