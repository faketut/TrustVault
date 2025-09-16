import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { User } from '../utils/types';

interface WeChatLoginProps {
  onLogin: (user: User, token: string) => void;
}

// WeChat SDK types (simplified)
declare global {
  interface Window {
    wx: any;
  }
}

const WeChatLogin: React.FC<WeChatLoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWeChatInstalled, setIsWeChatInstalled] = useState(false);

  useEffect(() => {
    // Check if WeChat is installed
    if (window.wx && window.wx.isWXAppInstalled) {
      window.wx.isWXAppInstalled({
        success: () => setIsWeChatInstalled(true),
        fail: () => setIsWeChatInstalled(false)
      });
    }
  }, []);

  const handleWeChatLogin = () => {
    if (!window.wx) {
      setError('WeChat SDK not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    // Step 1: Request authorization code from WeChat
    const req = {
      scope: 'snsapi_userinfo', // Only snsapi_userinfo is allowed
      state: 'wechat_login_' + Date.now() // Random state for security
    };

    window.wx.sendAuthReq({
      ...req,
      success: (res: any) => {
        // Step 2: Send code to backend for token exchange
        handleWeChatCallback(res.code, res.state);
      },
      fail: (err: any) => {
        setLoading(false);
        if (err.errMsg.includes('cancel')) {
          setError('User cancelled WeChat login');
        } else {
          setError('WeChat login failed: ' + err.errMsg);
        }
      }
    });
  };

  const handleWeChatCallback = async (code: string, state: string) => {
    try {
      const response = await authAPI.wechatCallback(code, state);
      const { user, token } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(user, token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'WeChat authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setLoading(true);
      await authAPI.refreshWechatToken();
      setError('');
    } catch (err: any) {
      setError('Failed to refresh WeChat token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>WeChat Login</h2>
      
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
          backgroundColor: '#07c160',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          color: 'white'
        }}>
          微
        </div>
        <h3>Login with WeChat</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Use your WeChat account to securely log in
        </p>
      </div>

      {!isWeChatInstalled ? (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>WeChat not detected.</strong> Please install WeChat app to continue.
          </p>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleWeChatLogin}
          disabled={loading || !isWeChatInstalled}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#07c160',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Logging in...' : 'Login with WeChat'}
        </button>

        {/* Development/Testing button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const res = await authAPI.socialLogin({
                  socialMediaId: 'mock_wechat_' + Math.random().toString(36).slice(2, 8),
                  platform: 'wechat',
                  nickname: 'WeChat Dev',
                  avatar: 'https://via.placeholder.com/50'
                });
                const { user, token } = res.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                onLogin(user, token);
              } catch (err: any) {
                setError(err.response?.data?.error || 'Mock WeChat login failed');
              } finally {
                setLoading(false);
              }
            }}
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
            {loading ? 'Signing in...' : 'Mock WeChat Login (Dev)'}
          </button>
        )}

        <button
          onClick={handleRefreshToken}
          disabled={loading}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh WeChat Token'}
        </button>
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
          <strong>Privacy Notice:</strong> We only access your basic WeChat profile information (nickname and avatar) for account creation and identification.
        </p>
        <p style={{ margin: 0 }}>
          By logging in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
};

export default WeChatLogin;
