import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCopy, FiCheck, FiVolume2 } from 'react-icons/fi';

const ChatMessage = ({ message, isUser, timestamp }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speakMessage = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = /[\u0B80-\u0BFF]/.test(message) ? 'ta-IN' : 'en-IN';
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  // Render numbers and calculations nicely
  const renderMessage = () => {
    // Check if message contains calculation results
    const kwMatch = message.match(/(\d+(?:\.\d+)?)\s*kW/);
    const priceMatch = message.match(/₹\s*([\d,]+)/);
    const subsidyMatch = message.match(/subsidy.*?₹\s*([\d,]+)/i);
    
    if (kwMatch || priceMatch) {
      // Split message and add highlighting
      let parts = message.split(/(₹[\d,]+|\d+(?:\.\d+)?\s*kW|\d+\s*%|[\d,]+(?:\s*units)?)/g);
      return parts.map((part, index) => {
        if (part.match(/₹[\d,]+/)) {
          return <span key={index} className="font-bold text-green-600">{part}</span>;
        }
        if (part.match(/\d+(?:\.\d+)?\s*kW/)) {
          return <span key={index} className="font-bold text-orange-600">{part}</span>;
        }
        if (part.match(/\d+\s*%/)) {
          return <span key={index} className="font-bold text-blue-600">{part}</span>;
        }
        if (part.match(/[\d,]+(?:\s*units)?/)) {
          return <span key={index} className="font-semibold text-purple-600">{part}</span>;
        }
        return <span key={index}>{part}</span>;
      });
    }
    return message;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs">
              ☀️
            </div>
            <span className="text-xs text-gray-500">Solar Assistant</span>
          </div>
        )}
        
        {/* Message Bubble */}
        <div
          className={`relative p-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap break-words">
            {renderMessage()}
          </div>
          
          {/* Action Buttons (for bot messages only) */}
          {!isUser && (
            <div className="absolute -bottom-6 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={copyToClipboard}
                className="text-xs text-gray-400 hover:text-gray-600 p-1"
                title="Copy message"
              >
                {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
              </button>
              <button
                onClick={speakMessage}
                className={`text-xs p-1 ${isSpeaking ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
                title="Listen to message"
              >
                <FiVolume2 size={12} />
              </button>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(timestamp)}
        </div>
      </div>
      
      {/* User Avatar */}
      {isUser && (
        <div className="order-1 ml-2">
          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
            👤
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;