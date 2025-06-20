import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import '../styles/PodSummaryPage.css';

const PodSummaryPage = () => {
  const { podId } = useParams();
  const [groupedUpdates, setGroupedUpdates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const updatesRef = collection(db, 'pods', podId, 'progressUpdates');
        const updatesSnap = await getDocs(updatesRef);

        const allUpdates = await Promise.all(
          updatesSnap.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const userRef = doc(db, 'users', data.userId);
            const userSnap = await getDoc(userRef);
            const name = userSnap.exists() ? userSnap.data().anonymousName || 'Anonymous' : 'Anonymous';

            const timestamp = data.timestamp?.toDate?.() || new Date();
            const week = format(timestamp, "yyyy-'W'II");
            const formattedDate = format(timestamp, "MMM do, h:mm a");

            return {
              week,
              name,
              text: data.text,
              date: formattedDate,
              timestamp: timestamp.getTime()
            };
          })
        );

        // Group by week
        const grouped = {};
        allUpdates.forEach((update) => {
          if (!grouped[update.week]) {
            grouped[update.week] = [];
          }
          grouped[update.week].push(update);
        });

        // Sort updates within each week by date
        Object.keys(grouped).forEach(week => {
          grouped[week].sort((a, b) => b.timestamp - a.timestamp);
        });

        setGroupedUpdates(grouped);
        setLoading(false);
      } catch (err) {
        console.error('Error loading progress summary:', err);
        setLoading(false);
      }
    };

    fetchProgress();
  }, [podId]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading progress updates...</p>
    </div>
  );

  return (
    <div className="pod-summary-page">
      <div className="summary-header">
        <h2>📘 Progress Journal</h2>
        <p className="subtitle">Weekly updates from pod members</p>
      </div>

      {Object.keys(groupedUpdates).length === 0 ? (
        <div className="empty-state">
          <p>No progress updates yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="timeline">
          {Object.keys(groupedUpdates)
            .sort((a, b) => b.localeCompare(a)) // Newest first
            .map((week) => {
              const [year, weekNum] = week.split('W');
              return (
                <div key={week} className="week-section">
                  <div className="week-header">
                    <h3>Week {weekNum}, {year}</h3>
                  </div>
                  <div className="updates-container">
                    {groupedUpdates[week].map((update, index) => (
                      <div key={index} className="update-card">
                        <div className="update-header">
                          <span className="user-name">{update.name}</span>
                          <span className="update-date">{update.date}</span>
                        </div>
                        <div className="update-content">
                          <p>{update.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default PodSummaryPage;