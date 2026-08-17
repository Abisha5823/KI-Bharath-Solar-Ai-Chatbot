import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Initialize analytics or monitoring if needed
const initAnalytics = () => {
  if (typeof window !== 'undefined') {
    // Add your analytics code here
    console.log('Solar Chatbot initialized');
  }
};

// Initialize before render
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);