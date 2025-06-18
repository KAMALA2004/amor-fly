// src/pages/PodChat.js

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { auth, db } from '../firebase/config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

const socket = io('http://localhost:5000'); // Update this to your hosted backend URL if needed

const PodChat = () => {
  const { podId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [sender, setSender] = useState('Anonymous');

  useEffect(() => {
    // Set sender from Firebase auth
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setSender(user.email || 'Anonymous');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!podId) return;

    socket.emit('join-pod', podId);

    // Listen for messages from socket
    socket.on('receive-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen to Firestore changes
    const q = query(
      collection(db, 'pods', podId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data());
      setMessages(msgs);
    });

    return () => {
      socket.disconnect();
      unsubscribeFirestore();
    };
  }, [podId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    socket.emit('send-message', {
      podId,
      text: newMessage,
      sender,
    });

    setNewMessage('');
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
          background: '#f9f9f9'
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.sender === sender ? 'right' : 'left',
              marginBottom: '10px'
            }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: '15px',
                background: msg.sender === sender ? '#9F7651' : '#ddd',
                color: msg.sender === sender ? '#fff' : '#000',
                maxWidth: '70%'
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
