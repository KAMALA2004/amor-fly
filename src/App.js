import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import PodPage from './pages/PodPage';
import PodChat from './pages/PodChat';
import ProgressSharePage from './pages/ProgressSharePage';
import FeedbackPage from './pages/FeedbackPage';
import WeeklyConnectionPage from './pages/WeeklyConnectionPage';
import OneOnOneChatPage from './pages/OneOnOneChatPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/pod/:podId" element={<PodPage />} />
        <Route path="/podchat/:podId" element={<PodChat />} />
        <Route path="/pod/:podId" element={<PodPage />} />
        <Route path="/weekly-connection/:podId" element={<WeeklyConnectionPage />} />
        <Route path="/feedback-form/:podId" element={<FeedbackPage />} />
        <Route path="/one-on-one-chat/:podId/:partnerId" element={<OneOnOneChatPage />} />

      </Routes>
    </Router>
  );
}

export default App;
