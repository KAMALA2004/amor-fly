import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { collection, getDocs, doc } from 'firebase/firestore';
import FeedbackForm from '../pages/FeedbackForm';

const FeedbackPage = () => {
  const [members, setMembers] = useState([]);
  const [userPodId, setUserPodId] = useState('');

  useEffect(() => {
    const fetchPodMembers = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Get all users to find the current user's podId
      const usersSnap = await getDocs(collection(db, 'users'));
      const userDoc = usersSnap.docs.find(doc => doc.id === uid);
      const podId = userDoc?.data()?.podId;

      setUserPodId(podId); // Save for FeedbackForm usage

      // Get all users in the same pod (except self)
      const podMembers = usersSnap.docs
        .filter(doc => doc.data().podId === podId && doc.id !== uid)
        .map(doc => ({ id: doc.id, ...doc.data() }));

      setMembers(podMembers);
    };

    fetchPodMembers();
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>📢 Give Feedback to Your Pod Members</h2>

      {members.length === 0 ? (
        <p>No members found in your pod.</p>
      ) : (
        members.map((member) => (
          <div key={member.id} style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <p>👤 Anonymous Member {member.anonName || member.id.slice(-5)}</p>

            {/* Functional Feedback Form */}
            <FeedbackForm podId={userPodId} memberId={member.id} />
          </div>
        ))
      )}
    </div>
  );
};

export default FeedbackPage;
