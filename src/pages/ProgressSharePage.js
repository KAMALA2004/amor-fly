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
import { useParams, useNavigate } from 'react-router-dom';

const ProgressSharePage = () => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false); // ✅ ADDED
  const [anonName, setAnonName] = useState('');
  const { podId } = useParams();
  const navigate = useNavigate();

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

      setSubmitted(true); // ✅
      navigate(`/pod/${podId}`); // ✅ Navigate back
    } catch (err) {
      alert('❌ Error sharing progress: ' + err.message);
      console.error(err);
    }

    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
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
        disabled={submitting || submitted} // ✅ disabled after submit
        style={{
          padding: '10px 20px',
          marginTop: '10px',
          background: submitted ? '#888' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: submitting || submitted ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Sharing...' : submitted ? '✅ Shared!' : '🚀 Share'}
      </button>
      <button
        onClick={() => navigate(`/pod/${podId}`)}
        style={{
          padding: '10px 20px',
          marginTop: '10px',
          marginLeft: '10px',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ← Back to Pod
      </button>
    </div>
  );
};

export default ProgressSharePage;