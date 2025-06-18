import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const checkEligibilityFor1to1 = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return false;

  const user = userSnap.data();
  const now = Timestamp.now();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return (
    user.onboardingComplete === true &&
    user.lastProgressDate?.toDate() > oneWeekAgo &&
    (user.feedbackGiven || []).length >= 2 &&
    (!user.lastConnectionDate || user.lastConnectionDate.toDate() <= oneWeekAgo)
  );
};
