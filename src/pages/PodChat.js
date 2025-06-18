// src/pages/PodChat.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../firebase/config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const socket = io('http://localhost:5000'); // ⚠️ Make sure this matches your backend

const PodChat = () => {
  const { podId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [sender, setSender] = useState('Anonymous');

 useEffect(() => {
  const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
    if (user) {
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

    // Join socket room
    socket.emit('join-pod', podId);

    const q = query(
      collection(db, 'pods', podId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    // Firestore real-time listener
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((doc) => doc.data())
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
    if (!newMessage.trim()) return;

    const messageData = {
      text: newMessage,
      sender,
      timestamp: serverTimestamp(),
    };

    try {
      // Save to Firestore
      await addDoc(collection(db, 'pods', podId, 'messages'), messageData);

      // Emit through socket
      socket.emit('send-message', {
        ...messageData,
        podId,
        timestamp: new Date().toISOString(), // fallback for other clients
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Welcome to Pod Chat</h2>
      <p><strong>Pod ID:</strong> {podId}</p>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '10px',
          height: '300px',
          overflowY: 'scroll',
          padding: '10px',
          marginBottom: '1rem',
          background: '#f9f9f9',
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.sender === sender ? 'right' : 'left',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: '15px',
                background: msg.sender === sender ? '#9F7651' : '#ddd',
                color: msg.sender === sender ? '#fff' : '#000',
                maxWidth: '70%',
              }}
            >
              <div style={{ fontSize: '0.8rem' }}>{msg.sender}</div>
              <div>{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message"
        style={{ width: '70%', padding: '8px' }}
      />
      <button onClick={sendMessage} style={{ padding: '8px 16px', marginLeft: '10px' }}>
        Send
      </button>
    </div>
  );
};

export default PodChat;
