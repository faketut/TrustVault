import React, { useState } from 'react';
import { User } from '../utils/types';
import WeChatLogin from './WeChatLogin';
import PhoneAuth from './PhoneAuth';
import AppleAuth from './AppleAuth';

interface LoginFormProps {
  onLogin: (user: User, token: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [loginMethod, setLoginMethod] = useState<'wechat' | 'apple' | 'phone'>('wechat');

  const renderLoginMethod = () => {
    switch (loginMethod) {
      case 'wechat':
        return <WeChatLogin onLogin={onLogin} />;
      case 'apple':
        return <AppleAuth onLogin={onLogin} />;
      case 'phone':
        return <PhoneAuth onLogin={onLogin} />;
      default:
        return <WeChatLogin onLogin={onLogin} />;
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#1976d2',
          marginBottom: '10px'
        }}>
          Sex Consent Contract
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#666',
          marginBottom: '30px'
        }}>
          Choose your preferred login method
        </p>
      </div>

      {/* Login Method Tabs */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <button
          onClick={() => setLoginMethod('wechat')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: loginMethod === 'wechat' ? '#07c160' : 'transparent',
            color: loginMethod === 'wechat' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s ease',
            borderBottom: loginMethod === 'wechat' ? '2px solid #07c160' : '2px solid transparent'
          }}
        >
          💬 WeChat
        </button>
        <button
          onClick={() => setLoginMethod('apple')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: loginMethod === 'apple' ? '#000' : 'transparent',
            color: loginMethod === 'apple' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s ease',
            borderBottom: loginMethod === 'apple' ? '2px solid #000' : '2px solid transparent'
          }}
        >
          🍎 Apple ID
        </button>
        <button
          onClick={() => setLoginMethod('phone')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: loginMethod === 'phone' ? '#1976d2' : 'transparent',
            color: loginMethod === 'phone' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.3s ease',
            borderBottom: loginMethod === 'phone' ? '2px solid #1976d2' : '2px solid transparent'
          }}
        >
          📱 Phone
        </button>
      </div>

      {/* Login Method Content */}
      <div style={{ 
        minHeight: '400px',
        padding: '20px',
        backgroundColor: '#fafafa',
        borderRadius: '0 0 8px 8px',
        border: '1px solid #e0e0e0',
        borderTop: 'none'
      }}>
        {renderLoginMethod()}
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#666'
      }}>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>Privacy & Security:</strong> Your data is encrypted and protected.
        </p>
        <p style={{ margin: 0 }}>
          By logging in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;