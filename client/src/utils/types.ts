// Type definitions for the Sex Consent Contract Management System

export interface User {
  id: string;
  socialMediaId?: string; // WeChat, QQ, Weibo ID
  phoneNumber?: string; // Phone number for SMS auth
  appleId?: string; // Apple ID for Apple Sign-In
  platform: 'wechat' | 'apple' | 'phone';
  role: 'user' | 'admin' | 'lawyer';
  signCount?: number;
  revokeCount?: number;
  phoneVerification?: {
    isVerified: boolean;
    verificationCode?: string;
    codeExpiresAt?: string;
    lastSentAt?: string;
    attempts: number;
  };
  appleData?: {
    identityToken?: string;
    authorizationCode?: string;
    user?: {
      id: string;
      email?: string;
      name?: {
        firstName?: string;
        lastName?: string;
      };
    };
  };
  wechatData?: {
    unionid?: string;
    sex?: number;
    province?: string;
    city?: string;
    country?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: string;
  };
}

export interface Contract {
  contractId: string; // Unique contract identifier
  status: 'inactive' | 'active' | 'revoked';
  revokedBy?: string; // Social media ID of the party who revoked the contract
  startDateTime: string; // Contract start date and time
  endDateTime: string; // Contract end date and time
}

export interface Consent {
  partyId: string; 
  timestamp: string;
  contractId: string; // Reference to the contract
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Helper function to get user's display identifier
export const getUserDisplayId = (user: User): string => {
  // Priority order: socialMediaId, phoneNumber, appleId, id
  return user.socialMediaId || user.phoneNumber || user.appleId || user.id;
};

// Helper function to get user's display name
export const getUserDisplayName = (user: User): string => {
  return 'anonymous';
};
