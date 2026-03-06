import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { assignPodsIntelligently } from '../utils/assignPodsIntelligently';

const SkillSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState('INTJ');

  const skillsList = [
    'Guitar', 'Piano', 'Violin', 'Singing',
    'Cooking', 'Baking', 'Mixology', 'Nutrition',
    'Mindfulness', 'Yoga', 'Meditation', 'Journaling',
    'Writing', 'Poetry', 'Blogging', 'Screenwriting',
    'Coding', 'Web Dev', 'App Dev', 'Data Science',
    'Photography', 'Videography', 'Photo Editing', 'Graphic Design',
    'Languages', 'Public Speaking', 'Debate', 'Creative Writing',
    'Drawing', 'Painting', 'Sculpting', 'Digital Art'
  ];

  // Fetch personality from Firestore if it exists
  useEffect(() => {
    const fetchPersonality = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.personality) setPersonality(data.personality);
      }
    };
    fetchPersonality();
  }, []);

  const handleToggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return alert('User not logged in');

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);

      // 1. Save skills to user profile
      await updateDoc(userRef, { skills: selectedSkills });

      // 2. Run Jaccard pod assignment
      const result = await assignPodsIntelligently(
        user.uid,
        selectedSkills,
        personality
      );

      console.log('Pod assignment:', result);
      // result = { podId: "abc123", score: 0.67, type: "matched" }

      // 3. Save ONLY the podId string to Firestore ← this was the bug
      await updateDoc(userRef, { podId: result.podId });

      // 4. Navigate to pod page
      navigate(`/pod/${result.podId}`);

    } catch (err) {
      console.error('Error during skill selection:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skill-selection-page">
      <h2>🛫 Select Your Skills</h2>
      <div className="skills-list">
        {skillsList.map((skill) => (
          <label key={skill}>
            <input
              type="checkbox"
              value={skill}
              checked={selectedSkills.includes(skill)}
              onChange={() => handleToggleSkill(skill)}
            />
            {skill}
          </label>
        ))}
      </div>
      <p>{selectedSkills.length} skill(s) selected</p>
      <button
        onClick={handleSubmit}
        disabled={selectedSkills.length === 0 || loading}
      >
        {loading ? '⏳ Finding your pod...' : '✅ Continue'}
      </button>
    </div>
  );
};

export default SkillSelectionPage;