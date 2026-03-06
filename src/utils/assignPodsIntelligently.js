import {
  getDocs,
  collection,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const jaccardSimilarity = (setA, setB) => {
  const a = new Set(setA);
  const b = new Set(setB);
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
};

const getMajorityInterest = (skillMap) => {
  if (!skillMap || Object.keys(skillMap).length === 0) return null;
  return Object.entries(skillMap).sort((a, b) => b[1] - a[1])[0][0];
};

const updateSkillMap = (existingMap = {}, newSkills = []) => {
  const updated = { ...existingMap };
  newSkills.forEach(skill => {
    updated[skill] = (updated[skill] || 0) + 1;
  });
  return updated;
};

export const assignPodsIntelligently = async (uid, userSkills, userPersonality) => {
  const podsSnap = await getDocs(collection(db, 'pods'));

  console.log('=== POD ASSIGNMENT START ===');
  console.log('User ID:', uid);
  console.log('User Skills:', userSkills);
  console.log('User Personality:', userPersonality);
  console.log('Total pods found:', podsSnap.size);

  const isSingleInterest = userSkills.length === 1;
  let bestPod = null;
  let bestScore = 0;

  podsSnap.forEach((docSnap) => {
    const pod = docSnap.data();
    const podMembers = pod.members || [];
    const podSkills = pod.skills || [];
    const podType = pod.podType || 'normal';

    console.log(`--- Checking pod: ${docSnap.id} ---`);
    console.log('Pod skills:', podSkills);
    console.log('Pod members:', podMembers.length, '/ 6');
    console.log('Pod type:', podType);

    if (podMembers.length >= 6) { console.log('❌ SKIP — full'); return; }
    if (podMembers.includes(uid)) { console.log('❌ SKIP — already in pod'); return; }
    if (podType === 'overflow') { console.log('❌ SKIP — overflow'); return; }

    let score = jaccardSimilarity(userSkills, podSkills);
    console.log('Jaccard score:', score);

    if (score === 0) { console.log('❌ SKIP — no overlap'); return; }

    if (pod.personality === userPersonality) {
      score += 0.2;
      console.log('✅ Personality bonus +0.2 → score:', score);
    }

    if (isSingleInterest) {
      const majority = getMajorityInterest(pod.skillMap);
      const podFillRatio = podMembers.length / 6;
      if (majority === userSkills[0]) {
        score += 0.5 - podFillRatio * 0.2;
        console.log('✅ Majority bonus → score:', score);
      } else if (podSkills.includes(userSkills[0])) {
        score += 0.3;
        console.log('✅ Balance bonus +0.3 → score:', score);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestPod = { id: docSnap.id, ...pod };
      console.log('✅ NEW BEST POD:', docSnap.id, 'score:', score);
    }
  });

  console.log('=== RESULT ===');
  console.log('Best pod:', bestPod?.id || 'none found');
  console.log('Best score:', bestScore);

  // Case 1: matched
  if (bestPod) {
    const updatedMembers = [...new Set([...bestPod.members, uid])];
    const updatedSkillMap = updateSkillMap(bestPod.skillMap, userSkills);

    await updateDoc(doc(db, 'pods', bestPod.id), {
      members: updatedMembers,
      skills: [...new Set([...bestPod.skills, ...userSkills])],
      skillMap: updatedSkillMap,
    });

    console.log('✅ Joined pod:', bestPod.id);
    return { podId: bestPod.id, score: bestScore, type: 'matched' };
  }

  // Case 2: single interest overflow
  if (isSingleInterest) {
    let overflowMatch = null;

    podsSnap.forEach((docSnap) => {
      const pod = docSnap.data();
      if (
        pod.podType === 'overflow' &&
        (pod.skills || []).includes(userSkills[0]) &&
        (pod.members || []).length < 6
      ) {
        overflowMatch = { id: docSnap.id, ...pod };
      }
    });

    if (overflowMatch) {
      await updateDoc(doc(db, 'pods', overflowMatch.id), {
        members: [...new Set([...overflowMatch.members, uid])],
        skillMap: updateSkillMap(overflowMatch.skillMap, userSkills),
      });
      console.log('✅ Joined overflow pod:', overflowMatch.id);
      return { podId: overflowMatch.id, score: 0, type: 'overflow-joined' };
    }

    const newPodRef = await addDoc(collection(db, 'pods'), {
      podName: `Overflow · ${userSkills[0]}`,
      members: [uid],
      skills: userSkills,
      skillMap: updateSkillMap({}, userSkills),
      personality: userPersonality,
      podType: 'overflow',
      createdAt: serverTimestamp(),
    });
    console.log('🆕 Created overflow pod:', newPodRef.id);
    return { podId: newPodRef.id, score: 0, type: 'overflow-created' };
  }

  // Case 3: seed new pod
  const newPodRef = await addDoc(collection(db, 'pods'), {
    podName: `Pod · ${new Date().getTime()}`,
    members: [uid],
    skills: userSkills,
    skillMap: updateSkillMap({}, userSkills),
    personality: userPersonality,
    podType: 'normal',
    createdAt: serverTimestamp(),
  });
  console.log('🆕 Seeded new pod:', newPodRef.id);
  return { podId: newPodRef.id, score: 0, type: 'seeded' };
};