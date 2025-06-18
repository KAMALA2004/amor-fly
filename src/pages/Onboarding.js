// src/pages/Onboarding.js
import React, { useState } from 'react';
import { db, auth } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { joinOrCreatePod } from '../utils/joinOrCreatePod';
import '../styles/Onboarding.css';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [anonymousName, setAnonymousName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [skills, setSkills] = useState([]);
  const [personality, setPersonality] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const skillOptions = ['Guitar', 'Cooking', 'Mindfulness', 'Writing', 'Coding', 'Photography'];
  const personalityOptions = ['Introvert', 'Extrovert', 'Ambivert'];
  const avatarOptions = ['🐬', '🦉', '🦊', '🐢', '🐱', '🐻', '🐧'];

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleNext = () => {
    if (step === 1 && (!anonymousName || !avatar)) {
      alert('Please enter a name and select an avatar!');
      return;
    }
    if (step === 2 && skills.length === 0) {
      alert('Please select at least one skill!');
      return;
    }
    if (step === 3 && !personality) {
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

      const podId = await joinOrCreatePod(uid, { skills });

      await setDoc(doc(db, 'users', uid), {
        anonymousName,
        avatar,
        skills,
        personality,
        onboardingComplete: true,
        podId,
      }, { merge: true });

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
          <h3>Choose Your Anonymous Name & Avatar</h3>

          <label>Anonymous Name</label>
          <input
            type="text"
            value={anonymousName}
            onChange={(e) => setAnonymousName(e.target.value)}
            placeholder="e.g., LearnerDolphin42"
            className="input-field"
          />

          <label>Choose Avatar</label>
          <div className="avatar-grid">
            {avatarOptions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatar(emoji)}
                className={avatar === emoji ? 'avatar-btn selected' : 'avatar-btn'}
              >
                {emoji}
              </button>
            ))}
          </div>

          <button className="next-btn" onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 2 && (
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

      {step === 3 && (
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

      {step === 4 && (
        <div className="step-content">
          <h3>Review Your Details</h3>
          <p><strong>Anonymous Name:</strong> {anonymousName}</p>
          <p><strong>Avatar:</strong> {avatar}</p>
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
