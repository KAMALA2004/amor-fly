import { getDocs, collection, doc, updateDoc, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const assignPodsIntelligently = async (uid, userSkills, userPersonality) => {
  const podsSnap = await getDocs(collection(db, 'pods'));

  let bestPod = null;
  let maxScore = 0;

  podsSnap.forEach((docSnap) => {
    const pod = docSnap.data();
    const podSkills = pod.skills || [];
    const podMembers = pod.members || [];

    // Skip full pods
    if (podMembers.length >= 6) return;

    // Skip if user already in pod
    if (podMembers.includes(uid)) return;

    // Count skill overlap
    const overlap = userSkills.filter(skill => podSkills.includes(skill)).length;
    if (overlap === 0) return;

    // Bonus score if personality matches
    let score = overlap;
    if (pod.personality === userPersonality) score += 2;

    if (score > maxScore) {
      bestPod = { id: docSnap.id, ...pod };
      maxScore = score;
    }
  });

  if (bestPod) {
    // ✅ Only add uid to members, keep original pod skills intact
    const updatedMembers = [...new Set([...bestPod.members, uid])];

    await updateDoc(doc(db, 'pods', bestPod.id), {
      members: updatedMembers,
    });

    return bestPod.id;
  } else {
    // Create a new pod
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