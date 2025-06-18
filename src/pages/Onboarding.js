import React, { useState } from 'react';
import { db, auth } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { joinOrCreatePod } from '../utils/joinOrCreatePod';
import '../styles/Onboarding.css';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState([]);
  const [personality, setPersonality] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const skillOptions = ['Guitar', 'Cooking', 'Mindfulness', 'Writing', 'Coding', 'Photography'];
  const personalityOptions = ['Introvert', 'Extrovert', 'Ambivert'];

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleNext = () => {
    if (step === 1 && skills.length === 0) {
      alert('Please select at least one skill!');
      return;
    }
    if (step === 2 && !personality) {
      alert('Please select a personality type!');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("User not logged in");

      // Step 1: Assign to pod and get pod ID
      const podId = await joinOrCreatePod(uid, { skills });

      // Step 2: Save onboarding data
      await updateDoc(doc(db, 'users', uid), {
        skills,
        personality,
        onboardingComplete: true,
        podId,
      });

      // Step 3: Redirect to specific pod page
      alert('Onboarding complete!');
      navigate(`/pod/${podId}`);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <h2>Onboarding - Step {step}</h2>

      {step === 1 && (
        <div className="step-content">
          <h3>Select Skills You Want to Learn</h3>
          <div className="skills-grid">
            {skillOptions.map((skill) => (
              <button
                key={skill}
                className={skills.includes(skill) ? 'skill-btn selected' : 'skill-btn'}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
          <button className="next-btn" onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="step-content">
          <h3>Choose Your Personality Type</h3>
          <div className="skills-grid">
            {personalityOptions.map((type) => (
              <button
                key={type}
                className={personality === type ? 'skill-btn selected' : 'skill-btn'}
                onClick={() => setPersonality(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <button className="next-btn" onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 3 && (
        <div className="step-content">
          <h3>Review Your Details</h3>
          <p><strong>Skills:</strong> {skills.join(', ')}</p>
          <p><strong>Personality:</strong> {personality}</p>
          <button className="next-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
