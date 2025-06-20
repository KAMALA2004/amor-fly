// pages/Onboarding.js
import React, { useState } from 'react';
import { db, auth } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { assignPodsIntelligently } from '../utils/assignPodsIntelligently';
import '../styles/Onboarding.css';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [anonymousName, setAnonymousName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [skills, setSkills] = useState([]);
  const [personality, setPersonality] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Expanded skill options (24 total)
  const skillOptions = [
    'Guitar', 'Piano', 'Violin', 'Singing',
    'Cooking', 'Baking', 'Mixology', 'Nutrition',
    'Mindfulness', 'Yoga', 'Meditation', 'Journaling',
    'Writing', 'Poetry', 'Blogging', 'Screenwriting',
    'Coding', 'Web Dev', 'App Dev', 'Data Science',
    'Photography', 'Videography', 'Photo Editing', 'Graphic Design',
    'Languages', 'Public Speaking', 'Debate', 'Creative Writing',
    'Drawing', 'Painting', 'Sculpting', 'Digital Art'
  ];

  // Expanded avatar options (24 emojis)
  const avatarOptions = [
    '🐬', '🦉', '🦊', '🐢', '🐱', '🐻', '🐧', '🦋',
    '🐘', '🦄', '🐝', '🦁', '🐼', '🦩', '🐙', '🦔',
    '🦜', '🦥', '🦦', '🦨', '🦚', '🦝', '🦢', '🦕'
  ];

  const personalityOptions = ['Introvert', 'Extrovert', 'Ambivert'];

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

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("User not logged in");

      const podId = await assignPodsIntelligently(uid, skills, personality);

      await setDoc(doc(db, 'users', uid), {
        anonymousName,
        avatar,
        skills,
        personality,
        onboardingComplete: true,
        podId,
        joinedAt: new Date(),
      }, { merge: true });

      navigate(`/pod/${podId}`);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="progress-bar">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className={`progress-step ${i < step ? 'completed' : ''} ${i === step ? 'active' : ''}`}
          >
            {i < step ? '✓' : i}
          </div>
        ))}
      </div>

      <div className="onboarding-card">
        {step === 1 && (
          <div className="step-content">
            <h2>Create Your Anonymous Profile</h2>
            <p className="subtitle">Choose how you'll appear to your learning pod</p>

            <div className="form-group">
              <label>Anonymous Name</label>
              <input
                type="text"
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
                placeholder="e.g., LearnerDolphin42"
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>Choose Your Spirit Animal</label>
              <div className="avatar-grid">
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className={`avatar-btn ${avatar === emoji ? 'selected' : ''}`}
                  >
                    <span className="avatar-emoji">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="button-group">
              <button className="btn next-btn" onClick={handleNext}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>What Do You Want to Learn?</h2>
            <p className="subtitle">Select skills you're interested in (choose at least one)</p>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search skills..."
                className="search-input"
              />
            </div>

            <div className="skills-grid">
              {skillOptions.map((skill) => (
                <button
                  key={skill}
                  className={`skill-btn ${skills.includes(skill) ? 'selected' : ''}`}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  {skills.includes(skill) && <span className="checkmark">✓</span>}
                </button>
              ))}
            </div>

            <div className="selected-skills-preview">
              {skills.length > 0 && (
                <>
                  <h4>Selected Skills:</h4>
                  <div className="selected-skills-tags">
                    {skills.map(skill => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="button-group">
              <button className="btn back-btn" onClick={handleBack}>Back</button>
              <button className="btn next-btn" onClick={handleNext}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h2>Your Learning Personality</h2>
            <p className="subtitle">This helps us match you with compatible learners</p>

            <div className="personality-grid">
              {personalityOptions.map((type) => (
                <button
                  key={type}
                  className={`personality-btn ${personality === type ? 'selected' : ''}`}
                  onClick={() => setPersonality(type)}
                >
                  <h3>{type}</h3>
                  <p>
                    {type === 'Introvert' && 'Prefer smaller groups and quiet environments'}
                    {type === 'Extrovert' && 'Enjoy lively discussions and group activities'}
                    {type === 'Ambivert' && 'Adapt to both quiet and social learning'}
                  </p>
                </button>
              ))}
            </div>

            <div className="button-group">
              <button className="btn back-btn" onClick={handleBack}>Back</button>
              <button className="btn next-btn" onClick={handleNext}>Continue</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <h2>Review Your Profile</h2>
            <p className="subtitle">Almost done! Check your details before submitting</p>

            <div className="review-card">
              <div className="avatar-large">{avatar}</div>
              <h3>{anonymousName}</h3>
              
              <div className="review-details">
                <div className="detail-item">
                  <span className="detail-label">Skills:</span>
                  <div className="skills-list">
                    {skills.map(skill => (
                      <span key={skill} className="skill-bubble">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Personality:</span>
                  <span className="detail-value personality-badge">{personality}</span>
                </div>
              </div>
            </div>

            <div className="button-group">
              <button className="btn back-btn" onClick={handleBack}>Back</button>
              <button className="btn submit-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span> Creating Your Pod...
                  </>
                ) : 'Complete Onboarding'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;