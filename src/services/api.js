const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://chatbot-1-gfpp.onrender.com/api');

// Helper to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('lara_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Authentication
  async register(data) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Registration failed');
    if (result.token) localStorage.setItem('lara_auth_token', result.token);
    return result;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Login failed');
    if (result.token) localStorage.setItem('lara_auth_token', result.token);
    return result;
  },

  async getMe() {
    const token = localStorage.getItem('lara_auth_token');
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      localStorage.removeItem('lara_auth_token');
      return null;
    }
    const result = await res.json();
    return result.user;
  },

  async updateProfile(data) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Profile update failed');
    return result.user;
  },

  logout() {
    localStorage.removeItem('lara_auth_token');
  },

  // Chat
  async sendMessage(message, sessionId, attachment) {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, sessionId, attachment })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || result.reply || 'Chat request failed');
    return result;
  },

  async getChatHistory(sessionId) {
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    const res = await fetch(`${API_BASE_URL}/chat/history${query}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result.history || [];
  },

  async clearChatHistory() {
    const res = await fetch(`${API_BASE_URL}/chat/history`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to clear history');
    return result;
  },

  // FAQs
  async getFAQs(category = 'all', search = '') {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE_URL}/faq?${params.toString()}`);
    if (!res.ok) return [];
    const result = await res.json();
    return result.data || [];
  },

  // Enquiry Submission
  async submitEnquiry(enquiryData) {
    const res = await fetch(`${API_BASE_URL}/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiryData)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Enquiry submission failed');
    return result;
  }
};
