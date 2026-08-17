import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add session ID if available
    const sessionId = localStorage.getItem('chat_session_id');
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded');
    } else if (error.response?.status === 500) {
      console.error('Server error');
    }
    return Promise.reject(error);
  }
);

// Chat API
export const chatAPI = {
  sendMessage: async (message, conversationHistory, language = 'auto') => {
    const response = await apiClient.post('/chat', {
      message,
      conversationHistory,
      language,
    });
    return response.data;
  },
};

// Lead API
export const leadAPI = {
  submitLead: async (leadData) => {
    const response = await apiClient.post('/lead', leadData);
    return response.data;
  },
  
  getLeads: async (limit = 50) => {
    const response = await apiClient.get(`/lead?limit=${limit}`);
    return response.data;
  },
  
  updateLeadStatus: async (leadId, status) => {
    const response = await apiClient.put('/lead', { leadId, status });
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

// Solar Calculator (client-side)
export const solarCalculator = {
  calculateSystemSize: (monthlyBillOrUnits, type = 'bill') => {
    let units = type === 'bill' ? Math.round(monthlyBillOrUnits / 7) : monthlyBillOrUnits;
    let systemKW = units / 120;
    systemKW = Math.ceil(systemKW * 2) / 2;
    if (systemKW < 1) systemKW = 1;
    if (systemKW > 25) systemKW = 25;
    return systemKW;
  },
  
  calculateCost: (systemKW) => {
    const costPerKW = 65000;
    const totalCost = systemKW * costPerKW;
    
    let subsidy = 0;
    if (systemKW <= 3) {
      subsidy = Math.min(78000, systemKW * 26000);
    } else {
      subsidy = 78000 + (systemKW - 3) * 13000;
      subsidy = Math.min(subsidy, totalCost * 0.4);
    }
    
    return {
      totalCost,
      subsidy,
      finalCost: totalCost - subsidy,
    };
  },
  
  calculateSavings: (systemKW) => {
    const monthlyGeneration = systemKW * 120;
    const monthlySavings = monthlyGeneration * 7;
    return {
      monthlyUnits: monthlyGeneration,
      monthlySavings,
      yearlySavings: monthlySavings * 12,
    };
  },
};

// Language detection
export const detectLanguage = (text) => {
  const tamilRegex = /[\u0B80-\u0BFF]/;
  return tamilRegex.test(text) ? 'ta' : 'en';
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format number with Indian numbering system
export const formatIndianNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};