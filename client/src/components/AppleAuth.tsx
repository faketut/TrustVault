import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { User } from '../utils/types';

interface AppleAuthProps {
  onLogin: (user: User, token: string) => void;
}

// Apple Sign-In types
declare global {
  interface Window {
    AppleID: {
      auth: {
        signIn: (config: any) => Promise<any>;
      };
    };
  }
}

const AppleAuth: React.FC<AppleAuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    // Check if Apple Sign-In is available
    const checkAppleAvailability = () => {
      if (window.AppleID && window.AppleID.auth) {
        setIsAppleAvailable(true);
      } else {
        // Load Apple Sign-In script if not available
        loadAppleScript();
      }
    };

    const loadAppleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.onload = () => {
        if (window.AppleID && window.AppleID.auth) {
          setIsAppleAvailable(true);
        }
      };
      script.onerror = () => {
        setError('Failed to load Apple Sign-In SDK');
      };
      document.head.appendChild(script);
    };

    checkAppleAvailability();
  }, []);

  const handleAppleSignIn = async () => {
    if (!window.AppleID || !window.AppleID.auth) {
      setError('Apple Sign-In is not available. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await window.AppleID.auth.signIn({
        requestedScopes: ['name', 'email']
      });

      const { authorization, user } = response;

      if (!authorization || !authorization.code) {
        throw new Error('No authorization code received from Apple');
      }

      // Send Apple authorization data to backend
      const loginResponse = await authAPI.appleLogin({
        authorizationCode: authorization.code,
        identityToken: authorization.id_token,
        user: user || {}
      });

      const { user: userData, token } = loginResponse.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      onLogin(userData, token);
    } catch (err: any) {
      console.error('Apple Sign-In error:', err);
      if (err.error === 'popup_closed_by_user') {
        setError('Sign-in was cancelled');
      } else if (err.error === 'popup_blocked') {
        setError('Popup was blocked. Please allow popups and try again.');
      } else {
        setError(err.message || 'Apple Sign-In failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMockAppleLogin = () => {
    // Mock Apple login for development/testing
    setLoading(true);
    setError('');

    // Simulate Apple login with mock data
    const mockAppleData = {
      authorizationCode: 'mock_apple_code_' + Math.random().toString(36).substr(2, 9),
      identityToken: 'mock_identity_token',
      user: {
        id: 'mock_apple_id_' + Math.random().toString(36).substr(2, 9),
        email: 'user@privaterelay.appleid.com',
        name: {
          firstName: 'Apple',
          lastName: 'User'
        }
      }
    };

    // Simulate API call
    setTimeout(async () => {
      try {
        const response = await authAPI.appleLogin(mockAppleData);
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        onLogin(user, token);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Mock Apple login failed');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Apple Sign-In</h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          margin: '0 auto 20px', 
          backgroundColor: '#000',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          color: 'white'
        }}>
          🍎
        </div>
        <h3>Sign in with Apple</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Use your Apple ID to securely sign in
        </p>
      </div>

      {!isAppleAvailable && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Apple Sign-In SDK loading...</strong> Please wait a moment.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleAppleSignIn}
          disabled={loading || !isAppleAvailable}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {loading ? (
            'Signing in...'
          ) : (
            <>
              <span>🍎</span>
              Sign in with Apple
            </>
          )}
        </button>

        {/* Development/Testing button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleMockAppleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {loading ? 'Signing in...' : 'Mock Apple Login (Dev)'}
          </button>
        )}
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>Privacy Notice:</strong> Apple Sign-In provides enhanced privacy by allowing you to hide your email address and control what information is shared.
        </p>
        <p style={{ margin: 0 }}>
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>

      {/* Apple Sign-In Configuration */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#1976d2'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
          Setup Required:
        </p>
        <p style={{ margin: '0 0 5px 0' }}>
          • Configure Apple Sign-In in Apple Developer Console
        </p>
        <p style={{ margin: '0 0 5px 0' }}>
          • Add your domain to Apple's configuration
        </p>
        <p style={{ margin: 0 }}>
          • Update environment variables with Apple credentials
        </p>
      </div>
    </div>
  );
};

export default AppleAuth;
