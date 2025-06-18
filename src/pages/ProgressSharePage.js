// pages/ProgressSharePage.js
import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const ProgressSharePage = () => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content) return alert('Please write your progress first!');
    const uid = auth.currentUser?.uid;
    if (!uid) return alert('User not logged in');

    setSubmitting(true);
    try {
      // Save progress + update lastProgressDate
      await updateDoc(doc(db, 'users', uid), {
        lastProgressDate: Timestamp.now(),
      });

      // (Optional: save content to a "progress" subcollection)
      // await addDoc(collection(db, 'users', uid, 'progress'), { content, createdAt: Timestamp.now() });

      alert('Progress shared!');
      setContent('');
    } catch (err) {
      alert('Error sharing progress: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h2>Share Your Learning Progress</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What did you learn or achieve today?"
        rows={5}
      />
      <br />
      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Sharing...' : 'Share'}
      </button>
    </div>
  );
};

export default ProgressSharePage;
