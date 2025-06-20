import { useState, useEffect } from 'react';
import {
  doc,
  updateDoc,
  Timestamp,
  addDoc,
  collection,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useParams } from 'react-router-dom';

const ProgressSharePage = () => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [anonName, setAnonName] = useState('');
  const { podId } = useParams();

  useEffect(() => {
    const fetchName = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setAnonName(snap.data().anonymousName || 'AnonymousFox');
      }
    };
    fetchName();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) return alert('Please write your progress first!');
    const uid = auth.currentUser?.uid;
    if (!uid) return alert('User not logged in');
    if (!podId) return alert('Pod not found');

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'pods', podId, 'progressUpdates'), {
        userId: uid,
        anonymousName: anonName,
        text: content.trim(),
        timestamp: Timestamp.now(),
      });

      await updateDoc(doc(db, 'users', uid), {
        lastProgressDate: Timestamp.now(),
      });

      alert('✅ Progress shared successfully!');
      setContent('');
    } catch (err) {
      alert('❌ Error sharing progress: ' + err.message);
      console.error(err);
    }

    setSubmitting(false);
  };

  return (
    <div>
      <h2>📝 Share Your Learning Progress</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What did you learn or achieve today?"
        rows={5}
        style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
      />
      <br />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          padding: '10px 20px',
          marginTop: '10px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {submitting ? 'Sharing...' : '🚀 Share'}
      </button>
    </div>
  );
};

export default ProgressSharePage;
