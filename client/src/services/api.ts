import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const authAPI = {
  // WeChat authentication
  wechatCallback: (code: string, state?: string) => api.post('/auth/wechat/callback', { code, state }),
  refreshWechatToken: () => api.post('/auth/wechat/refresh-token'),
  
  // Phone number authentication
  sendVerificationCode: (phoneNumber: string) => api.post('/auth/phone/send-code', { phoneNumber }),
  verifyPhoneCode: (data: { phoneNumber: string; verificationCode: string; nickname: string }) => 
    api.post('/auth/phone/verify', data),
  
  // Apple Sign-In authentication
  appleLogin: (appleData: { authorizationCode: string; identityToken: string; user: any }) => 
    api.post('/auth/apple/login', appleData),
  
  // Social media authentication (legacy)
  socialLogin: (socialData: any) => api.post('/auth/social-login', socialData),
  
  // User profile management
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData: any) => api.put('/auth/profile', profileData),
  getStats: () => api.get('/auth/stats'),
};

export const contractAPI = {
  create: (contractData: any) => api.post('/consent-contracts', contractData),
  giveInitialConsent: (contractId: string) => api.post(`/consent-contracts/${contractId}/initial-consent`),
  giveOngoingConsent: (contractId: string) => api.post(`/consent-contracts/${contractId}/ongoing-consent`),
  revoke: (contractId: string) => api.post(`/consent-contracts/${contractId}/revoke`),
  delete: (contractId: string) => api.delete(`/consent-contracts/${contractId}`),
  annotate: (contractId: string, annotation: any) => api.post(`/consent-contracts/${contractId}/annotate`, annotation),
  getMyContracts: () => api.get('/consent-contracts/my-contracts'),
  getContract: (contractId: string) => api.get(`/consent-contracts/${contractId}`),
  getStatus: (contractId: string) => api.get(`/consent-contracts/${contractId}/status`),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
