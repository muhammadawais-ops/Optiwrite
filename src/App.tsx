import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import OptiWrite from './pages/OptiWrite';
import CopyElite from './pages/CopyElite';
import About from './pages/About';
import Blog from './pages/Blog';
import Article from './pages/Article';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/optiwrite" element={<OptiWrite />} />
        <Route path="/copyelite" element={<CopyElite />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<Article />} />
        <Route path="/admin" element={<Admin />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
