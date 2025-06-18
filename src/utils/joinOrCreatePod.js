import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

const MAX_USERS = 6;

export const joinOrCreatePod = async (uid, userData) => {
  const podsRef = collection(db, 'pods');

  // Step 1: Find existing pod with same skill & space left
  const q = query(podsRef, where('skills', 'array-contains-any', userData.skills));
  const querySnapshot = await getDocs(q);

  for (let podDoc of querySnapshot.docs) {
    const pod = podDoc.data();
    if (pod.members.length < MAX_USERS) {
      const podRef = doc(db, 'pods', podDoc.id);

      // Add user to pod
      await updateDoc(podRef, {
        members: [...pod.members, uid],
      });

      return podDoc.id; // Return pod ID
    }
  }

  // Step 2: No existing pod → create new one
  const newPod = {
    skills: userData.skills,
    members: [uid],
    createdAt: new Date(),
  };

  const podDocRef = await addDoc(podsRef, newPod);
  return podDocRef.id;
};
