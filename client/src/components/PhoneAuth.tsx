import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { User } from '../utils/types';

interface PhoneAuthProps {
  onLogin: (user: User, token: string) => void;
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone number validation (international format)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Add + if not present and not starting with country code
    if (!cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    return cleaned;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!validatePhoneNumber(formattedPhone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending verification code to:', formattedPhone);
      const response = await authAPI.sendVerificationCode(formattedPhone);
      console.log('Verification code response:', response.data);
      
      setPhoneNumber(formattedPhone);
      setStep('verify');
      setCountdown(60); // 60 seconds countdown
      setCanResend(false);
      
      // Show success message
      if (response.data.code) {
        console.log('Development mode - Verification code:', response.data.code);
      }
    } catch (err: any) {
      console.error('Send verification code error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send verification code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyPhoneCode({
        phoneNumber,
        verificationCode,
        nickname: nickname.trim()
      });
      const { user, token } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(user, token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');
    try {
      await authAPI.sendVerificationCode(phoneNumber);
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
    setNickname('');
    setError('');
  };

  if (step === 'phone') {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <h2>Phone Number Login</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Enter your phone number to receive a verification code
        </p>

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

        <form onSubmit={handleSendCode}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Phone Number:
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
              Include country code (e.g., +1 for US, +86 for China)
            </small>
          </div>

          <button
            type="submit"
            disabled={loading || !phoneNumber.trim()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Verify Phone Number</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        We sent a 6-digit code to <strong>{phoneNumber}</strong>
      </p>

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

      <form onSubmit={handleVerifyCode}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Verification Code:
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            required
            maxLength={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              textAlign: 'center',
              letterSpacing: '2px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nickname:
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your display name"
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || verificationCode.length !== 6 || !nickname.trim()}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}
        >
          {loading ? 'Verifying...' : 'Verify & Login'}
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={!canResend || loading}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: canResend ? '#ff9800' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: canResend ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
          </button>

          <button
            type="button"
            onClick={handleBackToPhone}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Change Number
          </button>
        </div>
      </form>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>Privacy Notice:</strong> Your phone number is only used for account verification and will not be shared with third parties.
        </p>
        <p style={{ margin: 0 }}>
          By continuing, you agree to our terms of service and privacy policy.
        </p>
      </div>

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#1976d2'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            🛠️ Development Mode:
          </p>
          <p style={{ margin: '0 0 5px 0' }}>
            • Check browser console for debug logs
          </p>
          <p style={{ margin: '0 0 5px 0' }}>
            • Check server console for SMS logs
          </p>
          <p style={{ margin: 0 }}>
            • Verification code will be logged to console
          </p>
        </div>
      )}
    </div>
  );
};

export default PhoneAuth;
