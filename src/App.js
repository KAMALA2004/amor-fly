import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import PodPage from './pages/PodPage';
import PodChat from './pages/PodChat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* ✅ Pod details page */}
        <Route path="/pod/:podId" element={<PodPage />} />
        
        {/* ✅ Chat page with a different route */}
        <Route path="/podchat/:podId" element={<PodChat />} />
      </Routes>
    </Router>
  );
}

export default App;
