import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/OneOnOneChatPage.css';

const OneOnOneChatPage = () => {
  const { podId, partnerId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [userAnonName, setUserAnonName] = useState('');
  const [userAvatar, setUserAvatar] = useState('🐾');
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        setCurrentUserId(uid);

        // Fetch user's anonymous name and avatar
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserAnonName(userData.anonymousName || 'AnonymousFox');
          setUserAvatar(userData.avatar || '🐾');
        }

        const chatId = [uid, partnerId].sort().join('_');
        const messagesRef = collection(
          db,
          'pods',
          podId,
          'oneOnOneChats',
          chatId,
          'messages'
        );

        const q = query(messagesRef, orderBy('timestamp'));
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
          setMessages(snapshot.docs.map((doc) => doc.data()));
        });

        // Cleanup chat listener
        return () => unsubscribeMessages();
      }
    });

    // Cleanup auth listener
    return () => unsubscribeAuth();
  }, [podId, partnerId]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentUserId) return;

    const chatId = [currentUserId, partnerId].sort().join('_');
    const messagesRef = collection(
      db,
      'pods',
      podId,
      'oneOnOneChats',
      chatId,
      'messages'
    );

    await addDoc(messagesRef, {
      senderId: currentUserId,
      senderAnon: userAnonName,
      senderAvatar: userAvatar,
      text: inputText.trim(),
      timestamp: new Date(),
    });

    setInputText('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <h2>🧑‍🤝‍🧑 1:1 Anonymous Chat</h2>
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.senderId === currentUserId ? 'my-message' : 'their-message'
            }`}
          >
            <strong>
              {msg.senderAvatar || '🐾'} {msg.senderAnon || 'Anonymous'}:
            </strong>{' '}
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-box">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default OneOnOneChatPage;
