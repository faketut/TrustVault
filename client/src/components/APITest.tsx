import React, { useState } from 'react';
import { healthAPI, authAPI } from '../services/api';
import { getUserDisplayId } from '../utils/types';

const APITest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, success: boolean = true) => {
    setTestResults(prev => [...prev, `${success ? '✅' : '❌'} ${message}`]);
  };

  const testHealthEndpoint = async () => {
    try {
      const response = await healthAPI.check();
      addResult(`Health check: ${response.data.status} - ${response.data.service}`);
    } catch (error: any) {
      addResult(`Health check failed: ${error.message}`, false);
    }
  };

  const testSocialLogin = async () => {
    try {
      const testUser = {
        socialMediaId: `test_${Date.now()}`,
        platform: 'wechat',
        nickname: `Test User ${Date.now()}`,
        avatar: 'https://via.placeholder.com/50'
      };
      
      const response = await authAPI.socialLogin(testUser);
      addResult(`Social login successful: ${getUserDisplayId(response.data.user)}`);
    } catch (error: any) {
      addResult(`Social login failed: ${error.response?.data?.error || error.message}`, false);
    }
  };

  const testWeChatCallback = async () => {
    try {
      const response = await authAPI.wechatCallback('test_code_123', 'test_state');
      addResult(`WeChat callback successful: ${getUserDisplayId(response.data.user)}`);
    } catch (error: any) {
      addResult(`WeChat callback failed: ${error.response?.data?.error || error.message}`, false);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    addResult('Starting API tests...');
    
    await testHealthEndpoint();
    await testSocialLogin();
    await testWeChatCallback();
    
    addResult('API tests completed!');
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>API Integration Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runAllTests}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button
          onClick={testHealthEndpoint}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Health
        </button>
        
        <button
          onClick={testSocialLogin}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Social Login
        </button>
        
        <button
          onClick={testWeChatCallback}
          style={{
            padding: '10px 20px',
            backgroundColor: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test WeChat Callback
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '4px', 
        padding: '20px' 
      }}>
        <h3>Test Results:</h3>
        {testResults.length === 0 ? (
          <p>Click "Run All Tests" to test the API integration</p>
        ) : (
          <div>
            {testResults.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '5px', 
                fontFamily: 'monospace',
                fontSize: '14px'
              }}>
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <h4>API Endpoints Available:</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>GET /api/health</strong> - Health check</li>
          <li><strong>POST /api/auth/register</strong> - User registration</li>
          <li><strong>POST /api/auth/login</strong> - User login</li>
          <li><strong>POST /api/consent-contracts</strong> - Create contract</li>
          <li><strong>POST /api/consent-contracts/:id/sign</strong> - Sign contract</li>
          <li><strong>GET /api/consent-contracts/:id/status</strong> - Check contract status</li>
        </ul>
      </div>
    </div>
  );
};

export default APITest;
