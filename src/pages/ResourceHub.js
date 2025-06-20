// React imports
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Firebase imports
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

// Icons from react-icons
import { FaYoutube, FaMedium, FaGithub, FaFilePdf } from 'react-icons/fa';
import { FiLink2, FiArrowLeft, FiPlus, FiExternalLink } from 'react-icons/fi';

import '../styles/ResourceHub.css';

const ResourceHub = () => {
  const { podId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    resourceLink: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [resources, setResources] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxCharLength = 500;

  const getLinkIcon = (link) => {
    if (link.includes('youtube.com') || link.includes('youtu.be')) return <FaYoutube className="link-icon youtube" />;
    if (link.includes('medium.com')) return <FaMedium className="link-icon medium" />;
    if (link.includes('github.com')) return <FaGithub className="link-icon github" />;
    if (link.includes('.pdf')) return <FaFilePdf className="link-icon pdf" />;
    return <FiLink2 className="link-icon default" />;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.resourceLink.trim()) {
      newErrors.resourceLink = 'Resource link is required';
    } else if (!/^https?:\/\//i.test(formData.resourceLink)) {
      newErrors.resourceLink = 'Please enter a valid URL (include http:// or https://)';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > maxCharLength) {
      newErrors.description = `Description must be less than ${maxCharLength} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShare = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'pods', podId, 'resources'), {
        userId: auth.currentUser.uid,
        link: formData.resourceLink,
        description: formData.description,
        createdAt: serverTimestamp(),
      });

      setFormData({
        resourceLink: '',
        description: ''
      });
      setCharCount(0);
    } catch (err) {
      console.error('Error sharing resource:', err);
      alert('Failed to share resource. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'description') {
      setCharCount(value.length);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'pods', podId, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setResources(data);
    });

    return () => unsubscribe();
  }, [podId]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateLink = (link) => {
    try {
      const url = new URL(link);
      return `${url.hostname}${url.pathname.length > 20 ? '...' : url.pathname}`;
    } catch {
      return link.length > 30 ? `${link.substring(0, 30)}...` : link;
    }
  };

  return (
    <div className="resource-hub-container">
      <div className="resource-header">
        <button onClick={() => navigate(`/pod/${podId}`)} className="back-button">
          <FiArrowLeft size={18} />
          Back to Pod
        </button>
        <h2>Resource Sharing Hub</h2>
        <div className="header-decoration"></div>
      </div>

      <div className="resource-content">
        <form onSubmit={handleShare} className="resource-form">
          <div className="form-header">
            <FiPlus className="form-icon" />
            <h3>Share a New Resource</h3>
          </div>

          <div className="input-group">
            <label htmlFor="resourceLink">Resource Link</label>
            <input
              type="url"
              id="resourceLink"
              name="resourceLink"
              value={formData.resourceLink}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className={errors.resourceLink ? 'input-error' : ''}
            />
            {errors.resourceLink && (
              <span className="error-message">{errors.resourceLink}</span>
            )}
          </div>

          <div className="input-group">
            <div className="label-container">
              <label htmlFor="description">Description</label>
              <span className={`char-counter ${charCount > maxCharLength * 0.9 ? 'warning' : ''}`}>
                {charCount}/{maxCharLength}
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What's this resource about? Why is it valuable?"
              className={errors.description ? 'input-error' : ''}
            />
            {errors.description && (
              <span className="error-message">{errors.description}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Sharing...
              </>
            ) : (
              'Share Resource'
            )}
          </button>
        </form>

        <div className="resource-list">
          <div className="list-header">
            <h3>Shared Resources</h3>
            <span className="resource-count">
              {resources.length} {resources.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {resources.length === 0 ? (
            <div className="empty-state">
              <img src="/images/empty-resources.svg" alt="No resources" />
              <p>No resources shared yet</p>
              <small>Be the first to share something valuable!</small>
            </div>
          ) : (
            <div className="resource-cards">
              {resources.map((res) => (
                <div key={res.id} className="resource-card">
                  <div className="card-header">
                    {getLinkIcon(res.link)}
                    <span className="date">{formatDate(res.createdAt)}</span>
                  </div>
                  <h4 className="resource-title">{res.description}</h4>
                  <a
                    href={res.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-link"
                    title={res.link}
                  >
                    {truncateLink(res.link)}
                    <FiExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceHub;