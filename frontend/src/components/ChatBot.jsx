import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiMic, FiMessageSquare } from 'react-icons/fi';
import axios from 'axios';

const ChatBot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { type: 'bot', content: '✨ Vanakkam! I am Solar AI Assistant from KI BHARATH SOLAR ENERGIES. How can I help you today? You can ask about:\n\n• Solar system cost & savings 💰\n• Government subsidy details 📋\n• Battery & inverter recommendations 🔋\n• Installation process & warranty 📅\n• EMI options 💳\n\nOr just share your EB bill amount to get a custom calculation!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leadCollected, setLeadCollected] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('/api/chat', {
        message: input,
        conversationHistory: messages.map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        language: 'auto'
      });

      const botMessage = { type: 'bot', content: response.data.reply };
      setMessages(prev => [...prev, botMessage]);
      
      if (response.data.leadCollected) {
        setLeadCollected(true);
        setTimeout(() => setLeadCollected(false), 5000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again or call us at +91 98765 43210' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    { text: "💰 What's the cost for 3kW solar?" },
    { text: "📊 My EB bill is ₹3000, what system size?" },
    { text: "🏠 Subsidy details for home?" },
    { text: "🔋 Battery price for 5kW system?" },
    { text: "📅 How long does installation take?" }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-6 w-full max-w-md h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-orange-500 text-xl">☀️</span>
          </div>
          <div>
            <h3 className="font-bold">KI BHARATH Solar Expert</h3>
            <p className="text-xs opacity-90">Online • Reply in 1 min</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-orange-600 p-2 rounded-full transition">
          <FiX size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.type === 'user' 
                  ? 'bg-orange-500 text-white rounded-br-sm' 
                  : 'bg-white text-gray-700 rounded-bl-sm shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Lead Collected Banner */}
      <AnimatePresence>
        {leadCollected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-green-500 text-white text-center p-2 text-sm"
          >
            ✅ Thank you! Our team will contact you shortly
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Questions */}
      {messages.length < 3 && (
        <div className="p-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q.text)}
                className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-orange-100 transition"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Tamil or English)"
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 resize-none text-sm"
            rows="1"
            style={{ maxHeight: '80px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
          >
            <FiSend size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          We'll save your details to provide better service
        </p>
      </div>
    </motion.div>
  );
};

export default ChatBot;