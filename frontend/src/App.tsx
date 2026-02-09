import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './views/Landing';
import ActiveSession from './views/ActiveSession';
import Done from './views/Done';
import './app.css'; // Ensure base styles

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* Helper route for manual testing/demo without NFC */}
        <Route path="/session/:id" element={<ActiveSession />} />
        <Route path="/session/:id/done" element={<Done />} />

        {/* NFC Entry Points (Simulated) */}
        <Route path="/p/nfc/start" element={<ActiveSession />} />
        <Route path="/p/nfc/done" element={<Done />} />
      </Routes>
    </Router>
  );
}

export default App;
