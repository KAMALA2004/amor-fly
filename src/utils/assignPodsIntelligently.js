import { getDocs, collection, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const assignPodsIntelligently = async (uid, userSkills, userPersonality) => {
  const podsSnap = await getDocs(collection(db, 'pods'));

  let bestPod = null;
  let maxOverlap = 0;

  podsSnap.forEach((docSnap) => {
    const pod = docSnap.data();
    const podSkills = pod.skills || [];
    const podMembers = pod.members || [];

    if (podMembers.length >= 6) return;

    // Count skill overlap
    const overlap = userSkills.filter(skill => podSkills.includes(skill)).length;

    // Only consider pods with at least 1 common skill
    if (overlap > 0 && overlap > maxOverlap) {
      bestPod = { id: docSnap.id, ...pod };
      maxOverlap = overlap;
    }
  });

  if (bestPod) {
    const updatedMembers = [...bestPod.members, uid];
    const updatedSkills = Array.from(new Set([...bestPod.skills, ...userSkills]));

    await updateDoc(doc(db, 'pods', bestPod.id), {
      members: updatedMembers,
      skills: updatedSkills
    });

    return bestPod.id;
  } else {
    // Create a new pod if no suitable one exists
    const newPodRef = await addDoc(collection(db, 'pods'), {
      podName: `Pod - ${new Date().getTime()}`,
      members: [uid],
      skills: userSkills,
      personality: userPersonality,
      createdAt: serverTimestamp(),
    });

    return newPodRef.id;
  }
};
