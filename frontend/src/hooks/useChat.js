import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leadCollected, setLeadCollected] = useState(false);
  const sessionIdRef = useRef(Date.now().toString());

  const sendMessage = useCallback(async (content, language = 'auto') => {
    if (!content.trim()) return null;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/chat', {
        message: content,
        conversationHistory: messages.map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        language: language,
        sessionId: sessionIdRef.current,
      });

      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.data.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (response.data.leadCollected) {
        setLeadCollected(true);
        setTimeout(() => setLeadCollected(false), 5000);
      }

      return botMessage;
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.response?.data?.error || 'Failed to send message');
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again or call us at +91 98765 43210',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = Date.now().toString();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    leadCollected,
    sendMessage,
    clearMessages,
    clearError,
  };
};