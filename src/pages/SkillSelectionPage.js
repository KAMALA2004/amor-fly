import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { assignUserToPod } from '../utils/podUtils';

const SkillSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState([]);

  const skillsList = ['Cooking', 'Design', 'Coding', 'Marketing', 'Writing'];

  const handleToggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return alert('User not logged in');

    try {
      // 1. Save selected skills to user profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        skills: selectedSkills
      });

      // 2. Assign user to pod
      const podId = await assignUserToPod(user.uid, selectedSkills);

      // 3. Navigate to Pod Page
      navigate(`/pod/${podId}`);
    } catch (err) {
      console.error('Error during skill selection:', err);
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
      <button onClick={handleSubmit} disabled={selectedSkills.length === 0}>
        ✅ Continue
      </button>
    </div>
  );
};

export default SkillSelectionPage;
