// utils/assignPodsIntelligently.js
import { getDocs, collection, doc, setDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const assignPodsIntelligently = async (uid, userSkills, userPersonality) => {
  const podsSnap = await getDocs(collection(db, 'pods'));

  let bestPod = null;
  let maxScore = -1;

  podsSnap.forEach((docSnap) => {
    const pod = docSnap.data();
    const podSkills = pod.skills || [];
    const podPersonality = pod.personality || null;
    const podMembers = pod.members || [];

    if (podMembers.length >= 6) return;

    const skillOverlap = userSkills.filter((skill) => podSkills.includes(skill)).length;
    const personalityMatch = podPersonality === userPersonality ? 1 : 0;

    const score = skillOverlap * 2 + personalityMatch;
    if (score > maxScore) {
      maxScore = score;
      bestPod = { id: docSnap.id, ...pod };
    }
  });

  if (bestPod) {
    const updatedMembers = [...bestPod.members, uid];
    await updateDoc(doc(db, 'pods', bestPod.id), {
      members: updatedMembers,
    });

    return bestPod.id;
  } else {
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
