import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  arrayUnion
} from 'firebase/firestore';

// Assign user to an existing pod or create a new one
export const assignUserToPod = async (userId, selectedSkills) => {
  try {
    const podsRef = collection(db, 'pods');
    const q = query(podsRef);
    const snapshot = await getDocs(q);

    let assignedPodId = null;

    // 1. Try to find a pod with matching skill and <6 members
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const sharedSkills = data.skills?.filter(skill => selectedSkills.includes(skill));
      const hasSpace = data.members?.length < 6;

      if (sharedSkills.length > 0 && hasSpace && !assignedPodId) {
        assignedPodId = docSnap.id;
      }
    });

    // 2. If found, add to existing pod
    if (assignedPodId) {
      const podRef = doc(db, 'pods', assignedPodId);
      await updateDoc(podRef, {
        members: arrayUnion(userId)
      });
    } else {
      // 3. Else, create new pod
      const newPodRef = await addDoc(collection(db, 'pods'), {
        members: [userId],
        skills: selectedSkills,
        createdAt: new Date()
      });
      assignedPodId = newPodRef.id;
    }

    // 4. Save podId to user
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      podId: assignedPodId
    });

    return assignedPodId;
  } catch (error) {
    console.error('Error assigning user to pod:', error);
  }
};
